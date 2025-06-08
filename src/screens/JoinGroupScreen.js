import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

const JoinGroupScreen = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchGroups = async () => {
      const { data, error } = await supabase.from('groups').select('id, name');
      if (error) {
        Alert.alert('Error', 'Failed to load groups');
      } else {
        setGroups(data);
      }
    };
    fetchGroups();
  }, []);

  const handleJoinRequest = async () => {
    if (!selectedGroupId) {
      Alert.alert('Please select a group to join');
      return;
    }

    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (userError || !userId) {
      setLoading(false);
      Alert.alert('Error', 'Could not get user info');
      return;
    }

    // Get selected group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, name, requests, created_by')
      .eq('id', selectedGroupId)
      .single();

    if (groupError || !group) {
      setLoading(false);
      Alert.alert('Error', 'Failed to find the selected group');
      return;
    }

    if (!group.created_by) {
      setLoading(false);
      Alert.alert('Error', 'Group creator information is missing');
      return;
    }

    const existingRequest = group.requests?.find(
      req => req.userId === userId && req.status === 'pending'
    );
    if (existingRequest) {
      setLoading(false);
      Alert.alert('You already have a pending join request for this group.');
      return;
    }

    const newRequest = {
      userId,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };

    const updatedRequests = group.requests ? [...group.requests, newRequest] : [newRequest];

    const { error: updateGroupError } = await supabase
      .from('groups')
      .update({ requests: updatedRequests })
      .eq('id', selectedGroupId);

    if (updateGroupError) {
      setLoading(false);
      Alert.alert('Error', 'Failed to send join request');
      return;
    }

    // Fetch creator's profile
    const { data: creatorProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, notifications')
      .eq('id', group.created_by);

    if (profileError || !creatorProfiles || creatorProfiles.length !== 1) {
      setLoading(false);
      Alert.alert('Error', 'Failed to find group creator profile');
      return;
    }

    const creatorProfile = creatorProfiles[0];

    const newNotification = {
      id: `notif-${Date.now()}`,
      type: 'join_request',
      groupId: group.id,
      message: `A user requested to join your group "${group.name}"`,
      createdAt: new Date().toISOString(),
      read: false,
      fromUserId: userId,
    };

    const existingNotifications = Array.isArray(creatorProfile.notifications)
      ? creatorProfile.notifications
      : [];

    const updatedNotifications = [...existingNotifications, newNotification];

    const { error: notifyError } = await supabase
      .from('profiles')
      .update({ notifications: updatedNotifications })
      .eq('id', group.created_by);

    setLoading(false);

    if (notifyError) {
      Alert.alert('Error', 'Failed to notify group creator');
    } else {
      // Navigate to WaitingStatusScreen
      navigation.navigate('WaitingStatusScreen', { groupId: selectedGroupId });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Group</Text>

      {groups.length === 0 ? (
        <ActivityIndicator size="large" />
      ) : (
        <Picker
          selectedValue={selectedGroupId}
          onValueChange={(value) => setSelectedGroupId(value)}
          style={styles.picker}
        >
          <Picker.Item label="Select a group..." value={null} />
          {groups.map((group) => (
            <Picker.Item key={group.id} label={group.name} value={group.id} />
          ))}
        </Picker>
      )}

      <Button title="Request to Join" onPress={handleJoinRequest} disabled={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  picker: { marginBottom: 20 },
});

export default JoinGroupScreen;
