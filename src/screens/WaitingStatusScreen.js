import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';

const LoadingState = () => (
    <View style={styles.container}>
        <View style={styles.loadingHeading} />
        <View style={styles.loadingDescription} />
        {[...Array(3)].map((_, i) => (
            <View key={i} style={styles.loadingRequestCard} />
        ))}
    </View>
);

const WaitingStatusScreen = () => {
  const [userRequests, setUserRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigation = useNavigation();

  const fetchUserRequests = useCallback(async () => {
    setLoading(true);

    // Get current user ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      Alert.alert('Error', 'Failed to get current user.');
      setLoading(false);
      return;
    }
    setCurrentUserId(user.id);

    // Fetch groups with requests array NOT null (has requests)
    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, requests')
      .not('requests', 'is', null);

    if (groupsError) {
      Alert.alert('Error', 'Failed to load join requests.');
      setLoading(false);
      return;
    }

    // Filter the requests in groups to only those made by current user
    const filteredRequests = [];
    for (const group of groupsData) {
      if (!group.requests) continue;
      const req = group.requests.find(r => r.userId === user.id);
      if (req) {
        filteredRequests.push({
          groupId: group.id,
          groupName: group.name,
          status: req.status,
          requestedAt: req.requestedAt,
          requestId: req.id, // Pass the requestId here
        });
      }
    }

    setUserRequests(filteredRequests);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUserRequests();
  }, [fetchUserRequests]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserRequests();
    setRefreshing(false);
  };

  const cancelRequest = (groupId, requestId) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel your join request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              // Fetch current group's requests and created_by
              const { data: group, error: groupError } = await supabase
                .from('groups')
                .select('requests, created_by')
                .eq('id', groupId)
                .single();

              if (groupError || !group) {
                Alert.alert('Error', 'Failed to fetch group data.');
                return;
              }

              // Remove the user's request from the group's requests array
              const updatedRequests = group.requests.filter(
                (r) => r.userId !== currentUserId
              );

              // Update group requests in DB
              const { error: updateGroupError } = await supabase
                .from('groups')
                .update({ requests: updatedRequests })
                .eq('id', groupId);

              if (updateGroupError) {
                Alert.alert('Error', 'Failed to cancel request.');
                return;
              }

              // Now, remove the corresponding notification from the group creator's profile
              if (group.created_by) {
                const { data: creatorProfile, error: creatorProfileError } = await supabase
                  .from('profiles')
                  .select('notifications')
                  .eq('id', group.created_by)
                  .single();

                if (creatorProfileError) {
                  console.error('Error fetching creator profile:', creatorProfileError);
                } else if (creatorProfile && creatorProfile.notifications) {
                  const updatedCreatorNotifications = creatorProfile.notifications.filter(
                    (notif) => !(notif.type === 'join_request' && notif.requestId === requestId)
                  );

                  const { error: updateCreatorNotifError } = await supabase
                    .from('profiles')
                    .update({ notifications: updatedCreatorNotifications })
                    .eq('id', group.created_by);

                  if (updateCreatorNotifError) {
                    console.error('Error updating creator notifications:', updateCreatorNotifError);
                  }
                }
              }

              // Clear the requestedgroupid from the user's profile
              const { error: updateProfileError } = await supabase
                .from('profiles')
                .update({ requestedgroupid: null })
                .eq('id', currentUserId);

              if (updateProfileError) {
                console.error('Error clearing requestedgroupid:', updateProfileError);
              }

              // Refresh list and navigate to NoGroupScreen
              navigation.reset({
                index: 0,
                routes: [{ name: 'NoGroupScreen' }],
              });

              Alert.alert('Success', 'Your join request has been cancelled.');
            } catch (err) {
              Alert.alert('Error', 'Something went wrong.');
              console.error(err);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', 'Failed to sign out');
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
    }
  };


  const renderRequest = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.groupName}>{item.groupName}</Text>
        <Text style={styles.requestInfoLabel}>Status:</Text>
        <Text style={styles.statusText(item.status)}>{item.status}</Text>
        <Text style={styles.requestInfoLabel}>Requested on:</Text>
        <Text style={styles.requestDate}>
          {new Date(item.requestedAt).toLocaleString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => cancelRequest(item.groupId, item.requestId)}
      >
        <Text style={styles.cancelButtonText}>Cancel Request</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <LoadingState />;
  }

  if (userRequests.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyText}>You have no pending join requests.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your Join Requests</Text>
      <Text style={styles.description}>
        Here you can track the status of your group join requests and cancel them if needed.
      </Text>
      <FlatList
        data={userRequests}
        keyExtractor={(item) => item.groupId}
        renderItem={renderRequest}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 16 }}
      />
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

export default WaitingStatusScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 16, color: '#1f2937' },
  description: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 12,
  },
  requestCard: {
    backgroundColor: '#2d3748',
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  groupName: {
    fontWeight: '700',
    fontSize: 18,
    color: '#f9fafb',
    marginBottom: 8,
  },

  requestInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d1d5db',
    marginTop: 4,
  },
  statusText: (status) => ({
    fontWeight: '700',
    fontSize: 14,
    color:
      status === 'approved'
        ? '#34d399'
        : status === 'rejected'
          ? '#f87171'
          : '#fbbf24',
    marginBottom: 4,
  }),
  requestDate: {
    fontSize: 14,
    color: '#9ca3af',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginLeft: 12,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#4b5563',
  },
  signOutButton: {
    backgroundColor: '#1f2937',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 40,
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingHeading: {
    width: '70%',
    height: 25,
    backgroundColor: '#d1d5db',
    borderRadius: 5,
    marginBottom: 16,
  },
  loadingDescription: {
    width: '90%',
    height: 15,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    marginBottom: 12,
  },
  loadingRequestCard: {
    height: 120,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    marginBottom: 14,
  },
});
