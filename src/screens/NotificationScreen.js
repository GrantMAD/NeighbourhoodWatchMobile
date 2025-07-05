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
  Modal,
  Animated,
  Image,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Toast from '../components/Toast';

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [processingStatus, setProcessingStatus] = useState({});
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

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

  const showToast = (message, type) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const hideToast = () => {
    setToastVisible(false);
  };

  const handleAcceptRequest = async (notification, actingUserId) => {
    const id = notification.id;
    setProcessing(id, 'accept', true);
    try {
      const requestId = notification?.requestId;
      const groupId = notification?.groupId;

      if (!requestId || !groupId) throw new Error("Invalid request");

      // Fetch the group
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

      // Fetch current user's avatar (the user pressing accept)
      const { data: actingUser, error: actingUserError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', actingUserId)  // Use the passed in actingUserId here
        .single();
      if (actingUserError || !actingUser) throw actingUserError;

      // Remove the request from group requests
      const updatedRequests = group.requests.filter(r => r.id !== requestId);
      await supabase
        .from('groups')
        .update({ requests: updatedRequests })
        .eq('id', group.id);

      // Update user's group_id and clear requestedGroupId
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          group_id: group.id,
          requestedgroupid: null,
        })
        .eq('id', userId);
      if (profileUpdateError) throw profileUpdateError;

      // Add user to group's users array if not already included
      if (!group.users.includes(userId)) {
        const updatedUsers = [...group.users, userId];
        await supabase
          .from('groups')
          .update({ users: updatedUsers })
          .eq('id', group.id);
      }

      // Remove the notification from creator's notifications
      const { data: creatorProfile, error: creatorError } = await supabase
        .from('profiles')
        .select('notifications')
        .eq('id', creatorId)
        .single();
      if (creatorError) throw creatorError;

      const updatedCreatorNotifs = (creatorProfile.notifications || []).filter(n => n.id !== id);
      await supabase
        .from('profiles')
        .update({ notifications: updatedCreatorNotifs })
        .eq('id', creatorId);

      // Add acceptance notification to requester WITH avatar_url
      const acceptanceNotif = {
        id: `notif-${Date.now()}`,
        type: 'accepted_request',
        groupId: group.id,
        message: `Your request to join "${group.name}" was accepted.`,
        createdAt: new Date().toISOString(),
        read: false,
        avatar_url: actingUser.avatar_url, // <-- added avatar here
      };

      const { data: requesterProfile, error: requesterError } = await supabase
        .from('profiles')
        .select('notifications')
        .eq('id', userId)
        .single();
      if (requesterError) throw requesterError;

      const updatedRequesterNotifs = [...(requesterProfile.notifications || []), acceptanceNotif];
      await supabase
        .from('profiles')
        .update({ notifications: updatedRequesterNotifs })
        .eq('id', userId);

      fetchNotifications();
      setActionModalVisible(false);
    } catch (error) {
      console.error('Accept error:', error);
    } finally {
      setProcessing(id, 'accept', false);
    }
  };

  const handleDeclineRequest = async (notification, actingUserId) => {
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

      // Defensive: check if the request exists before proceeding
      const targetRequest = (group.requests || []).find(r => r.id === requestId);

      if (!targetRequest) {
        console.warn(`Decline failed: Request ID ${requestId} not found in group ${groupId}`);

        const fallbackUserId = notification.userId || null;
        if (fallbackUserId) {
          await supabase.from('profiles').update({ requestedGroupId: null }).eq('id', fallbackUserId);
        }

        const { data: creatorProfile } = await supabase
          .from('profiles')
          .select('notifications')
          .eq('id', creatorId)
          .single();

        const updatedCreatorNotifs = (creatorProfile.notifications || []).filter(n => n.id !== id);
        await supabase.from('profiles').update({ notifications: updatedCreatorNotifs }).eq('id', creatorId);

        fetchNotifications();
        setProcessing(id, 'decline', false);
        return;
      }

      const userId = targetRequest.userId;
      if (!userId) throw new Error("Missing userId");

      // Fetch current user's avatar (the user pressing decline)
      const { data: actingUser, error: actingUserError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', actingUserId)  // Use the passed in actingUserId here
        .single();
      if (actingUserError || !actingUser) throw actingUserError;

      // 1. Remove request from group
      const updatedRequests = group.requests.filter(r => r.id !== requestId);
      await supabase.from('groups').update({ requests: updatedRequests }).eq('id', group.id);

      // 2. Clear requestedGroupId from requester
      await supabase.from('profiles').update({ requestedgroupid: null }).eq('id', userId);

      // 3. Remove the notification from the creator's notifications
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('notifications')
        .eq('id', creatorId)
        .single();

      const updatedCreatorNotifs = (creatorProfile.notifications || []).filter(n => n.id !== id);
      await supabase.from('profiles').update({ notifications: updatedCreatorNotifs }).eq('id', creatorId);

      // 4. Add a rejection notification to the requester WITH avatar_url
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
        avatar_url: actingUser.avatar_url, // <-- added avatar here
      };

      const updatedRequesterNotifs = [...(requesterProfile.notifications || []), declineNotif];
      await supabase.from('profiles').update({ notifications: updatedRequesterNotifs }).eq('id', userId);

      // 5. Refresh notifications in UI
      fetchNotifications();
      setActionModalVisible(false);
    } catch (error) {
      console.error('Decline error:', error);
      Alert.alert('Error', error.message || 'Failed to decline request');
    } finally {
      setProcessing(id, 'decline', false);
    }
  };

  const handleAcceptNeighbourhoodWatchRequest = async (notification, actingUserId) => {
    const id = notification.id;
    setProcessing(id, 'accept', true);
    try {
      const { requestId, requesterId, neighbourhoodWatchName, creatorId } = notification;

      if (!requestId || !requesterId || !neighbourhoodWatchName || !creatorId) {
        throw new Error("Invalid neighbourhood watch request notification data.");
      }

      // Fetch current user's avatar (the user pressing accept)
      const { data: actingUser, error: actingUserError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', actingUserId)
        .single();
      if (actingUserError || !actingUser) throw actingUserError;

      // 1. Delete the notification from the current user's notifications
      const updatedNotifications = notifications.filter((n) => n.id !== id);
      await updateNotifications(updatedNotifications);

      // 2. Fetch the creator's profile to update their Requests array
      const { data: creatorProfile, error: fetchCreatorProfileError } = await supabase
        .from('profiles')
        .select('Requests')
        .eq('id', creatorId)
        .single();

      if (fetchCreatorProfileError || !creatorProfile) {
        console.error('Error fetching creator profile:', fetchCreatorProfileError?.message);
        throw new Error('Failed to fetch creator profile.');
      }

      // Remove the request from the creator's Requests array
      const updatedRequests = (creatorProfile.Requests || []).filter(
        (req) => req.id !== requestId
      );

      const { error: updateCreatorProfileError } = await supabase
        .from('profiles')
        .update({
          Requests: updatedRequests,
        })
        .eq('id', creatorId);

      if (updateCreatorProfileError) {
        console.error('Error updating creator profile:', updateCreatorProfileError.message);
        throw new Error('Failed to update creator profile.');
      }

      // 3. Fetch the requester's profile to update their neighbourhoodwatch array and remove the pending request
      const { data: requesterProfile, error: fetchRequesterProfileError } = await supabase
        .from('profiles')
        .select('neighbourhoodwatch, Requests')
        .eq('id', requesterId)
        .single();

      if (fetchRequesterProfileError || !requesterProfile) {
        console.error('Error fetching requester profile:', fetchRequesterProfileError?.message);
        throw new Error('Failed to fetch requester profile.');
      }

      // Remove the pending request from the requester's Requests array
      const updatedRequesterRequests = (requesterProfile.Requests || []).filter(
        (req) =>
          !(
            req.type === "Neighbourhood watch request" &&
            req.neighbourhoodWatchId === notification.neighbourhoodWatchId &&
            req.requesterId === requesterId
          )
      );

      // Add neighbourhoodWatchName to the user's neighbourhoodwatch array
      const currentNeighbourhoodWatchArray = requesterProfile.neighbourhoodwatch || [];
      const newNeighbourhoodWatchEntry = {
        id: notification.neighbourhoodWatchId,
        name: neighbourhoodWatchName,
        creator_id: notification.creatorId,
      };
      const updatedNeighbourhoodWatchArray = [...currentNeighbourhoodWatchArray, newNeighbourhoodWatchEntry];

      const { error: updateRequesterProfileError } = await supabase
        .from('profiles')
        .update({
          neighbourhoodwatch: updatedNeighbourhoodWatchArray,
          Requests: updatedRequesterRequests,
        })
        .eq('id', requesterId);

      if (updateRequesterProfileError) {
        console.error('Error updating requester profile:', updateRequesterProfileError.message);
        throw new Error('Failed to update requester profile.');
      }

      // 4. Add acceptance notification to requester WITH avatar_url
      const { data: requesterNotifProfile, error: fetchRequesterNotifProfileError } = await supabase
        .from('profiles')
        .select('notifications')
        .eq('id', requesterId)
        .single();

      if (fetchRequesterNotifProfileError || !requesterNotifProfile) {
        console.error('Error fetching requester notification profile:', fetchRequesterNotifProfileError?.message);
        throw new Error('Failed to fetch requester notification profile.');
      }

      const acceptanceNotif = {
        id: `notif-${Date.now()}`,
        type: 'neighbourhood_watch_request_accepted',
        message: `Your request to join "${neighbourhoodWatchName}" was accepted.`,
        createdAt: new Date().toISOString(),
        read: false,
        avatar_url: actingUser.avatar_url, // <-- added avatar here
      };

      const updatedRequesterNotifs = [...(requesterNotifProfile.notifications || []), acceptanceNotif];
      const { error: updateRequesterNotifsError } = await supabase
        .from('profiles')
        .update({ notifications: updatedRequesterNotifs })
        .eq('id', requesterId);

      if (updateRequesterNotifsError) {
        console.error('Error updating requester notifications:', updateRequesterNotifsError.message);
        throw new Error('Failed to update requester notifications.');
      }

      // 5. Add the accepted user's ID to the neighbourhood watch's members array
      const { data: creatorProfileForMembers, error: fetchCreatorProfileForMembersError } = await supabase
        .from('profiles')
        .select('neighbourhoodwatch')
        .eq('id', creatorId)
        .single();

      if (fetchCreatorProfileForMembersError || !creatorProfileForMembers) {
        console.error('Error fetching creator profile for members update:', fetchCreatorProfileForMembersError?.message);
        throw new Error('Failed to fetch creator profile for members update.');
      }

      const updatedCreatorNeighbourhoodWatches = (creatorProfileForMembers.neighbourhoodwatch || []).map(nw => {
        if (nw.id === notification.neighbourhoodWatchId) {
          const updatedMembers = [...new Set([...(nw.members || []), requesterId])];
          return { ...nw, members: updatedMembers };
        }
        return nw;
      });

      const { error: updateCreatorMembersError } = await supabase
        .from('profiles')
        .update({ neighbourhoodwatch: updatedCreatorNeighbourhoodWatches })
        .eq('id', creatorId);

      if (updateCreatorMembersError) {
        console.error('Error updating creators neighbourhoodwatch members:', updateCreatorMembersError.message);
        throw new Error('Failed to update creators neighbourhoodwatch members.');
      }

      showToast('Neighbourhood watch request accepted.', 'success');
      fetchNotifications(); // Refresh notifications after successful operation
      setActionModalVisible(false);
    } catch (error) {
      console.error('Accept Neighbourhood Watch Request error:', error);
      Alert.alert('Error', error.message || 'Failed to accept neighbourhood watch request.');
    } finally {
      setProcessing(id, 'accept', false);
    }
  };

  const handleDeclineNeighbourhoodWatchRequest = async (notification, actingUserId) => {
    const id = notification.id;
    setProcessing(id, 'decline', true);
    try {
      const { requestId, requesterId, creatorId } = notification;

      if (!requestId || !requesterId || !creatorId) {
        throw new Error("Invalid neighbourhood watch request notification data.");
      }

      // 1. Delete the notification from the current user's notifications
      const updatedNotifications = notifications.filter((n) => n.id !== id);
      await updateNotifications(updatedNotifications);

      // 2. Fetch the creator's profile to update their Requests array
      const { data: creatorProfile, error: fetchCreatorProfileError } = await supabase
        .from('profiles')
        .select('Requests')
        .eq('id', creatorId)
        .single();

      if (fetchCreatorProfileError || !creatorProfile) {
        console.error('Error fetching creator profile:', fetchCreatorProfileError?.message);
        throw new Error('Failed to fetch creator profile.');
      }

      // Remove the request from the creator's Requests array
      console.log('Notification requestId:', requestId);
      console.log('Creator profile Requests before filter:', creatorProfile.Requests);
      const updatedRequests = (creatorProfile.Requests || []).filter(
        (req) => {
          console.log('Comparing request id:', req.id, 'with notification requestId:', requestId);
          return req.id !== requestId;
        }
      );
      console.log('Creator profile Requests after filter:', updatedRequests);

      const { error: updateCreatorProfileError } = await supabase
        .from('profiles')
        .update({
          Requests: updatedRequests,
        })
        .eq('id', creatorId);

      if (updateCreatorProfileError) {
        console.error('Error updating creator profile:', updateCreatorProfileError.message);
        throw new Error('Failed to update creator profile.');
      }

      // Remove the pending request from the requester's Requests array
      const { data: requesterProfile, error: fetchRequesterProfileError } = await supabase
        .from('profiles')
        .select('Requests')
        .eq('id', requesterId)
        .single();

      if (fetchRequesterProfileError || !requesterProfile) {
        console.error('Error fetching requester profile:', fetchRequesterProfileError?.message);
        throw new Error('Failed to fetch requester profile.');
      }

      const updatedRequesterRequests = (requesterProfile.Requests || []).filter(
        (req) => !(req.type === "Neighbourhood watch request" && req.neighbourhoodWatchId === notification.neighbourhoodWatchId && req.requesterId === requesterId)
      );

      const { error: updateRequesterProfileError } = await supabase
        .from('profiles')
        .update({ Requests: updatedRequesterRequests })
        .eq('id', requesterId);

      if (updateRequesterProfileError) {
        console.error('Error updating requester profile:', updateRequesterProfileError.message);
        throw new Error('Failed to update requester profile.');
      }

      showToast('Neighbourhood watch request declined.', 'success');
      fetchNotifications(); // Refresh notifications after successful operation
      setActionModalVisible(false);
    } catch (error) {
      console.error('Decline Neighbourhood Watch Request error:', error);
      Alert.alert('Error', error.message || 'Failed to decline neighbourhood watch request.');
    } finally {
      setProcessing(id, 'decline', false);
    }
  };

  const confirmDeclineRequest = (notification, actingUserId) => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this join request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => handleDeclineRequest(notification, actingUserId),
        },
      ]
    );
  };


  const renderNotification = ({ item }) => {
    const isJoinRequest = item.type === 'join_request';
    const isNeighbourhoodWatchRequest = item.type === 'neighbourhood_watch_request';
    const isActionable = isJoinRequest || isNeighbourhoodWatchRequest;

    const isAcceptProcessing = processingStatus[item.id]?.accept;
    const isDeclineProcessing = processingStatus[item.id]?.decline;

    let headingText = 'Notification';
    if (isJoinRequest) {
      headingText = 'Group Join Request';
    } else if (isNeighbourhoodWatchRequest) {
      headingText = 'Neighbourhood Watch Request';
    } else if (item.type === 'accepted_request') {
      headingText = 'Request Accepted';
    } else if (item.type === 'declined_request') {
      headingText = 'Request Declined';
    } else if (item.type === 'check_status') {
      headingText = 'Status Update';
    }

    const getBorderColor = (type) => {
      switch (type) {
        case 'join_request': return '#facc15';        // yellow
        case 'neighbourhood_watch_request': return '#60a5fa'; // blue
        case 'accepted_request': return '#4ade80';     // green
        case 'declined_request': return '#f87171';     // red
        case 'check_status': return '#a78bfa';         // purple
        default: return '#22d3ee';                     // default cyan
      }
    };

    return (
      <View style={[styles.notificationCard, item.read ? styles.read : styles.unread, { borderLeftColor: getBorderColor(item.type), borderLeftWidth: 4 }]}>
        <View style={styles.cardTopRow}>
          <View style={styles.avatarContainer}>
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            ) : (
              <Icon name="user-circle" size={40} color="#90caf9" solid />
            )}
          </View>
          <TouchableOpacity
            style={styles.cardContent}
            onPress={() => {
              if (isActionable) return;
              setSelectedNotification(item);
              setActionModalVisible(true);
            }}
            disabled={isActionable}
          >
            <Text style={styles.headingText}>{headingText}</Text>
            <Text style={styles.messageText} numberOfLines={2}>{item.message}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteNotification(item.id)} style={styles.deleteButton}>
            <Icon name="trash" size={18} color="#ff7b7b" />
          </TouchableOpacity>
        </View>

        {item.type === 'check_status' && item.timestamp && (
          <View style={styles.timeInfoContainer}>
            <Text style={styles.timeText}>
              {item.message.toLowerCase().includes('checked in') ? 'Checked In: ' : 'Checked Out: '}
              {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}

        {(item.type === 'neighbourhood_watch_request' || item.type === 'join_request') && item.timestamp && (
          <View style={styles.timeInfoContainer}>
            <Text style={styles.timeText}>
              Requested: {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}

        {isActionable && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.acceptButton,
                isAcceptProcessing && styles.disabledButton,
              ]}
              onPress={() =>
                isJoinRequest
                  ? handleAcceptRequest(item, currentUserId)
                  : handleAcceptNeighbourhoodWatchRequest(item, currentUserId)
              }
              disabled={isAcceptProcessing}
            >
              {isAcceptProcessing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Accept</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.declineButton,
                isDeclineProcessing && styles.disabledButton,
              ]}
              onPress={() =>
                isJoinRequest
                  ? confirmDeclineRequest(item , currentUserId)
                  : handleDeclineNeighbourhoodWatchRequest(item, currentUserId)
              }
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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerText}>Notifications</Text>
          <Text style={styles.headerDescription}>
            Here you can review your notifications to stay informed.
          </Text>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={clearAllNotifications} style={styles.clearButtonBelow}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
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
      <Toast visible={toastVisible} message={toastMessage} type={toastType} onHide={hideToast} />

      <Modal
        animationType="slide"
        transparent={true}
        visible={actionModalVisible}
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {selectedNotification && (
              <>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setActionModalVisible(false)}
                >
                  <Text style={styles.modalCloseButtonText}>X</Text>
                </TouchableOpacity>
                <View
                  style={[
                    styles.modalTitleRow,
                    (selectedNotification?.type === 'join_request' ||
                      selectedNotification?.type === 'neighbourhood_watch_request') && {
                      justifyContent: 'center',
                    },
                  ]}
                >
                  <Text style={styles.modalTitle}>Notification Details</Text>

                  {selectedNotification?.type !== 'join_request' &&
                    selectedNotification?.type !== 'neighbourhood_watch_request' && (
                      <TouchableOpacity
                        onPress={() => {
                          deleteNotification(selectedNotification.id);
                          setActionModalVisible(false);
                        }}
                        style={styles.trashIconWrapper}
                      >
                        <Icon name="trash" size={20} color="#ff4444" style={styles.trashIcon} />
                      </TouchableOpacity>
                    )}
                </View>

                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalMessage}>✉️ {selectedNotification.message}</Text>
                </View>

                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalEmoji}>⏰</Text>
                  <Text style={styles.modalTimeText}>
                    {(new Date(selectedNotification.timestamp || selectedNotification.createdAt || Date.now())).toLocaleTimeString()}
                  </Text>
                  <Text style={styles.modalDateText}>
                    {(new Date(selectedNotification.timestamp || selectedNotification.createdAt || Date.now())).toLocaleDateString()}
                  </Text>
                </View>

                {(selectedNotification.type === 'join_request' || selectedNotification.type === 'neighbourhood_watch_request') && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.acceptButton,
                        processingStatus[selectedNotification.id]?.accept && styles.disabledButton,
                      ]}
                      onPress={() =>
                        selectedNotification.type === 'join_request'
                          ? handleAcceptRequest(selectedNotification, currentUserId)
                          : handleAcceptNeighbourhoodWatchRequest(selectedNotification, currentUserId)
                      }
                      disabled={processingStatus[selectedNotification.id]?.accept}
                    >
                      {processingStatus[selectedNotification.id]?.accept ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text style={styles.buttonText}>Accept</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.declineButton,
                        processingStatus[selectedNotification.id]?.decline && styles.disabledButton,
                      ]}
                      onPress={() =>
                        selectedNotification.type === 'join_request'
                          ? confirmDeclineRequest(selectedNotification, currentUserId)
                          : handleDeclineNeighbourhoodWatchRequest(selectedNotification, currentUserId)
                      }
                      disabled={processingStatus[selectedNotification.id]?.decline}
                    >
                      {processingStatus[selectedNotification.id]?.decline ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text style={styles.buttonText}>Decline</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#f7f7f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  headerText: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  headerDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  clearButton: { justifyContent: 'center' },
  clearButtonBelow: {
    alignSelf: 'flex-end',
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e53935', // red background
    borderRadius: 20,
  },

  clearText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  notificationCard: {
    backgroundColor: '#2a2a2a', // Slightly lighter dark shade
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  read: {
    opacity: 0.7,
  },
  unread: {
    opacity: 1.0,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  cardContent: {
    flex: 1,
  },
  headingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e3f2fd',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#b0bec5',
  },
  timeInfoContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopColor: '#3a3a3a',
    borderTopWidth: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#90a4ae',
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    borderTopColor: '#3a3a3a',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  acceptButton: { backgroundColor: '#4CAF50' },
  declineButton: { backgroundColor: '#F44336' },
  disabledButton: { opacity: 0.6 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  flatListEmpty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalView: {
    margin: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 16,
    color: '#e3f2fd',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#374151',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  modalTimeText: {
    fontSize: 14,
    color: '#bbb',
    marginRight: 8,
  },
  modalDateText: {
    fontSize: 14,
    color: '#bbb',
  },
  trashIconWrapper: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#3a3a3a',
  },
  trashIcon: {},
});

export default NotificationScreen;