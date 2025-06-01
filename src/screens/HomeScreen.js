import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HomeScreen = ({ route }) => {
  const { groupId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏡 Home Screen</Text>
      <Text style={styles.text}>Group ID: {groupId}</Text>
      <Text style={styles.text}>You're successfully inside the group instance 🎉</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  text: { fontSize: 16, marginBottom: 10 },
});

export default HomeScreen;
