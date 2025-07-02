import React, { useEffect, useState, useCallback, useRef } from "react";
import { useFocusEffect, getFocusedRouteNameFromRoute } from "@react-navigation/native";
import {
  Modal,
  Alert,
  TouchableOpacity,
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from "react-native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FontAwesome5 } from "@expo/vector-icons";
import HomeScreen from "../screens/HomeScreen";
import AboutScreen from "../screens/AboutScreen";
import MembersScreen from "../screens/MembersScreen";
import SettingsScreen from "../screens/SettingsScreen";
import EventsScreen from "../screens/EventsScreen";
import NoGroupScreen from "../screens/NoGroupScreen";
import NewsScreen from "../screens/NewsScreen";
import { supabase } from "../../lib/supabase";
import IncidentsScreen from "../screens/IncidentsScreen";
import ContactScreen from "../screens/ContactScreen";
import CheckedInScreen from "../screens/CheckedInScreen";

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

function CustomDrawerContent(props) {
  const { navigation } = props;
  const [userName, setUserName] = useState("Loading...");
  const [userEmail, setUserEmail] = useState("Loading...");
  const placeholderImage = "https://www.gravatar.com/avatar/?d=mp&s=64";
  const [avatarUrl, setAvatarUrl] = useState(placeholderImage);

  useFocusEffect(
    useCallback(() => {
      async function fetchUserData() {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setUserName("No user found");
          setUserEmail("");
          setAvatarUrl(placeholderImage);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("name, email, avatar_url")
          .eq("id", user.id)
          .single();

        if (error || !data) {
          setUserName("Name not found");
          setUserEmail("Email not found");
          setAvatarUrl(placeholderImage);
        } else {
          setUserName(data.name || "User");
          setUserEmail(data.email || "");
          setAvatarUrl(data.avatar_url ? `${data.avatar_url}?t=${Date.now()}` : placeholderImage);
        }
      }

      fetchUserData();
    }, [])
  );

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
          <Image source={{ uri: avatarUrl }} style={styles.profileImage} />
          <View>
            <Text style={styles.welcomeText}>Welcome {userName}</Text>
            <Text style={styles.emailText}>{userEmail}</Text>
          </View>
        </View>
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

const NotificationDropdown = ({ notifications, onClose, onNavigate, visible, onDeleteNotification }) => {
  const getTypeIconName = (type) => {
    switch (type) {
      case "join_request":
        return "users"; // group icon
      case "check_status":
        return "info-circle"; // info icon
      default:
        return "bell"; // fallback
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={{ flexDirection: 'row', marginTop: 10, }}>
                <Text style={styles.dropdownTitle}>Notifications</Text>
                <View
                  style={{
                    backgroundColor: '#f87171',
                    borderRadius: 10,
                    paddingHorizontal: 6,
                    marginLeft: 6,
                    minWidth: 20,
                    height: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 12 }}>
                    {notifications.length}
                  </Text>
                </View>
              </View>

              {notifications.length === 0 ? (
                <Text style={styles.noNotificationsText}>No notifications</Text>
              ) : (
                <FlatList
                  data={notifications}
                  keyExtractor={(item, index) => item.id ?? index.toString()}
                  contentContainerStyle={{ paddingBottom: 10 }}
                  showsVerticalScrollIndicator
                  style={{ maxHeight: 240 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        onClose();
                        onNavigate();
                      }}
                    >
                      <View style={styles.notificationItem}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                          <FontAwesome5
                            name={getTypeIconName(item.type)}
                            size={14}
                            color="white"
                            style={{ marginRight: 6 }}
                          />
                          <Text style={styles.notificationUserId}>
                            {item.type === "join_request"
                              ? "Group Join Request"
                              : item.type === "check_status"
                                ? "Status Update"
                                : "Notification"}
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <FontAwesome5
                            name="envelope"
                            size={13}
                            color="gray"
                            style={{ marginRight: 6 }}
                          />
                          <Text style={styles.notificationText}>
                            {item.message || "No message"}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}

              <TouchableOpacity style={styles.viewAllButton} onPress={onNavigate}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

function BottomTabNavigator({ route }) {
    const { groupId } = route.params;
    return (
      <Tab.Navigator
        tabBar={(props) => <SlidingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} initialParams={{ groupId }} />
        <Tab.Screen name="Members" component={MembersScreen} initialParams={{ groupId }} />
        <Tab.Screen name="Events" component={EventsScreen} initialParams={{ groupId }} />
        <Tab.Screen name="News" component={NewsScreen} initialParams={{ groupId }} />
        <Tab.Screen name="Incidents" component={IncidentsScreen} initialParams={{ groupId }} />
      </Tab.Navigator>
    );
  }

const SlidingTabBar = ({ state, descriptors, navigation }) => {
  const tabWidth = Dimensions.get('window').width / state.routes.length;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
    }).start();
  }, [state.index, tabWidth]);

  const getIconName = (routeName) => {
    switch (routeName) {
      case 'Home': return 'home';
      case 'Members': return 'users';
      case 'Events': return 'calendar-alt';
      case 'News': return 'newspaper';
      case 'Incidents': return 'exclamation-triangle';
      default: return '';
    }
  };

  return (
    <View style={styles.tabBarContainer}>
      <Animated.View
        style={[
          styles.activeTab,
          {
            width: tabWidth,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
          >
            <FontAwesome5
              name={getIconName(route.name)}
              size={22}
              color={isFocused ? '#22d3ee' : '#fff'}
            />
            <Text style={{ color: isFocused ? '#22d3ee' : '#fff', fontSize: 12, marginTop: 4 }}>
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const MainAppScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [notifications, setNotifications] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkedInCount, setCheckedInCount] = useState(0);

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
          .select("notifications, checked_in")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error fetching notifications:", error);
          return;
        }

        const notifs = data.notifications ?? [];
        setNotifications(notifs);
        setHasNotifications(notifs.some((n) => !n.read));
        setCheckedIn(data.checked_in ?? false);

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
              setCheckedIn(payload.new.checked_in ?? false);
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

  useFocusEffect(
    useCallback(() => {
      async function fetchCheckedInCount() {
        const { count, error } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("checked_in", true);

        if (!error) {
          setCheckedInCount(count ?? 0);
        } else {

          console.error("Error fetching checked-in count:", error);
        }
      }

      fetchCheckedInCount();
    }, [])
  );


  const screenOptionsWithDrawerButton = ({ navigation, route }) => ({
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
      <View style={{ flexDirection: "row", alignItems: "center", marginRight: 15 }}>
        {/* Check In/Out Button */}
        <TouchableOpacity
          onPress={async () => {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            // Get current checked_in status AND group_id
            const { data, error } = await supabase
              .from("profiles")
              .select("checked_in, group_id")
              .eq("id", user.id)
              .single();

            if (error || !data) {
              Alert.alert("Error", "Unable to fetch current check-in status.");
              return;
            }

            const newCheckedIn = !data.checked_in;
            const timestampField = newCheckedIn ? "check_in_time" : "check_out_time";

            // Update checked_in status
            const { error: updateStatusError } = await supabase
              .from("profiles")
              .update({ checked_in: newCheckedIn })
              .eq("id", user.id);

            if (updateStatusError) {
              Alert.alert("Error", "Failed to update check-in status.");
              return;
            }

            // Append timestamp via RPC
            const { error: appendError } = await supabase.rpc("append_check_time", {
              field_name: timestampField,
              user_id: user.id,
            });

            if (appendError) {
              Alert.alert("Error", "Failed to update check-in/check-out time.");
              return;
            }

            setCheckedIn(newCheckedIn);

            // --- NEW: Notify group users ---
            if (data.group_id) {
              notifyGroupUsersAboutCheckStatus(user.id, data.group_id, newCheckedIn ? "checked in" : "checked out");
            }
          }}
          style={{
            marginRight: 20,
            backgroundColor: checkedIn ? "#ef4444" : "#22c55e",
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 6,
            marginLeft: 15,
          }}
        >
          <Text style={{ color: "#f9fafb", fontWeight: "bold" }}>
            {checkedIn ? "Check Out" : "Check In"}
          </Text>
        </TouchableOpacity>

        {/* Notification Bell */}
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
            visible={dropdownVisible}
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

  async function notifyGroupUsersAboutCheckStatus(userId, groupId, status) {
    try {
      // Step 1: Get name of the user who triggered the action
      const { data: senderProfile, error: senderError } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", userId)
        .single();

      if (senderError || !senderProfile) {
        console.error("Failed to fetch sender's name", senderError);
        return;
      }

      const senderName = senderProfile.name || "A member";

      // Step 2: Get all other users in the group
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("users")
        .eq("id", groupId)
        .single();

      if (groupError || !groupData?.users) {
        console.error("Failed to fetch group users", groupError);
        return;
      }

      const otherUserIds = groupData.users.filter(id => id !== userId);
      if (otherUserIds.length === 0) return;

      // Step 3: Get profiles of users who have not opted out
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, notifications, receive_check_notifications")
        .in("id", otherUserIds);

      if (profilesError || !profiles) {
        console.error("Failed to fetch profiles for notifications", profilesError);
        return;
      }

      const timestamp = new Date().toISOString();
      const notification = {
        id: generateUniqueId(),
        type: "check_status",
        message: `${senderName} has ${status}.`,
        timestamp,
        seen: false,
      };

      // Step 4: Append to each recipient's notifications ONLY if they opted in
      const updates = profiles
        .filter(profile => profile.receive_check_notifications !== false) // opt-in only
        .map(profile => {
          const updatedNotifications = [...(profile.notifications || []), notification];
          return supabase
            .from("profiles")
            .update({ notifications: updatedNotifications })
            .eq("id", profile.id);
        });

      await Promise.all(updates);
    } catch (err) {
      console.error("Error in notifyGroupUsersAboutCheckStatus:", err);
    }
  }

  // Simple unique ID generator
  function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
  }

  const getHeaderTitle = (route) => {
    const routeName = getFocusedRouteNameFromRoute(route) ?? route.name;

    if (routeName === 'MainTabs') {
        return 'Home';
    }
    if (routeName === 'ContactScreen') {
        return 'Contact';
    }
    if (routeName === 'CheckedIn') {
        return 'Checked In';
    }
    return routeName;
  };


  if (!groupId) {
    return (
      <Drawer.Navigator
        screenOptions={({ navigation, route }) => ({
          ...screenOptionsWithDrawerButton({ navigation, route }),
          drawerActiveTintColor: "#22d3ee",
          drawerInactiveTintColor: "#fff",
          drawerStyle: { backgroundColor: "#1f2937" },
          drawerLabelStyle: { fontWeight: "600" },
        })}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
      >
        <Drawer.Screen
          name="NoGroupScreen"
          component={NoGroupScreen}
          options={{
            title: "NoGroupScreen",
            drawerIcon: ({ color, size }) => (
              <FontAwesome5 name="exclamation-circle" size={size} color={color} />
            ),
          }}
        />
      </Drawer.Navigator>
    );
  }

  return (
    <Drawer.Navigator
      screenOptions={({ navigation, route }) => ({
        ...screenOptionsWithDrawerButton({ navigation, route }),
        drawerActiveTintColor: "#22d3ee",
        drawerInactiveTintColor: "#fff",
        drawerStyle: { backgroundColor: "#1f2937" },
        drawerLabelStyle: {
          fontWeight: "600",
        },
        headerTitle: getHeaderTitle(route),
      })}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="MainTabs"
        component={BottomTabNavigator}
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
        name="CheckedIn"
        component={CheckedInScreen}
        initialParams={{ groupId }}
        options={{
          drawerLabel: ({ focused }) => (
            <Text
              style={{
                color: focused ? "#22d3ee" : "#fff",
                fontWeight: "600",
              }}
            >
              {`Checked In (${checkedInCount})`}
            </Text>
          ),
          drawerIcon: ({ size, focused }) => (
            <FontAwesome5
              name="check-circle"
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
        name="ContactScreen"
        component={ContactScreen}
        initialParams={{ groupId }}
        options={{
          title: "Contact",
          drawerIcon: ({ color, size, focused }) => (
            <FontAwesome5
              name="envelope"
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
    borderColor: "#22d3ee",
    borderWidth: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 55,
    paddingRight: 15,
  },
  modalContent: {
    width: 300,
    backgroundColor: "#374151",
    borderRadius: 8,
    padding: 10,
    maxHeight: 350,
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
    maxHeight: 300,
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
    color: "#90caf9",
    marginBottom: 2,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  notificationText: {
    color: "#f9fafb",
  },
  notificationList: {
    maxHeight: 220,
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
  
  tabBarContainer: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#1f2937',
    borderTopWidth: 1,
    borderTopColor: '#4b5563',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#374151',
    borderRadius: 10,
  },
});

export default MainAppScreen;
