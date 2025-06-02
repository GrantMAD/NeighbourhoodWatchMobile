import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        Alert.alert('Error', authError.message);
        return;
      }

      const user = authData?.user;
      if (!user) {
        navigation.replace('GroupAccess');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('group_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || !profile.group_id) {
        navigation.replace('GroupAccess');
        return;
      }

      // No need to fetch the full group here, since HomeScreen fetches it
      navigation.replace('MainApp', { groupId: profile.group_id });

    } catch (error) {
      console.error('Sign-in error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title={loading ? 'Signing In...' : 'Sign In'} onPress={handleSignIn} disabled={loading} />
      <Text style={{ marginTop: 20 }}>
        Don't have an account?{' '}
        <Text style={{ color: 'blue' }} onPress={() => navigation.navigate('SignUp')}>
          Sign Up
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', padding: 20
  },
  title: {
    fontSize: 24, marginBottom: 20
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
});
