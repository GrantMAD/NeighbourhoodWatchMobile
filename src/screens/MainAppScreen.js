import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Alert,
  TouchableOpacity,
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableWithoutFeedback,
} from "react-native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from "@react-navigation/drawer";
import { FontAwesome5 } from "@expo/vector-icons";
import HomeScreen from "../screens/HomeScreen";
import AboutScreen from "../screens/AboutScreen";
import MembersScreen from "../screens/MembersScreen";
import SettingsScreen from "../screens/SettingsScreen";
import EventsScreen from "../screens/EventsScreen";
import NewsScreen from "../screens/NewsScreen";
import { supabase } from "../../lib/supabase";

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const { navigation } = props;
  const [userEmail, setUserEmail] = useState("Loading...");
  const placeholderImage = "https://www.gravatar.com/avatar/?d=mp&s=64";

  useEffect(() => {
    async function fetchEmail() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setUserEmail("No user found");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      setUserEmail(error ? "Email not found" : data.email);
    }

    fetchEmail();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Sign Out Error", error.message);
    } else {
      navigation.replace("SignIn");
    }
  };

  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: "#1f2937" }}>
      <View style={styles.profileContainer}>
        <View style={styles.profileInfo}>
          <Image source={{ uri: placeholderImage }} style={styles.profileImage} />
          <View>
            <Text style={styles.welcomeText}>Welcome User</Text>
            <Text style={styles.emailText}>{userEmail}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
          <FontAwesome5 name="cog" size={20} color="#f9fafb" />
        </TouchableOpacity>
      </View>

      <DrawerItemList {...props} />

      <DrawerItem
        label="Sign Out"
        icon={({ color, size }) => (
          <FontAwesome5 name="sign-out-alt" size={size} color="#f9fafb" />
        )}
        labelStyle={{ color: "#fff" }}
        style={{ backgroundColor: "transparent" }}
        onPress={() =>
          Alert.alert("Sign Out", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Yes", onPress: handleSignOut },
          ])
        }
      />
    </DrawerContentScrollView>
  );
}

const NotificationDropdown = ({ notifications, onClose, onNavigate }) => {
  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.dropdownOverlay}>
        <View style={styles.dropdownContainer}>
          <Text style={styles.dropdownTitle}>Notifications</Text>

          {notifications.length === 0 ? (
            <Text style={styles.noNotificationsText}>No notifications</Text>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item, index) => item.id ?? index.toString()}
              style={{ maxHeight: 200 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onClose(); // Close dropdown
                    onNavigate(); // Navigate to full screen
                  }}
                >
                  <View style={styles.notificationItem}>
                    <Text style={styles.notificationUserId}>
                      {item.id ?? "Unknown User"}
                    </Text>
                    <Text style={styles.notificationText}>
                      {item.message || "No message"}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}

          <TouchableOpacity style={styles.viewAllButton} onPress={onNavigate}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const MainAppScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [notifications, setNotifications] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);

  // Fetch notifications and subscribe to updates
  useFocusEffect(
    useCallback(() => {
      let subscription = null;
      let userId = null;

      async function fetchNotifications() {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) return;

        userId = user.id;

        const { data, error } = await supabase
          .from("profiles")
          .select("notifications")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error fetching notifications:", error);
          return;
        }

        const notifs = data.notifications ?? [];
        setNotifications(notifs);
        setHasNotifications(notifs.some((n) => !n.read));

        subscription = supabase
          .channel("notifications-channel")
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "profiles",
              filter: `id=eq.${userId}`,
            },
            (payload) => {
              const updatedNotifs = payload.new.notifications ?? [];
              setNotifications(updatedNotifs);
              setHasNotifications(updatedNotifs.some((n) => !n.read));
            }
          )
          .subscribe();
      }

      fetchNotifications();

      return () => {
        if (subscription) {
          supabase.removeChannel(subscription);
        }
      };
    }, [])
  );

  const screenOptionsWithDrawerButton = ({ navigation }) => ({
    headerShown: true,
    headerStyle: {
      backgroundColor: "#1f2937",
      borderBottomWidth: 1,
      borderBottomColor: "#4b5563",
    },
    headerTintColor: "#f9fafb",
    headerTitleStyle: { fontWeight: "700" },
    headerLeft: () => (
      <TouchableOpacity
        onPress={() => navigation.openDrawer()}
        style={{ marginLeft: 15, marginRight: 10 }}
      >
        <FontAwesome5 name="bars" size={24} color="#f9fafb" />
      </TouchableOpacity>
    ),
    headerRight: () => (
      <View style={{ marginRight: 15 }}>
        <TouchableOpacity onPress={() => setDropdownVisible(!dropdownVisible)}>
          <View>
            <FontAwesome5 name="bell" size={20} color="#f9fafb" />
            {hasNotifications && (
              <View
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: "#f87171",
                }}
              />
            )}
          </View>
        </TouchableOpacity>

        {dropdownVisible && (
          <NotificationDropdown
            notifications={notifications}
            onClose={() => setDropdownVisible(false)}
            onNavigate={() => {
              setDropdownVisible(false);
              navigation.navigate("Notifications");
            }}
          />
        )}
      </View>
    ),
  });

  return (
    <Drawer.Navigator
      screenOptions={({ navigation }) => ({
        ...screenOptionsWithDrawerButton({ navigation }),
        drawerActiveTintColor: "#22d3ee",
        drawerInactiveTintColor: "#fff",
        drawerStyle: { backgroundColor: "#1f2937" },
        drawerLabelStyle: { fontWeight: "600" },
      })}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        initialParams={{ groupId }}
        options={{
          title: "Home",
          drawerIcon: ({ color, size, focused }) => (
            <FontAwesome5
              name="home"
              size={size}
              color={focused ? "#22d3ee" : "#fff"}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="Members"
        component={MembersScreen}
        initialParams={{ groupId }}
        options={{
          title: "Members",
          drawerIcon: ({ color, size, focused }) => (
            <FontAwesome5
              name="users"
              size={size}
              color={focused ? "#22d3ee" : "#fff"}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="Events"
        component={EventsScreen}
        initialParams={{ groupId }}
        options={{
          title: "Events",
          drawerIcon: ({ color, size, focused }) => (
            <FontAwesome5
              name="calendar-alt"
              size={size}
              color={focused ? "#22d3ee" : "#fff"}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="News"
        component={NewsScreen}
        initialParams={{ groupId }}
        options={{
          title: "News",
          drawerIcon: ({ color, size, focused }) => (
            <FontAwesome5
              name="newspaper"
              size={size}
              color={focused ? "#22d3ee" : "#fff"}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="About"
        component={AboutScreen}
        initialParams={{ groupId }}
        options={{
          title: "About",
          drawerIcon: ({ color, size, focused }) => (
            <FontAwesome5
              name="info-circle"
              size={size}
              color={focused ? "#22d3ee" : "#fff"}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        initialParams={{ groupId }}
        options={{
          title: "Settings",
          drawerIcon: ({ color, size, focused }) => (
            <FontAwesome5
              name="cog"
              size={size}
              color={focused ? "#22d3ee" : "#fff"}
            />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  profileContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#4b5563",
    marginBottom: 10,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 15,
  },
  welcomeText: {
    color: "#f9fafb",
    fontWeight: "700",
    fontSize: 14,
  },
  emailText: {
    color: "#f9fafb",
    fontSize: 12,
  },
  dropdownOverlay: {
    position: "absolute",
    top: 40,
    right: 15,
    width: 300,
    backgroundColor: "#374151",
    borderRadius: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownContainer: {
    maxHeight: 250,
  },
  dropdownTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#f9fafb",
    marginBottom: 10,
  },
  noNotificationsText: {
    color: "#d1d5db",
    fontStyle: "italic",
  },
  notificationItem: {
    backgroundColor: "#4b5563",
    borderRadius: 6,
    padding: 10,
    marginVertical: 4,
  },
  notificationUserId: {
    fontWeight: "600",
    color: "#f9fafb",
    marginBottom: 2,
  },
  notificationText: {
    color: "#f9fafb",
  },
  viewAllButton: {
    marginTop: 10,
    paddingVertical: 6,
    backgroundColor: "#22d3ee",
    borderRadius: 6,
  },
  viewAllText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#1f2937",
  },
});

export default MainAppScreen;
