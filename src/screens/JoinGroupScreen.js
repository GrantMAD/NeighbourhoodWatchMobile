import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

const JoinGroupScreen = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupPasswordInput, setGroupPasswordInput] = useState('');
  const [actualGroupPassword, setActualGroupPassword] = useState('');
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

  const fetchGroupPassword = async (groupId) => {
    const { data, error } = await supabase
      .from('groups')
      .select('group_password')
      .eq('id', groupId)
      .single();

    if (error || !data?.group_password) {
      Alert.alert('Error', 'Failed to fetch group password');
      setActualGroupPassword('');
      return;
    }

    setActualGroupPassword(data.group_password);
  };

  const handleGroupChange = (groupId) => {
    setSelectedGroupId(groupId);
    setGroupPasswordInput('');
    if (groupId) fetchGroupPassword(groupId);
  };

  const handleJoinRequest = async () => {
    if (!selectedGroupId) {
      Alert.alert('Please select a group to join');
      return;
    }

    if (!groupPasswordInput || groupPasswordInput.trim() !== actualGroupPassword) {
      Alert.alert('Incorrect Password', 'The password you entered is incorrect.');
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

    const requestId = `req-${Date.now()}`;

    const newRequest = {
      id: requestId,
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

    const { data: requesterProfiles, error: requesterError } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    if (requesterError || !requesterProfiles) {
      setLoading(false);
      Alert.alert('Error', 'Failed to get your profile info');
      return;
    }

    const requesterName = requesterProfiles.name;

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
      requestId,
      message: `${requesterName} requested to join your group "${group.name}"`,
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

    const { error: updateRequesterError } = await supabase
      .from('profiles')
      .update({ requestedgroupid: selectedGroupId })
      .eq('id', userId);

    if (updateRequesterError) {
      console.error('Failed to update requestedGroupId in profile:', updateRequesterError);
    }

    setLoading(false);

    if (notifyError) {
      Alert.alert('Error', 'Failed to notify group creator');
    } else {
      navigation.navigate('WaitingStatusScreen', { groupId: selectedGroupId });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Group</Text>
      <Text style={styles.description}>
        Choose a group from the list below and enter the group password to request to join.
      </Text>

      {groups.length === 0 ? (
        <ActivityIndicator size="large" />
      ) : (
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedGroupId}
            onValueChange={handleGroupChange}
            style={styles.picker}
          >
            <Picker.Item label="Select a group..." value={null} />
            {groups.map((group) => (
              <Picker.Item key={group.id} label={group.name} value={group.id} />
            ))}
          </Picker>
        </View>
      )}

      {selectedGroupId && (
        <>
          <TextInput
            placeholder="Enter group password"
            secureTextEntry
            style={styles.passwordInput}
            value={groupPasswordInput}
            onChangeText={setGroupPasswordInput}
          />
        </>
      )}

      <TouchableOpacity
        onPress={handleJoinRequest}
        disabled={loading}
        style={styles.joinButton}
      >
        <Text style={styles.joinButtonText}>
          {loading ? 'Requesting...' : 'Request to Join'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#1f2937' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: 'white' },
  pickerWrapper: {
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  picker: {
    height: 60,
  },
  passwordInput: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  joinButton: {
    backgroundColor: '#14b8a6',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    color: '#d1d5db',
    marginBottom: 20,
  },
});

export default JoinGroupScreen;
