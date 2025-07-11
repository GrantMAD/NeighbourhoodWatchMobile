import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { supabase } from "../../lib/supabase";

function SettingsScreen({ route, navigation }) {
  const { groupId } = route.params;
  const [groupPassword, setGroupPassword] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [isGroupCreator, setIsGroupCreator] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [showManageDropdown, setShowManageDropdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingPassword(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) return;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("is_group_creator, role")
        .eq("id", user.id)
        .single();

      if (!profileError) {
        if (profileData?.is_group_creator) {
          setIsGroupCreator(true);
        }
        setUserRole(profileData?.role);
      }

      const { data, error } = await supabase
        .from("groups")
        .select("group_password")
        .eq("id", groupId)
        .single();

      if (error) {
        Alert.alert("Error", "Failed to load group password.");
      } else {
        setGroupPassword(data.group_password);
      }
      setLoadingPassword(false);
    };

    fetchData();
  }, [groupId]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLeaveGroup = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (userError || !userId) {
      Alert.alert("Error", "Could not get user info");
      return;
    }

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({ group_id: null })
      .eq("id", userId);

    if (profileUpdateError) {
      Alert.alert("Error", "Failed to update profile");
      return;
    }

    const { data: groupData, error: groupFetchError } = await supabase
      .from("groups")
      .select("users")
      .eq("id", groupId)
      .single();

    if (groupFetchError || !groupData?.users) {
      Alert.alert("Error", "Group not found");
      return;
    }

    const updatedUsers = groupData.users.filter((id) => id !== userId);

    const { error: groupUpdateError } = await supabase
      .from("groups")
      .update({ users: updatedUsers })
      .eq("id", groupId);

    if (groupUpdateError) {
      Alert.alert("Error", "Failed to update group user list");
      return;
    }

    navigation.reset({ index: 0, routes: [{ name: "NoGroupScreen" }] });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent} style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.sectionHeader}>👤 Account</Text>
      <Text style={styles.sectionDescription}>Manage your account details and preferences.</Text>
      <TouchableOpacity
        style={styles.option}
        onPress={() => navigation.navigate("ProfileScreen")}
      >
        <Text style={styles.optionText}>Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.option}
        onPress={() => navigation.navigate("ChangePasswordScreen")}
      >
        <Text style={styles.optionText}>Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={handleLeaveGroup}>
        <Text style={styles.optionText}>Leave Group</Text>
      </TouchableOpacity>

      <Text style={styles.sectionHeader}>👥 Group Settings</Text>
      <Text style={styles.sectionDescription}>Oversee group-specific settings and content.</Text>

      {(isGroupCreator || userRole === 'Admin') && (
        <>
          <TouchableOpacity
            style={styles.option}
            onPress={() => navigation.navigate("GroupDataScreen")}
          >
            <Text style={styles.optionText}>Group Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => setShowManageDropdown(!showManageDropdown)}
          >
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={styles.optionText}>Manage</Text>
              <Text style={styles.optionText}>▼</Text>
            </View>
          </TouchableOpacity>

          {showManageDropdown && (
            <View style={styles.dropdown}>
              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={() => navigation.navigate("ManageMembersScreen", { groupId })}
              >
                <Text style={styles.optionText}>Manage Members</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={() => navigation.navigate("ManageEventsScreen", { groupId })}
              >
                <Text style={styles.optionText}>Manage Events</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={() => navigation.navigate("ManageNewsScreen", { groupId })}
              >
                <Text style={styles.optionText}>Manage News</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <TouchableOpacity style={styles.option} onPress={togglePasswordVisibility}>
        <Text style={styles.optionText}>Group Password</Text>
      </TouchableOpacity>

      {showPassword && (
        <View style={styles.passwordBox}>
          {loadingPassword ? (
            <Text style={styles.loadingPasswordText}>Loading password...</Text>
          ) : (
            <Text style={styles.passwordText}>
              {groupPassword || "No password set."}
            </Text>
          )}
          <Text style={styles.hintText}>
            You can use this password to allow other users to join this group
          </Text>
        </View>
      )}

      <Text style={styles.sectionHeader}>🔔 Notification Settings</Text>
      <Text style={styles.sectionDescription}>Configure how you receive notifications.</Text>
      <TouchableOpacity
        style={styles.option}
        onPress={() => navigation.navigate("NotificationSetting")}
      >
        <Text style={styles.optionText}>Notifications</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>Group ID: {groupId}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  scrollViewContent: {
    flexGrow: 1,
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
    color: "#6b7280",
  },
  sectionDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 10,
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
  dropdown: {
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  dropdownOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  passwordBox: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    marginBottom: 10,
    marginTop: 5,
  },
  passwordText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  hintText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 5,
  },
  loadingPasswordText: {
    fontSize: 16,
    color: "#6b7280",
    fontStyle: "italic",
  },
  footerText: {
    marginTop: 40,
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
  },
});

export default SettingsScreen;
