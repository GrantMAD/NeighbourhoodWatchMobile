import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

const CreateGroupScreen = () => {
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const navigation = useNavigation();

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Validation Error', 'Please enter a group name.');
      return;
    }

    setCreating(true);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      Alert.alert('Error', 'User not logged in.');
      setCreating(false);
      return;
    }

    // Step 1: Create the group
    const { data: newGroup, error: groupError } = await supabase
      .from('groups')
      .insert({ name: groupName })
      .select()
      .single();

    if (groupError) {
      Alert.alert('Error creating group', groupError.message);
      setCreating(false);
      return;
    }

    // Step 2: Update the user profile to link group & mark as creator
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        group_id: newGroup.id,
        group_approval_status: 'approved',
        is_group_creator: true,
      })
      .eq('id', user.id);

    if (profileError) {
      Alert.alert('Error updating profile', profileError.message);
      setCreating(false);
      return;
    }

    // Step 3: Navigate to GroupSetupScreen passing the new group's id
    navigation.navigate('GroupSetup', { groupId: newGroup.id });

    setCreating(false);
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Create a New Group</Text>
      <TextInput
        placeholder="Group Name"
        value={groupName}
        onChangeText={setGroupName}
        style={{ borderWidth: 1, marginVertical: 10, padding: 10 }}
      />
      <Button title={creating ? 'Creating...' : 'Create Group'} onPress={handleCreate} disabled={creating} />
    </View>
  );
};

export default CreateGroupScreen;
