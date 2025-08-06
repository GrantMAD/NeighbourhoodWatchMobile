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
import { FontAwesome } from '@expo/vector-icons';

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
  const [cancellingRequestId, setCancellingRequestId] = useState(null); // New state for spinner
  const navigation = useNavigation();

  const fetchUserRequests = useCallback(async () => {
    setLoading(true);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      Alert.alert('Error', 'Failed to get current user.');
      setLoading(false);
      return;
    }
    setCurrentUserId(user.id);

    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, requests')
      .not('requests', 'is', null);

    if (groupsError) {
      Alert.alert('Error', 'Failed to load join requests.');
      setLoading(false);
      return;
    }

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
          requestId: req.id,
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
            setCancellingRequestId(requestId); // Set the ID of the request being cancelled
            try {
              // Call an RPC function to handle the deletion atomically.
              const { error: removeError } = await supabase.rpc('remove_join_request', {
                p_group_id: groupId,
                p_request_id: requestId,
                p_user_id: currentUserId,
              });

              if (removeError) {
                throw new Error(removeError.message);
              }

              // The RPC function should handle both request and notification removal.
              // Now, just update the UI.

              // Clear the requestedgroupid from the user's profile
              const { error: updateProfileError } = await supabase
                .from('profiles')
                .update({ requestedgroupid: null })
                .eq('id', currentUserId);

              if (updateProfileError) {
                console.error('Error clearing requestedgroupid:', updateProfileError);
              }

              Alert.alert('Success', 'Your join request has been cancelled.');

              // Refresh the list locally to provide immediate feedback.
              setUserRequests(prevRequests => prevRequests.filter(req => req.requestId !== requestId));

              // Navigate back if there are no more requests.
              if (userRequests.length === 1) {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'NoGroupScreen' }],
                });
              }

            } catch (err) {
              Alert.alert('Error', err.message || 'Something went wrong while cancelling the request.');
              console.error(err);
            } finally {
              setCancellingRequestId(null); // Clear the ID after processing
            }
          },
        },
      ]
    );
  };

  const renderRequest = ({ item }) => {
    const statusInfo = {
      pending: { icon: 'clock-o', color: '#fbbf24' },
      approved: { icon: 'check-circle', color: '#34d399' },
      rejected: { icon: 'times-circle', color: '#f87171' },
    };

    const { icon, color } = statusInfo[item.status] || statusInfo.pending;

    return (
      <View style={styles.requestCard}>
        <Text style={styles.groupName}>{item.groupName}</Text>

        <View style={styles.statusContainer}>
          <FontAwesome name={icon} size={16} color={color} />
          <Text style={[styles.statusText, { color }]}>{item.status}</Text>
        </View>

        <Text style={styles.requestDate}>
          Requested on {new Date(item.requestedAt).toLocaleDateString()}
        </Text>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => cancelRequest(item.groupId, item.requestId)}
          disabled={cancellingRequestId === item.requestId} // Disable button while cancelling
        >
          {cancellingRequestId === item.requestId ? (
            <ActivityIndicator color="#fff" /> // Show spinner
          ) : (
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

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
        Here you can track the status of your group join requests. You can return to the previous screen by tapping the arrow in the top-left corner.
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
    </View>
  );
};

export default WaitingStatusScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#1f2937' },
  center: { justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#f9fafb' },
  description: {
    fontSize: 16,
    color: '#d1d5db',
    marginBottom: 24,
  },
  requestCard: {
    backgroundColor: '#2d3748',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupName: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#f9fafb',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
    textTransform: 'capitalize',
  },
  requestDate: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  loadingHeading: {
    width: '70%',
    height: 25,
    backgroundColor: '#374151',
    borderRadius: 5,
    marginBottom: 16,
  },
  loadingDescription: {
    width: '90%',
    height: 15,
    backgroundColor: '#4b5563',
    borderRadius: 5,
    marginBottom: 12,
  },
  loadingRequestCard: {
    height: 150,
    backgroundColor: '#2d3748',
    borderRadius: 12,
    marginBottom: 16,
  },
});
