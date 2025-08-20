// screens/ChangePasswordScreen.js

import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { supabase } from "../../lib/supabase";
import { FontAwesome } from "@expo/vector-icons";

const ChangePasswordScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      navigation.navigate('MainApp', {
        groupId,
        screen: 'Settings',
        params: {
          toastMessage: 'Password updated successfully!',
          toastType: 'success'
        }
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Change Password</Text>
      <Text style={styles.description}>Please enter your new password below. Make sure it's secure and something you can remember.</Text>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="New Password"
          secureTextEntry={!isNewPasswordVisible}
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TouchableOpacity onPress={() => setIsNewPasswordVisible(!isNewPasswordVisible)} style={styles.eyeIcon}>
          <FontAwesome name={isNewPasswordVisible ? 'eye-slash' : 'eye'} size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Confirm New Password"
          secureTextEntry={!isConfirmPasswordVisible}
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} style={styles.eyeIcon}>
          <FontAwesome name={isConfirmPasswordVisible ? 'eye-slash' : 'eye'} size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleChangePassword}
        disabled={loading}
      >
        {loading ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={[styles.buttonText, {marginLeft: 10}]}>Changing...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Change Password</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
    color: "#4338ca",
  },
  description: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    borderWidth: 0,
  },
  eyeIcon: {
    padding: 12,
  },
  button: {
    backgroundColor: "#4338ca",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChangePasswordScreen;