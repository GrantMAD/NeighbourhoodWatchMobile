import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

export default function WelcomeScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <Image
                source={require('../../assets/Images/nwLogo.png')}
                style={styles.logo}
                resizeMode="contain"
            />
            <Text style={styles.title}>Welcome to Neighbourhood Watch</Text>
            <Text style={styles.description}>
                Stay informed, stay connected, and keep your community safe.
                Join or create your neighbourhood group and start collaborating today.
            </Text>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.signIn]}
                    onPress={() => navigation.navigate('SignIn')}
                >
                    <Text style={styles.buttonText}>Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.signUp]}
                    onPress={() => navigation.navigate('SignUp')}
                >
                    <Text style={styles.buttonText}>Sign Up</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1f2937", // dark blue-gray background
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    logo: {
        width: 350,
        height: 350,
      },
    title: {
        fontSize: 24,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 16,
        marginTop: -40,
        color: "#f9fafb", // off-white text
    },
    description: {
        fontSize: 16,
        textAlign: "center",
        color: "#d1d5db", // lighter gray text
        marginBottom: 40,
        paddingHorizontal: 10,
    },
    buttonContainer: {
        width: "100%",
    },
    button: {
        paddingVertical: 14,
        borderRadius: 30,
        alignItems: "center",
        marginBottom: 12,
    },
    signIn: {
        backgroundColor: "#14b8a6", // teal
    },
    signUp: {
        backgroundColor: "#f97316", // orange
    },
    buttonText: {
        color: "#f9fafb", // off-white
        fontWeight: "600",
        fontSize: 16,
    },
});
