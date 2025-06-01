import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';

const JoinGroupScreen = () => {
  const [groupCode, setGroupCode] = useState('');
  const navigation = useNavigation();

  const handleJoin = async () => {
    if (!groupCode) {
      Alert.alert('Error', 'Please enter a group code');
      return;
    }

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id')
      .eq('code', groupCode) // or use group name if you don’t have a code
      .single();

    if (groupError || !group) {
      Alert.alert('Group Not Found', 'No group matches this code');
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      Alert.alert('Error', 'Failed to fetch user');
      return;
    }

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ group_id: group.id })
      .eq('id', userData.user.id);

    if (profileUpdateError) {
      Alert.alert('Error', 'Failed to join group');
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainApp', params: { groupId: group.id } }],
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Group</Text>
      <TextInput
        placeholder="Enter Group Code"
        style={styles.input}
        value={groupCode}
        onChangeText={setGroupCode}
      />
      <Button title="Join Group" onPress={handleJoin} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20, borderRadius: 6,
  },
});

export default JoinGroupScreen;
