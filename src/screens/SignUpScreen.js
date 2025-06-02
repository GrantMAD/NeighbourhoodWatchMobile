import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';
import Toast from '../components/Toast';

export default function SignUpScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    const showToast = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
    };

    const handleSignUp = async () => {
        if (!email || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        setLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password
            });

            if (authError) {
                showToast(authError.message, 'error');
                setLoading(false);
                return;
            }

            await supabase.auth.refreshSession();
            console.log('Triggered auth refresh to refetch profile');
            showToast('Account created successfully!', 'success');

            // Delay navigation slightly to allow user to see toast
            setTimeout(() => {
                navigation.replace('GroupAccess');
            }, 1500);
        } catch (error) {
            console.error('Signup error:', error);
            showToast('An unexpected error occurred', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Toast
                visible={toastVisible}
                message={toastMessage}
                type={toastType}
                onHide={() => setToastVisible(false)}
            />

            <Text style={styles.title}>Sign Up</Text>
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
