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

export default function SignUpScreen({ navigation }) {
    const [name, setName] = useState(''); // NEW: name input state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);

        try {
            // Sign up user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) {
                Alert.alert('Error', authError.message);
                setLoading(false);
                return;
            }

            // Wait for user id
            const userId = authData.user?.id;
            if (!userId) {
                Alert.alert('Error', 'User ID not found after sign up');
                setLoading(false);
                return;
            }

            // Update profiles table with name for the new user
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({ id: userId, name, is_verified: true });

            if (profileError) {
                Alert.alert('Error', 'Failed to update profile name');
                setLoading(false);
                return;
            }

            Alert.alert('Success', 'Account created successfully!');

            navigation.replace('GroupAccess');
        } catch (error) {
            console.error('Signup error:', error);
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sign Up</Text>

            <TextInput
                placeholder="Name"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#9ca3af"
                style={styles.input}
            />

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
                style={[styles.signUpButton, loading && styles.loadingSignUpButton]}
                onPress={handleSignUp}
                disabled={loading}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.signUpButtonText}>Creating Account...</Text>
                        <ActivityIndicator size="small" color="#f9fafb" style={{ marginLeft: 8 }} />
                    </View>
                ) : (
                    <Text style={styles.signUpButtonText}>Sign Up</Text>
                )}
            </TouchableOpacity>

            <Text style={styles.signInText}>
                Already have an account?{' '}
                <Text style={styles.signInLink} onPress={() => navigation.navigate('SignIn')}>
                    Sign In
                </Text>
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    // your styles unchanged, just add styling for name input like other inputs
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#1f2937', // dark blue-gray background
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        color: '#f9fafb',
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
    signUpButton: {
        backgroundColor: '#22c55e', // green button
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    signUpButtonText: {
        color: '#f9fafb',
        fontWeight: '600',
        fontSize: 16,
    },
    signInText: {
        marginTop: 20,
        textAlign: 'center',
        color: '#d1d5db',
    },
    signInLink: {
        color: '#60a5fa', // soft blue
        fontWeight: '600',
    },
    loadingContainer: {
        flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSignUpButton: {
    backgroundColor: '#86efac',
  },
});
