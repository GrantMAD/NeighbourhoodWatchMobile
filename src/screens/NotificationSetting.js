// NotificationSettingsScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, Switch, StyleSheet, Alert } from "react-native";
import { supabase } from "../../lib/supabase";

const NotificationSetting = () => {
  const [receiveCheckNotifications, setReceiveCheckNotifications] = useState(true);
  const [receiveEventNotifications, setReceiveEventNotifications] = useState(true);
  const [receiveNewsNotifications, setReceiveNewsNotifications] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSetting() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("receive_check_notifications, receive_event_notifications, receive_news_notifications")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
        Alert.alert("Error", "Failed to load notification settings.");
      } else {
        setReceiveCheckNotifications(data?.receive_check_notifications ?? true);
        setReceiveEventNotifications(data?.receive_event_notifications ?? true);
        setReceiveNewsNotifications(data?.receive_news_notifications ?? true);
      }

      setLoading(false);
    }

    fetchSetting();
  }, []);

  const toggleNotificationSetting = async (settingName, currentValue, setterFunction) => {
    setterFunction(!currentValue);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ [settingName]: !currentValue })
      .eq("id", user.id);

    if (error) {
      Alert.alert("Error", `Could not update ${settingName.replace("receive_", "").replace("_notifications", "")} setting.`);
      setterFunction(currentValue); // Revert on error
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notification Preferences</Text>
      <View style={styles.optionRow}>
        <Text style={styles.optionText}>Receive Check-In/Out Notifications</Text>
        <Switch
          onValueChange={() => toggleNotificationSetting(
            'receive_check_notifications',
            receiveCheckNotifications,
            setReceiveCheckNotifications
          )}
          value={receiveCheckNotifications}
          disabled={loading}
        />
      </View>

      <View style={styles.optionRow}>
        <Text style={styles.optionText}>Receive Event Notifications</Text>
        <Switch
          onValueChange={() => toggleNotificationSetting(
            'receive_event_notifications',
            receiveEventNotifications,
            setReceiveEventNotifications
          )}
          value={receiveEventNotifications}
          disabled={loading}
        />
      </View>

      <View style={styles.optionRow}>
        <Text style={styles.optionText}>Receive News Notifications</Text>
        <Switch
          onValueChange={() => toggleNotificationSetting(
            'receive_news_notifications',
            receiveNewsNotifications,
            setReceiveNewsNotifications
          )}
          value={receiveNewsNotifications}
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