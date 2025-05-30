import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';

const CreateGroupScreen = ({ navigation }) => {
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Validation Error', 'Please enter a group name.');
      return;
    }

    setCreating(true);
    const user = (await supabase.auth.getUser()).data.user;

    // Create new group
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

    // Update user profile to link to this group
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
    } else {
      // AppNavigator will detect the updated profile and navigate accordingly
    }

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
      <Button title={creating ? 'Creating...' : 'Create'} onPress={handleCreate} disabled={creating} />
    </View>
  );
};

export default CreateGroupScreen;
