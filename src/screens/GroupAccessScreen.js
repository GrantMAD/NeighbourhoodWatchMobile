import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

export default function GroupAccessScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome! Choose an option:</Text>

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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
})
