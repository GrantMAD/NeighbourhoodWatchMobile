import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { FontAwesome } from '@expo/vector-icons';

const JoinGroupScreen = () => {
  const [groupPasswordInput, setGroupPasswordInput] = useState('');
  const [foundGroup, setFoundGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();

  const handleFindGroup = async () => {
    if (!groupPasswordInput.trim()) {
      Alert.alert('Error', 'Please enter a group password.');
      return;
    }
    setSearching(true);
    setFoundGroup(null);

    const { data, error } = await supabase
      .from('groups')
      .select('id, name')
      .eq('group_password', groupPasswordInput.trim());

    setSearching(false);

    if (error || !data || data.length === 0) {
      Alert.alert('Group Not Found', 'No group found with that password. Please check the password and try again.');
    } else {
      setFoundGroup(data[0]);
    }
  };

  const handleJoinRequest = async () => {
    if (!foundGroup) {
      Alert.alert('Please find a group before requesting to join.');
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
      .eq('id', foundGroup.id)
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

    const { error: updateGroupError } = await supabase
      .rpc('add_join_request', {
        p_group_id: foundGroup.id,
        p_user_id: userId,
        p_request_id: requestId,
        p_requested_at: newRequest.requestedAt,
        p_status: newRequest.status,
      });

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
      .update({ requestedgroupid: foundGroup.id })
      .eq('id', userId);

    if (updateRequesterError) {
      console.error('Failed to update requestedGroupId in profile:', updateRequesterError);
    }

    setLoading(false);

    if (notifyError) {
      Alert.alert('Error', 'Failed to notify group creator');
    } else {
      navigation.reset({
        index: 1,
        routes: [
          { name: 'NoGroupScreen' },
          { name: 'WaitingStatusScreen', params: { groupId: foundGroup.id } },
        ],
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Group</Text>
      <Text style={styles.description}>
        Enter the group password to find and request to join a group.
      </Text>

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Enter group password"
          secureTextEntry={!showPassword}
          style={styles.passwordInput}
          value={groupPasswordInput}
          onChangeText={setGroupPasswordInput}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={24} color="gray" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleFindGroup}
        disabled={searching || loading}
        style={styles.findButton}
      >
        {searching ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.joinButtonText}>Find Group</Text>
        )}
      </TouchableOpacity>

      {foundGroup && (
        <View style={styles.card}>
          <View style={styles.groupInfo}>
            <Text style={styles.emoji}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.groupName} numberOfLines={1} ellipsizeMode="tail">{foundGroup.name}</Text>
          </View>
          <TouchableOpacity
            onPress={handleJoinRequest}
            disabled={loading}
            style={styles.joinButton}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.joinButtonText}>Request</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#1f2937',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#d1d5db',
    marginBottom: 20,
    textAlign: 'center',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  findButton: {
    backgroundColor: '#14b8a6',
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  joinButton: {
    backgroundColor: '#f97316',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Allow group info to take up available space
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
    flex: 1, // Allow text to shrink and wrap if needed
  },
  card: {
    marginTop: 20,
    backgroundColor: '#2d3748',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 0.5,
    borderColor: 'white',
  },
  emoji: {
    fontSize: 40,
  },
});

export default JoinGroupScreen;

