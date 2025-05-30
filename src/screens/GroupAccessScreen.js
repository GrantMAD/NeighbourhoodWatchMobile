// screens/GroupAccessScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function GroupAccessScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Get Started</Text>
      <Button title="Join an Existing Group" onPress={() => navigation.navigate('JoinGroup')} />
      <View style={styles.divider} />
      <Button title="Create a New Group" onPress={() => navigation.navigate('CreateGroup')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, marginBottom: 30, fontWeight: 'bold' },
  divider: { height: 20 },
});
