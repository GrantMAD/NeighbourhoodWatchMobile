import React, { useState } from 'react'
import { View, TextInput, Button, Text, Alert } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function SignUpScreen({ navigation }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSignUp = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);

        try {
            // Step 1: Create the auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password
            });

            if (authError) {
                Alert.alert('Error', authError.message);
                setLoading(false);
                return;
            }

            // Optional: wait a bit or trigger refresh to help onAuthStateChange pick up the new session
            await supabase.auth.refreshSession();
            console.log('Triggered auth refresh to refetch profile');

            Alert.alert('Success', 'Account created successfully!');

            // Navigate to GroupAccess screen after successful signup
            navigation.replace('GroupAccess');

        } catch (error) {
            console.error('Signup error:', error);
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };


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
            <Button
                title={loading ? "Creating Account..." : "Sign Up"}
                onPress={handleSignUp}
                disabled={loading}
            />
            <Text style={{ marginTop: 20 }}>
                Already have an account?{' '}
                <Text style={{ color: 'blue' }} onPress={() => navigation.navigate('SignIn')}>
                    Sign In
                </Text>
            </Text>
        </View>
    )
}