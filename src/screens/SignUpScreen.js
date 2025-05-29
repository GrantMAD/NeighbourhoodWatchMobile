import React, { useState } from 'react'
import { View, TextInput, Button, Text, Alert } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) Alert.alert('Error', error.message)
    else Alert.alert('Success')
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Sign Up</Text>
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
      <Button title="Sign Up" onPress={handleSignUp} />
      <Text style={{ marginTop: 20 }}>
        Already have an account?{' '}
        <Text style={{ color: 'blue' }} onPress={() => navigation.navigate('Sign In')}>
          Sign In
        </Text>
      </Text>
    </View>
  )
}
