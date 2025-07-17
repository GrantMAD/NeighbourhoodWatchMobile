import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

export default function GroupAccessScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome! Choose an option:</Text>
      <Text style={styles.description}>
        You can either join a group that has already been created or create a new one for your community.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('JoinGroup')}
      >
        <Text style={styles.buttonText}>Join Existing Group</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.createButton]}
        onPress={() => navigation.navigate('CreateGroup')}
      >
        <Text style={styles.buttonText}>Create New Group</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#1f2937',
  },
  title: {
    fontSize: 22,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'white',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: 'white',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#14b8a6',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#f97316',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
})
