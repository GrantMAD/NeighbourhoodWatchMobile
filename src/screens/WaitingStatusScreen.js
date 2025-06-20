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

  const cancelRequest = (groupId) => {
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
              // Fetch current group's requests
              const { data: group, error: groupError } = await supabase
                .from('groups')
                .select('requests')
                .eq('id', groupId)
                .single();

              if (groupError || !group) {
                Alert.alert('Error', 'Failed to fetch group data.');
                return;
              }

              // Remove the user's request
              const updatedRequests = group.requests.filter(
                (r) => r.userId !== currentUserId
              );

              // Update group requests in DB
              const { error: updateError } = await supabase
                .from('groups')
                .update({ requests: updatedRequests })
                .eq('id', groupId);

              if (updateError) {
                Alert.alert('Error', 'Failed to cancel request.');
                return;
              }

              // Refresh list
              fetchUserRequests();

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
        onPress={() => cancelRequest(item.groupId)}
      >
        <Text style={styles.cancelButtonText}>Cancel Request</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#22d3ee" />
      </View>
    );
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
  container: { flex: 1, padding: 16, backgroundColor: '#1f2937' },
  center: { justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 16, color: 'white' },
  description: {
    fontSize: 16,
    color: '#d1d5db',
    marginBottom: 12,
  },
  requestCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupName: {
    fontWeight: '700',
    fontSize: 18,
    color: '#111827',
    marginBottom: 8,
  },

  requestInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
  },
  statusText: (status) => ({
    fontWeight: '700',
    fontSize: 14,
    color:
      status === 'approved'
        ? '#16a34a'
        : status === 'rejected'
          ? '#dc2626'
          : '#d97706',
    marginBottom: 4,
  }),
  requestDate: {
    fontSize: 14,
    color: '#4b5563',
  },
  cancelButton: {
    backgroundColor: '#dc2626',
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
    color: '#6b7280',
  },
  signOutButton: {
    backgroundColor: '#14b8a6',
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
});
