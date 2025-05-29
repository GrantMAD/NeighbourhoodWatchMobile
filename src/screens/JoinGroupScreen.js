import React from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { useGroup } from '../context/GroupContext';

const JoinGroupScreen = ({ navigation }) => {
  const [groupCode, setGroupCode] = React.useState('');
  const { setGroupId } = useGroup();

  const handleJoin = () => {
    setGroupId(groupCode);
    navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20 }}>Join an Existing Group</Text>
      <TextInput
        placeholder="Enter Group Code"
        value={groupCode}
        onChangeText={setGroupCode}
        style={{ borderWidth: 1, marginVertical: 10, padding: 10 }}
      />
      <Button title="Join" onPress={handleJoin} />
    </View>
  );
};

export default JoinGroupScreen;