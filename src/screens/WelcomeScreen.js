import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Optional logo */}
      <Image 
        source={require('../../assets/images/nwLogo.png')} 
        style={styles.logo} 
        resizeMode="contain"
      />

      <Text style={styles.title}>Welcome to Neighbourhood Watch</Text>
      <Text style={styles.subtitle}>
        Connect with your community and stay informed.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('CreateGroup')}
      >
        <Text style={styles.buttonText}>Create Group</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.joinButton]}
        onPress={() => navigation.navigate('JoinGroup')}
      >
        <Text style={[styles.buttonText, styles.joinButtonText]}>Join Group</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logo: {
    width: 320,
    height: 320,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
    color: '#1a202c',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#3182ce',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: '#e2e8f0',
  },
  joinButtonText: {
    color: '#3182ce',
  },
});

export default WelcomeScreen;
