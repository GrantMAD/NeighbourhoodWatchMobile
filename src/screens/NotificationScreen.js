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
  const [processingIds, setProcessingIds] = useState(new Set());

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

  // Accept Request Function
  const handleAcceptRequest = async (request) => {
    try {
      const userId = request.userId;
      const groupId = request.groupId;

      // Fetch group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();
      if (groupError || !group) throw groupError;

      // Remove request from group
      const updatedRequests = (group.requests || []).filter(r => r.userId !== userId);
      await supabase.from('groups').update({ requests: updatedRequests }).eq('id', group.id);

      // Add user to group
      await supabase.from('profiles').update({ group_id: group.id }).eq('id', userId);

      // Remove notification from current user (admin)
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('notifications')
        .eq('id', currentUserId)
        .single();
      const cleanedAdminNotifs = (adminProfile.notifications || []).filter(
        n => !(n.type === 'join_request' && n.userId === userId && n.groupId === group.id)
      );
      await supabase.from('profiles').update({ notifications: cleanedAdminNotifs }).eq('id', currentUserId);

      // Add acceptance notification to requester
      const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('notifications')
        .eq('id', userId)
        .single();
      const acceptanceNotif = {
        type: 'accepted_request',
        groupId: group.id,
        message: `Your request to join "${group.name}" was accepted.`,
        timestamp: new Date().toISOString(),
      };
      const updatedRequesterNotifs = [...(requesterProfile.notifications || []), acceptanceNotif];
      await supabase.from('profiles').update({ notifications: updatedRequesterNotifs }).eq('id', userId);

      fetchNotifications();
      console.log('✅ Request accepted');

    } catch (error) {
      console.error('❌ Error accepting request:', error);
    }
  };


  const handleDeclineRequest = async (request) => {
    try {
      const userId = request.userId;
      const groupId = request.groupId;

      // Fetch group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();
      if (groupError || !group) throw groupError;

      // Remove request from group
      const updatedRequests = (group.requests || []).filter(r => r.userId !== userId);
      await supabase.from('groups').update({ requests: updatedRequests }).eq('id', group.id);

      // Remove join_request notification from admin
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('notifications')
        .eq('id', currentUserId)
        .single();
      const cleanedAdminNotifs = (adminProfile.notifications || []).filter(
        n => !(n.type === 'join_request' && n.userId === userId && n.groupId === group.id)
      );
      await supabase.from('profiles').update({ notifications: cleanedAdminNotifs }).eq('id', currentUserId);

      // Notify requester of decline
      const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('notifications')
        .eq('id', userId)
        .single();
      const declineNotif = {
        type: 'declined_request',
        groupId: group.id,
        message: `Your request to join "${group.name}" was declined.`,
        timestamp: new Date().toISOString(),
      };
      const updatedRequesterNotifs = [...(requesterProfile.notifications || []), declineNotif];
      await supabase.from('profiles').update({ notifications: updatedRequesterNotifs }).eq('id', userId);

      fetchNotifications();
      console.log('❌ Request declined');

    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  const renderNotification = ({ item }) => {
    const isJoinRequest = item.type === 'join_request';
    const isProcessing = processingIds.has(item.id);

    return (
      <View
        style={[
          styles.notificationCard,
          item.read ? styles.read : styles.unread,
        ]}
      >
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.title || '(No Title)'}</Text>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.date}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>

            {isJoinRequest && (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={() => handleAcceptRequest(item)}
                  style={[styles.actionButton, styles.acceptButton]}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Icon name="check" size={14} color="#fff" />
                      <Text style={styles.buttonText}> Accept</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDeclineRequest(item)}
                  style={[styles.actionButton, styles.rejectButton]}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Icon name="times" size={14} color="#fff" />
                      <Text style={styles.buttonText}> Reject</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => toggleRead(item.id)}
              style={[
                styles.iconButton,
                item.read ? styles.markUnread : styles.markRead,
              ]}
            >
              <Icon
                name={item.read ? 'envelope-open' : 'envelope'}
                size={16}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => deleteNotification(item.id)}
              style={[styles.iconButton, styles.deleteButton]}
            >
              <Icon name="trash" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#22d3ee" />
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyText}>You have no notifications.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Your Notifications</Text>
        <TouchableOpacity
          onPress={clearAllNotifications}
          style={styles.clearAllButton}
          disabled={loading || refreshing}
        >
          <Icon name="trash" size={14} color="#fff" />
          <Text style={styles.clearAllText}> Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            enabled={!loading && !refreshing}
          />
        }
      />
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9fafb' },
  center: { justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: '700' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearAllButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearAllText: {
    color: '#fff',
    fontWeight: '700',
  },
  notificationCard: {
    backgroundColor: '#e5e7eb',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  unread: { opacity: 1 },
  read: { opacity: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontWeight: '700', fontSize: 16, marginBottom: 4 },
  message: { fontSize: 14, marginBottom: 4 },
  date: { fontSize: 12, color: '#6b7280' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  iconButton: {
    backgroundColor: '#3b82f6',
    padding: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  markRead: { backgroundColor: '#10b981' },
  markUnread: { backgroundColor: '#facc15' },
  deleteButton: { backgroundColor: '#ef4444' },
  buttonRow: { flexDirection: 'row', marginTop: 10 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  acceptButton: { backgroundColor: '#10b981' },
  rejectButton: { backgroundColor: '#ef4444' },
  buttonText: { color: '#fff', fontWeight: '700', marginLeft: 4 },
  emptyText: { fontSize: 16, color: '#6b7280' },
});
