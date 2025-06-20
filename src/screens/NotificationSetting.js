// NotificationSettingsScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, Switch, StyleSheet, Alert } from "react-native";
import { supabase } from "../../lib/supabase";

const NotificationSetting = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSetting() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("receive_check_notifications")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
        Alert.alert("Error", "Failed to load notification settings.");
      } else {
        setIsEnabled(data?.receive_check_notifications ?? true);
      }

      setLoading(false);
    }

    fetchSetting();
  }, []);

  const toggleSwitch = async () => {
    setIsEnabled((prev) => !prev);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ receive_check_notifications: !isEnabled })
      .eq("id", user.id);

    if (error) {
      Alert.alert("Error", "Could not update setting.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notification Preferences</Text>
      <View style={styles.optionRow}>
        <Text style={styles.optionText}>Receive Check-In/Out Notifications</Text>
        <Switch
          onValueChange={toggleSwitch}
          value={isEnabled}
          disabled={loading}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 30,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  optionText: {
    fontSize: 16,
    color: "#111827",
  },
});

export default NotificationSetting;
