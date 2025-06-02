// components/Toast.js
import React, { useEffect } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export default function Toast({ visible, message, type = 'success', onHide }) {
    const opacity = new Animated.Value(0);

    useEffect(() => {
        if (visible) {
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setTimeout(() => {
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }).start(onHide);
                }, 2000);
            });
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.toast, type === 'success' ? styles.success : styles.error, { opacity }]}>
            <Text style={styles.message}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        top: 50,
        right: 20,
        padding: 10,
        borderRadius: 8,
        zIndex: 999,
        elevation: 10,
    },
    success: {
        backgroundColor: '#4CAF50',
    },
    error: {
        backgroundColor: '#f44336',
    },
    message: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
