import React from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { useGroup } from '../context/GroupContext';

const CreateGroupScreen = ({ navigation }) => {
  const [groupName, setGroupName] = React.useState('');
  const { setGroupId } = useGroup();

  const handleCreate = () => {
    const fakeGroupId = groupName.toLowerCase().replace(/\s+/g, '-');
    setGroupId(fakeGroupId);
    navigation.reset({ index: 0, routes: [{ name: 'GroupSetup' }] });
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20 }}>Create a New Group</Text>
      <TextInput
        placeholder="Group Name"
        value={groupName}
        onChangeText={setGroupName}
        style={{ borderWidth: 1, marginVertical: 10, padding: 10 }}
      />
      <Button title="Create" onPress={handleCreate} />
    </View>
  );
};

export default CreateGroupScreen;