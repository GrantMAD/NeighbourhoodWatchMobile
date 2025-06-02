import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";

function SettingsScreen({ route }) {
  const { groupId } = route.params;

  const handleOptionPress = (optionName) => {
    Alert.alert("Settings", `You tapped on "${optionName}"`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.sectionHeader}>Account</Text>
      <TouchableOpacity
        style={styles.option}
        onPress={() => handleOptionPress("Profile")}
      >
        <Text style={styles.optionText}>Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.option}
        onPress={() => handleOptionPress("Change Password")}
      >
        <Text style={styles.optionText}>Change Password</Text>
      </TouchableOpacity>

      <Text style={styles.sectionHeader}>Notifications</Text>
      <TouchableOpacity
        style={styles.option}
        onPress={() => handleOptionPress("Push Notifications")}
      >
        <Text style={styles.optionText}>Push Notifications</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.option}
        onPress={() => handleOptionPress("Email Notifications")}
      >
        <Text style={styles.optionText}>Email Notifications</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>Group ID: {groupId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    color: "#4338ca",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
    color: "#6b7280", // cool gray
  },
  option: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  optionText: {
    fontSize: 16,
    color: "#111827",
  },
  footerText: {
    marginTop: 40,
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
  },
});

export default SettingsScreen;
