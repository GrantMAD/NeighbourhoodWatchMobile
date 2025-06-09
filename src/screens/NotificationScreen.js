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
import Icon from 'react-native-vector-icons/FontAwesome5';

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [processingStatus, setProcessingStatus] = useState({});

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        console.error('User fetch error:', authError);
        setLoading(false);
        return;
      }

      const userId = authData.user.id;
      setCurrentUserId(userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('notifications')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error.message);
        Alert.alert('Error', 'Failed to load notifications');
        setLoading(false);
        return;
      }

      const rawNotifications = Array.isArray(data?.notifications)
        ? data.notifications
        : [];

      const sorted = rawNotifications.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setNotifications(sorted);
    } catch (e) {
      console.error('Unexpected error in fetchNotifications:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = async () => {
    if (loading || refreshing) return;
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const updateNotifications = async (updatedNotifications) => {
    if (!currentUserId) return;
    const { error } = await supabase
      .from('profiles')
      .update({ notifications: updatedNotifications })
      .eq('id', currentUserId);

    if (error) {
      console.error('Failed to update notifications:', error.message);
      Alert.alert('Error', 'Failed to update notifications');
    } else {
      setNotifications(updatedNotifications);
    }
  };

  const toggleRead = (id) => {
    const updated = notifications.map((notif) =>
      notif.id === id ? { ...notif, read: !notif.read } : notif
    );
    updateNotifications(updated);
  };

  const deleteNotification = (id) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = notifications.filter((n) => n.id !== id);
            await updateNotifications(updated);
            Alert.alert('Deleted', 'Notification deleted successfully.');
          },
        },
      ]
    );
  };

  const clearAllNotifications = () => {
    Alert.alert('Clear All', 'Are you sure you want to clear all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          await updateNotifications([]);
          Alert.alert('Cleared', 'All notifications cleared.');
        },
      },
    ]);
  };

  const setProcessing = (notificationId, action, value) => {
    setProcessingStatus((prev) => ({
      ...prev,
      [notificationId]: {
        ...prev[notificationId],
        [action]: value,
      },
    }));
  };

  const handleAcceptRequest = async (notification) => {
    const id = notification.id;
    setProcessing(id, 'accept', true);
    try {
      const requestId = notification?.requestId;
      const groupId = notification?.groupId;

      if (!requestId || !groupId) throw new Error("Invalid request");

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, name, requests, created_by, users')
        .eq('id', groupId)
        .single();
      if (groupError || !group) throw groupError;

      const creatorId = group.created_by;
      const targetRequest = (group.requests || []).find(r => r.id === requestId);
      if (!targetRequest) throw new Error("Request not found");

      const userId = targetRequest.userId;
      if (!userId) throw new Error("Missing userId");

      const updatedRequests = group.requests.filter(r => r.id !== requestId);
      await supabase.from('groups').update({ requests: updatedRequests }).eq('id', group.id);
      await supabase.from('profiles').update({ group_id: group.id }).eq('id', userId);

      if (!group.users.includes(userId)) {
        const updatedUsers = [...group.users, userId];
        await supabase.from('groups').update({ users: updatedUsers }).eq('id', group.id);
      }

      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('notifications')
        .eq('id', creatorId)
        .single();
      const updatedCreatorNotifs = (creatorProfile.notifications || []).filter(n => n.id !== id);
      await supabase.from('profiles').update({ notifications: updatedCreatorNotifs }).eq('id', creatorId);

      const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('notifications')
        .eq('id', userId)
        .single();

      const acceptanceNotif = {
        id: `notif-${Date.now()}`,
        type: 'accepted_request',
        groupId: group.id,
        message: `Your request to join "${group.name}" was accepted.`,
        createdAt: new Date().toISOString(),
        read: false,
      };

      const updatedRequesterNotifs = [...(requesterProfile.notifications || []), acceptanceNotif];
      await supabase.from('profiles').update({ notifications: updatedRequesterNotifs }).eq('id', userId);

      fetchNotifications();
    } catch (error) {
      console.error('Accept error:', error);
    } finally {
      setProcessing(id, 'accept', false);
    }
  };

  const handleDeclineRequest = async (notification) => {
    const id = notification.id;
    setProcessing(id, 'decline', true);

    try {
      const requestId = notification?.requestId;
      const groupId = notification?.groupId;

      if (!requestId || !groupId) throw new Error("Invalid request");

      // Fetch group info
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, name, requests, created_by')
        .eq('id', groupId)
        .single();
      if (groupError || !group) throw groupError;

      const creatorId = group.created_by;
      const targetRequest = (group.requests || []).find(r => r.id === requestId);
      if (!targetRequest) throw new Error("Request not found");

      const userId = targetRequest.userId;
      if (!userId) throw new Error("Missing userId");

      // 1. Remove request from group
      const updatedRequests = group.requests.filter(r => r.id !== requestId);
      await supabase.from('groups').update({ requests: updatedRequests }).eq('id', group.id);

      // 2. Remove the notification from the creator's notifications
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('notifications')
        .eq('id', creatorId)
        .single();

      const updatedCreatorNotifs = (creatorProfile.notifications || []).filter(n => n.id !== id);
      await supabase.from('profiles').update({ notifications: updatedCreatorNotifs }).eq('id', creatorId);

      // 3. Add a rejection notification to the requester
      const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('notifications')
        .eq('id', userId)
        .single();

      const declineNotif = {
        id: `notif-${Date.now()}`,
        type: 'declined_request',
        groupId: group.id,
        message: `Your request to join "${group.name}" was declined.`,
        createdAt: new Date().toISOString(),
        read: false,
      };

      const updatedRequesterNotifs = [...(requesterProfile.notifications || []), declineNotif];
      await supabase.from('profiles').update({ notifications: updatedRequesterNotifs }).eq('id', userId);

      // 4. Refresh notifications in UI
      fetchNotifications();
    } catch (error) {
      console.error('Decline error:', error);
      Alert.alert('Error', error.message || 'Failed to decline request');
    } finally {
      setProcessing(id, 'decline', false);
    }
  };

  const confirmDeclineRequest = (notification) => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this join request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => handleDeclineRequest(notification),
        },
      ]
    );
  };

  const renderNotification = ({ item }) => {
    const isJoinRequest = item.type === 'join_request';
    const isAcceptProcessing = processingStatus[item.id]?.accept;
    const isDeclineProcessing = processingStatus[item.id]?.decline;

    let headingText = '';
    if (isJoinRequest) {
      headingText = 'Group Join Request';
    }

    return (
      <View style={[styles.notificationCard, item.read ? styles.read : styles.unread]}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            {headingText !== '' && <Text style={styles.headingText}>{headingText}</Text>}
            <Text style={styles.messageText}>{item.message}</Text>
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
          <TouchableOpacity onPress={() => deleteNotification(item.id)} style={{ padding: 5 }}>
            <Icon name="trash-alt" size={20} color="red" />
          </TouchableOpacity>
        </View>

        {isJoinRequest && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.button, styles.acceptButton, isAcceptProcessing && styles.disabledButton]}
              onPress={() => handleAcceptRequest(item)}
              disabled={isAcceptProcessing}
            >
              {isAcceptProcessing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Accept</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.declineButton, isDeclineProcessing && styles.disabledButton]}
              onPress={() => {
                Alert.alert(
                  'Decline Request',
                  'Are you sure you want to decline this join request?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Decline',
                      style: 'destructive',
                      onPress: () => handleDeclineRequest(item),
                    },
                  ]
                );
              }}
              disabled={isDeclineProcessing}
            >
              {isDeclineProcessing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Decline</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#555" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={clearAllNotifications} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotification}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text>No notifications</Text>
          </View>
        }
        contentContainerStyle={notifications.length === 0 && styles.flatListEmpty}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#f7f7f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  headerText: { fontSize: 22, fontWeight: 'bold' },
  clearButton: { justifyContent: 'center' },
  clearText: { color: 'red', fontWeight: 'bold' },
  notificationCard: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  read: { opacity: 0.6 },
  unread: { opacity: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  messageText: { fontSize: 16, marginBottom: 4, color: '#fff', },
  dateText: { fontSize: 12, color: '#fff' },
  actionRow: { flexDirection: 'row', marginTop: 8, justifyContent: 'flex-end' },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 5,
    marginLeft: 10,
  },
  acceptButton: { backgroundColor: '#4CAF50' },
  declineButton: { backgroundColor: '#F44336' },
  disabledButton: { opacity: 0.7 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  flatListEmpty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  headingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',    // white font color for the heading
    marginBottom: 4,
    textDecorationLine: 'underline',
  },
});

export default NotificationScreen;
