import React, { useState } from 'react'
import { View, TextInput, Button, Text, Alert } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) Alert.alert('Error', error.message)
    else Alert.alert('Success', 'Signed in successfully!')
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Sign In</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
      />
      <Button title="Sign In" onPress={handleSignIn} />
      <Text style={{ marginTop: 20 }}>
        Don't have an account?{' '}
        <Text style={{ color: 'blue' }} onPress={() => navigation.navigate('Sign Up')}>
          Sign Up
        </Text>
      </Text>
    </View>
  )
}
