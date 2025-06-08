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

const WaitingStatusScreen = () => {
  const [userRequests, setUserRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

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

  const renderRequest = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.groupName}>{item.groupName}</Text>
        <Text>Status: <Text style={styles.statusText(item.status)}>{item.status}</Text></Text>
        <Text>Requested on: {new Date(item.requestedAt).toLocaleString()}</Text>
      </View>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => cancelRequest(item.groupId)}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
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
  container: { flex: 1, padding: 16, backgroundColor: '#f9fafb' },
  center: { justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  requestCard: {
    backgroundColor: '#e0e7ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupName: {
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 4,
  },
  statusText: (status) => ({
    fontWeight: '700',
    color:
      status === 'approved' ? '#22c55e' :
      status === 'rejected' ? '#ef4444' :
      '#fbbf24', // pending = yellow
  }),
  cancelButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#6b7280',
  },
});
