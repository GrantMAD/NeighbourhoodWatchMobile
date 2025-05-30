import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';

const JoinGroupScreen = () => {
  const [groupCode, setGroupCode] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!groupCode.trim()) {
      Alert.alert('Validation Error', 'Please enter a group code.');
      return;
    }

    setJoining(true);
    const user = (await supabase.auth.getUser()).data.user;

    // Validate that group exists
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id')
      .eq('id', groupCode)
      .single();

    if (groupError || !group) {
      Alert.alert('Group Not Found', 'No group found with that code.');
      setJoining(false);
      return;
    }

    // Insert join request
    const { error: requestError } = await supabase
      .from('group_join_requests')
      .insert({
        user_id: user.id,
        group_id: group.id,
      });

    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        group_id: group.id,
        group_approval_status: 'pending',
      })
      .eq('id', user.id);

    if (requestError || profileError) {
      Alert.alert('Error', requestError?.message || profileError?.message);
    } else {
      // AppNavigator will automatically navigate to PendingApprovalScreen
    }

    setJoining(false);
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Join an Existing Group</Text>
      <TextInput
        placeholder="Enter Group Code"
        value={groupCode}
        onChangeText={setGroupCode}
        style={{ borderWidth: 1, marginVertical: 10, padding: 10 }}
      />
      <Button title={joining ? 'Joining...' : 'Join'} onPress={handleJoin} disabled={joining} />
    </View>
  );
};

export default JoinGroupScreen;
