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
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) {
                Alert.alert('Error', authError.message);
                setLoading(false);
                return;
            }

            await supabase.auth.refreshSession();
            console.log('Triggered auth refresh to refetch profile');
            Alert.alert('Success', 'Account created successfully!');

            setTimeout(() => {
                navigation.replace('GroupAccess');
            }, 1500);
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
                style={styles.signUpButton}
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
});
