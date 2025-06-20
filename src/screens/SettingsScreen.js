import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";

function SettingsScreen({ route, navigation }) {
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
        onPress={() => navigation.navigate("ProfileScreen")}  // navigate to ProfileScreen
      >
        <Text style={styles.optionText}>Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.option}
        onPress={() => navigation.navigate("ChangePasswordScreen")}
      >
        <Text style={styles.optionText}>Change Password</Text>
      </TouchableOpacity>

      <Text style={styles.sectionHeader}>Group Settings</Text>
      <TouchableOpacity
        style={styles.option}
        onPress={() => navigation.navigate("GroupDataScreen")}
      >
        <Text style={styles.optionText}>Group Data</Text>
      </TouchableOpacity>

      <Text style={styles.sectionHeader}>Notification Settings</Text>
      <TouchableOpacity
        style={styles.option}
        onPress={() => navigation.navigate("NotificationSetting")}
      >
        <Text style={styles.optionText}>Notifications</Text>
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
