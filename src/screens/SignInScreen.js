import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { ActivityIndicator } from 'react-native';

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        Alert.alert('Error', authError.message);
        return;
      }

      const user = authData?.user;
      if (!user) {
        navigation.replace('NoGroupScreen');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('group_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || !profile.group_id) {
        navigation.replace('NoGroupScreen');
        return;
      }

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
        placeholderTextColor="#9ca3af"
        style={styles.input}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholderTextColor="#9ca3af"
          style={styles.passwordInput}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <FontAwesome5
            name={showPassword ? 'eye-slash' : 'eye'}
            size={20}
            color="#9ca3af"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.signInButton, loading && styles.loadingSignInButton]}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.signInButtonText}>Signing In...</Text>
            <ActivityIndicator size="small" color="#f9fafb" style={{ marginLeft: 8 }} />
          </View>
        ) : (
          <Text style={styles.signInButtonText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.signUpText}>
        Don't have an account?{' '}
        <Text style={styles.signUpLink} onPress={() => navigation.navigate('SignUp')}>
          Sign Up
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#1f2937', // dark blue-gray background
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    color: '#f9fafb', // off-white text
    fontWeight: '700',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    color: '#111827', // dark text
    paddingHorizontal: 10,
    marginBottom: 10,
    height: 40,
    borderRadius: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    marginBottom: 10,
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    color: '#111827', // dark text
  },
  signInButton: {
    backgroundColor: '#4338ca', 
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  signInButtonText: {
    color: '#f9fafb',
    fontWeight: '600',
    fontSize: 16,
  },
  signUpText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#d1d5db', 
  },
  signUpLink: {
    color: '#22c55e', 
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSignInButton: {
    backgroundColor: '#a5b4fc',
  },
});
