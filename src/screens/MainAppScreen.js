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
  ActivityIndicator,
  Platform,
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
import Toast from "../components/Toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const LOCATION_TRACKING_TASK = 'location-tracking-task';

TaskManager.defineTask(LOCATION_TRACKING_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Location tracking task error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const { latitude, longitude } = locations[0].coords;
    const timestamp = new Date(locations[0].timestamp).toISOString();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: rpcError } = await supabase.rpc('update_current_location', {
          user_id_param: user.id,
          latitude_param: latitude,
          longitude_param: longitude,
          timestamp_param: timestamp,
        });

        if (rpcError) {
          console.error('Error updating current location in background task:', rpcError);
        }
      }
    } catch (e) {
      console.error('Error in location task Supabase operation:', e);
    }
  }
});

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

const NotificationDropdown = ({ notifications, onClose, onNavigate, visible, onAttend, processingStatus, attendedEvents, onViewAllNotifications }) => {
  const renderNotificationItem = ({ item }) => {
    let headingText = 'Notification';
    if (item.type === 'join_request') {
      headingText = 'Group Join Request';
    } else if (item.type === 'neighbourhood_watch_request') {
      headingText = 'Neighbourhood Watch Request';
    } else if (item.type === 'accepted_request') {
      headingText = 'Request Accepted';
    } else if (item.type === 'declined_request') {
      headingText = 'Request Declined';
    } else if (item.type === 'check_status') {
      headingText = 'Status Update';
    } else if (item.type === 'new_event') {
      headingText = 'New Event';
    } else if (item.type === 'new_news') {
      headingText = 'New News';
    } else if (item.type === 'new_report') {
      headingText = 'New Report';
    }

    const getBorderColor = (type) => {
      switch (type) {
        case 'join_request': return '#facc15';        // yellow
        case 'neighbourhood_watch_request': return '#60a5fa'; // blue
        case 'accepted_request': return '#4ade80';     // green
        case 'declined_request': return '#f87171';     // red
        case 'check_status': return '#a78bfa';         // purple
        case 'new_event': return '#f97316';          // orange
        case 'new_news': return '#8b5cf6';           // violet
        case 'new_report': return '#ec4899';         // pink
        default: return '#22d3ee';                     // default cyan
      }
    };

    const isProcessing = processingStatus[item.id];
    const isAttending = item.type === 'new_event' && attendedEvents.includes(item.eventId);

    return (
      <TouchableOpacity onPress={() => { onClose(); onNavigate(item); }}>
        <View style={[
          styles.notificationCard,
          !item.read ? styles.unread : styles.read,
          { borderLeftColor: getBorderColor(item.type) }
        ]}>
          <View style={styles.cardTopRow}>
            <View style={styles.avatarContainer}>
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
              ) : (
                <FontAwesome5 name="user-circle" size={30} color="#90caf9" solid />
              )}
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.headingText}>{headingText}</Text>
              <Text style={styles.messageText} numberOfLines={2}>{item.message}</Text>
            </View>
          </View>
          {(item.timestamp || item.createdAt) && (
            <View style={styles.timeInfoContainer}>
              <Text style={styles.timeText}>
                {new Date(item.timestamp || item.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </Text>
            </View>
          )}
          {item.type === 'new_event' && (
            <View style={styles.actionRow}>
              {isAttending ? (
                <Text style={styles.attendingText}>Attending Event</Text>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.attendButton, isProcessing && styles.disabledButton]}
                  onPress={() => onAttend(item)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Attend</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 10 }}>
                <Text style={styles.dropdownTitle}>Notifications</Text>
                {notifications.length > 0 && (
                  <View
                    style={{
                      backgroundColor: '#f87171',
                      borderRadius: 10,
                      paddingHorizontal: 6,
                      minWidth: 20,
                      height: 20,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 12 }}>
                      {notifications.filter(n => !n.read).length}
                    </Text>
                  </View>
                )}
              </View>

              {notifications.length === 0 ? (
                <Text style={styles.noNotificationsText}>You're all caught up!</Text>
              ) : (
                <FlatList
                  data={notifications.sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp))}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderNotificationItem}
                  style={{ maxHeight: 320 }}
                />
              )}

              <TouchableOpacity style={styles.viewAllButton} onPress={onViewAllNotifications}>
                <Text style={styles.viewAllText}>View All Notifications</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

function BottomTabNavigator({ route }) {
  const { groupId, toastMessage, toastType } = route.params;
  return (
    <Tab.Navigator
      tabBar={(props) => <SlidingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} initialParams={{ groupId, toastMessage, toastType }} />
      <Tab.Screen name="Members" component={MembersScreen} initialParams={{ groupId }} />
      <Tab.Screen name="Events" component={EventsScreen} initialParams={{ groupId }} />
      <Tab.Screen name="News" component={NewsScreen} initialParams={{ groupId }} />
      <Tab.Screen name="Incidents" component={IncidentsScreen} initialParams={{ groupId }} />
    </Tab.Navigator>
  );
}

const SlidingTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const tabWidth = Dimensions.get('window').width / state.routes.length;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const margin = 5;
  const highlightWidth = tabWidth - (margin * 2);

  useEffect(() => {
    const newX = state.index * tabWidth + margin;
    Animated.spring(slideAnim, {
      toValue: newX,
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
    <View style={{ backgroundColor: '#1f2937' }}>
      <View style={styles.tabBarContainer}>
        <Animated.View
          style={[
            styles.activeTab,
            {
              width: highlightWidth,
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
      <View style={{ height: insets.bottom }} />
    </View>
  );
};

const MainAppScreen = ({ route, navigation }) => {
  const { groupId, toastMessage, toastType } = route.params;
  const [notifications, setNotifications] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [processingStatus, setProcessingStatus] = useState({});
  const [attendedEvents, setAttendedEvents] = useState([]);

  useEffect(() => {
    if (toastMessage) {
      setToast({ visible: true, message: toastMessage, type: toastType || "success" });
      // Clear the params after showing the toast
      navigation.setParams({ toastMessage: null, toastType: null });
    }
  }, [toastMessage, toastType]);

  useEffect(() => {
    // We will call registerForPushNotificationsAsync from a place where we are sure the user is logged in.
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      // Handle received notification
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const { notification } = response;
      // Handle notification tap
      if (notification.request.content.data.notification) {
        navigation.navigate("Notifications", { notification: notification.request.content.data.notification });
      }
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  async function registerForPushNotificationsAsync(userId) {
    console.log(`Register function started. Received userId: ${userId}`);
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Failed to get push token for push notification!');
        return;
      }
      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Expo Push Token:', token);
      } catch (e) {
        console.error('Failed to get Expo push token:', e);
        return;
      }
    } else {
      console.log('Not a device, skipping push token registration.');
      return;
    }

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      } catch (e) {
        console.error('Failed to set notification channel:', e);
      }
    }

    console.log(`Values before save check: token is typeof ${typeof token} with value ${token}, userId is typeof ${typeof userId} with value ${userId}`);
    if (token && userId) {
      console.log('Saving push token to Supabase for user:', userId);
      const { error } = await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
      if (error) {
        console.error('Error saving push token to Supabase:', error);
      } else {
        console.log('Push token saved successfully!');
      }
    } else {
      console.log('Condition to save token failed. Token or userId is missing.');
    }
  }

  const fetchCheckedInCount = useCallback(async () => {
    const { count, error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("checked_in", true);

    if (!error) {
      setCheckedInCount(count ?? 0);
    } else {
      console.error("Error fetching checked-in count:", error);
    }
  }, []);

  const refreshNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("notifications, attended_events")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }

    const notifs = data.notifications ?? [];
    setNotifications(notifs);
    setHasNotifications(notifs.some((n) => !n.read));
    setAttendedEvents(data.attended_events ?? []);
  };

  useEffect(() => {
    (async () => {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        Alert.alert('Permission to access background location was denied');
        return;
      }
    })();

    if (hasNotifications) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [hasNotifications]);

  const handleAttendEvent = async (notification) => {
    const { eventId, groupId } = notification;
    if (!eventId || !groupId) {
      Alert.alert('Error', 'Event or group ID is missing.');
      return;
    }

    setProcessingStatus(prev => ({ ...prev, [notification.id]: true }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data: group, error: fetchError } = await supabase
        .from('groups')
        .select('events')
        .eq('id', groupId)
        .single();

      if (fetchError) throw fetchError;

      const event = group.events.find(e => e.id === eventId);
      if (!event) {
        Alert.alert('Error', 'Event not found.');
        return;
      }

      if (event.attendees && event.attendees.includes(user.id)) {
        setToast({ visible: true, message: 'You are already attending this event.', type: 'info' });
        return;
      }

      const updatedEvent = {
        ...event,
        attendees: [...(event.attendees || []), user.id],
        attending_count: (event.attending_count || 0) + 1,
      };

      const updatedEvents = group.events.map(e => e.id === eventId ? updatedEvent : e);

      const { error: updateError } = await supabase
        .from('groups')
        .update({ events: updatedEvents })
        .eq('id', groupId);

      if (updateError) throw updateError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('attended_events')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const updatedAttendedEvents = [...(profile.attended_events || []), eventId];

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ attended_events: updatedAttendedEvents })
        .eq('id', user.id);

      if (profileUpdateError) throw profileUpdateError;

      setAttendedEvents(updatedAttendedEvents);
      setToast({ visible: true, message: 'You are now attending the event!', type: 'success' });

    } catch (error) {
      console.error('Error attending event:', error.message);
      Alert.alert('Error', `Failed to attend event: ${error.message}`);
    } finally {
      setProcessingStatus(prev => ({ ...prev, [notification.id]: false }));
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log("MainAppScreen useFocusEffect fired");
      let subscription = null;

      async function setupUser() {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.log("User not logged in, skipping setup.");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("notifications, checked_in, attended_events, push_token")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          return;
        }

        // If there's no push token in the profile, get one and save it.
        console.log("User ID:", user.id);
        console.log("Profile push_token:", profile.push_token);

        if (!profile.push_token) {
          console.log('Push token not found in profile, attempting to register.');
          await registerForPushNotificationsAsync(user.id);
        } else {
          console.log('Push token already exists, skipping registration.');
        }

        const notifs = profile.notifications ?? [];
        setNotifications(notifs);
        setHasNotifications(notifs.some((n) => !n.read));
        setCheckedIn(profile.checked_in ?? false);
        setAttendedEvents(profile.attended_events ?? []);

        subscription = supabase
          .channel("notifications-channel")
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "profiles",
              filter: `id=eq.${user.id}`,
            },
            (payload) => {
              const updatedNotifs = payload.new.notifications ?? [];
              setNotifications(updatedNotifs);
              setHasNotifications(updatedNotifs.some((n) => !n.read));
              setCheckedIn(payload.new.checked_in ?? false);
              setAttendedEvents(payload.new.attended_events ?? []);
            }
          )
          .subscribe();
      }

      setupUser();

      return () => {
        if (subscription) {
          supabase.removeChannel(subscription);
        }
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      fetchCheckedInCount();
    }, [fetchCheckedInCount])
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
        onPress={() => {
          navigation.openDrawer();
          fetchCheckedInCount();
        }}
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
            if (isCheckingIn) return; // Prevent multiple presses
            setIsCheckingIn(true);

            try {
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

              // Ensure a row exists for the user in user_locations before calling RPCs.
              const { error: upsertError } = await supabase
                .from('user_locations')
                .upsert({ user_id: user.id }, { onConflict: 'user_id' });

              if (upsertError) {
                console.error('Error upserting user location row:', upsertError);
                Alert.alert("Error", "Could not prepare user for location tracking.");
                setIsCheckingIn(false);
                return;
              }

              // --- Location Tracking Logic ---
              if (newCheckedIn) {
                // User is checking in, start tracking
                const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING_TASK);
                if (!hasStarted) {
                  await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK, {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 60000,
                    distanceInterval: 10,
                    deferredUpdatesInterval: 5000,
                    foregroundService: {
                      notificationTitle: 'Tracking your location',
                      notificationBody: 'To ensure community safety',
                      notificationColor: '#22d3ee',
                    },
                  });
                  console.log('Location tracking started.');
                }

                // Get the current location and call the check_in_location RPC
                const location = await Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.High,
                });
                if (location) {
                  const { latitude, longitude } = location.coords;
                  const timestamp = new Date().toISOString();
                  await supabase.rpc('check_in_location', {
                    user_id_param: user.id,
                    latitude_param: latitude,
                    longitude_param: longitude,
                    timestamp_param: timestamp,
                  });

                  // Schedule a 4-hour check-out reminder
                  const notificationId = await Notifications.scheduleNotificationAsync({
                    content: {
                      title: "Still on duty?",
                      body: "You have been checked in for 4 hours. Tap here to check out if you are finished.",
                      data: { screen: 'CheckedIn' }, // To navigate to the right screen on tap
                    },
                    trigger: { date: new Date(Date.now() + 20 * 1000) }, // 20 seconds for testing
                  });

                  // Save the notification ID to the user's profile
                  await supabase
                    .from('profiles')
                    .update({ check_in_notification_id: notificationId })
                    .eq('id', user.id);
                }
              } else {
                // User is checking out, stop tracking
                const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TRACKING_TASK);
                if (hasStarted) {
                  await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
                  console.log('Location tracking stopped.');
                }

                // Get the current location and call the check_out_location RPC
                const location = await Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.High,
                });
                if (location) {
                  const { latitude, longitude } = location.coords;
                  const timestamp = new Date().toISOString();
                  await supabase.rpc('check_out_location', {
                    user_id_param: user.id,
                    latitude_param: latitude,
                    longitude_param: longitude,
                    timestamp_param: timestamp,
                  });
                }
              }

              // --- NEW: Notify group users ---
              if (data.group_id) {
                notifyGroupUsersAboutCheckStatus(user.id, data.group_id, newCheckedIn ? "checked in" : "checked out");
              }
              setToast({ visible: true, message: `Successfully ${newCheckedIn ? 'checked in' : 'checked out'}!` });
            } finally {
              setIsCheckingIn(false);
            }
          }}
          style={{
            marginRight: 20,
            backgroundColor: checkedIn ? "#ef4444" : "#22c55e",
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 6,
            marginLeft: 15,
            opacity: isCheckingIn ? 0.6 : 1,
          }}
          disabled={isCheckingIn}
        >
          {isCheckingIn ? (
            <ActivityIndicator color="#f9fafb" />
          ) : (
            <Text style={{ color: "#f9fafb", fontWeight: "bold" }}>
              {checkedIn ? "Check Out" : "Check In"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Notification Bell */}
        <TouchableOpacity onPress={async () => {
          await refreshNotifications();
          setDropdownVisible(!dropdownVisible);
        }}>
          <View>
            <FontAwesome5 name="bell" size={20} color="#f9fafb" />
            {hasNotifications && (
              <Animated.View
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: "#f87171",
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.4],
                    outputRange: [1, 0.6],
                  }),
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
            onNavigate={async (item) => {
              setDropdownVisible(false);

              // If it's a join request or neighbourhood_watch_request, navigate to NotificationsScreen without deleting
              if (item.type === 'join_request' || item.type === 'neighbourhood_watch_request') {
                navigation.navigate("Notifications", { notification: item });
                return; // Exit early to prevent deletion
              }

              // For other notification types, mark as read and then navigate
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const newNotifications = notifications.filter(n => n.id !== item.id);
                await supabase
                  .from('profiles')
                  .update({ notifications: newNotifications })
                  .eq('id', user.id);
                setNotifications(newNotifications);
                setHasNotifications(newNotifications.some(n => !n.read));
              }

              if (item.type === 'new_event') {
                navigation.navigate('MainTabs', {
                  screen: 'Events',
                  params: {
                    groupId: item.groupId,
                    selectedEvent: { id: item.eventId, ...item },
                  },
                });
              } else if (item.type === 'new_news') {
                navigation.navigate('MainTabs', {
                  screen: 'News',
                  params: {
                    groupId: item.groupId,
                    selectedStoryId: item.storyId,
                  },
                });
              } else {
                navigation.navigate("Notifications", { notification: item });
              }
            }}
            onAttend={handleAttendEvent}
            processingStatus={processingStatus}
            attendedEvents={attendedEvents}
            onViewAllNotifications={() => {
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
      // Step 1: Get name and avatar of the user who triggered the action
      const { data: senderProfile, error: senderError } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", userId)
        .single();

      if (senderError || !senderProfile) {
        console.error("Failed to fetch sender's profile", senderError);
        return;
      }

      const senderName = senderProfile.name || "A member";
      const senderAvatarUrl = senderProfile.avatar_url;

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
        avatar_url: senderAvatarUrl, // Include avatar_url in the notification
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
      <View style={{ flex: 1 }}>
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
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast({ ...toast, visible: false })}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
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
          initialParams={{ groupId, toastMessage, toastType }}
          options={({ route }) => ({
            title: "Home",
            drawerIcon: ({ color, size }) => {
              const routeName = getFocusedRouteNameFromRoute(route) ?? 'Home';
              const focused = routeName === 'Home';
              return (
                <FontAwesome5
                  name="home"
                  size={size}
                  color={focused ? "#22d3ee" : "#fff"}
                />
              );
            },
          })}
          listeners={({ navigation }) => ({
            drawerItemPress: (e) => {
              e.preventDefault();
              navigation.navigate('MainTabs', { screen: 'Home' });
            },
          })}
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
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60, // Adjust as needed
    paddingRight: 15,
  },
  modalContent: {
    width: 320,
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 12,
    maxHeight: 450,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
  dropdownTitle: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#f9fafb",
  },
  noNotificationsText: {
    color: "#d1d5db",
    fontStyle: "italic",
    textAlign: 'center',
    paddingVertical: 20,
  },
  notificationCard: {
    backgroundColor: '#3a3a3a',
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    borderLeftWidth: 4,
  },
  read: {
    opacity: 0.6,
  },
  unread: {
    opacity: 1.0,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  cardContent: {
    flex: 1,
  },
  headingText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#e3f2fd',
  },
  messageText: {
    fontSize: 13,
    color: '#b0bec5',
    marginTop: 2,
  },
  timeInfoContainer: {
    marginTop: 8,
    paddingTop: 6,
    borderTopColor: '#4a4a4a',
    borderTopWidth: 1,
    marginLeft: 42,
  },
  timeText: {
    fontSize: 12,
    color: '#90a4ae',
    fontStyle: 'italic',
  },
  viewAllButton: {
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: "#22d3ee",
    borderRadius: 8,
  },
  viewAllText: {
    textAlign: "center",
    fontWeight: "bold",
    color: "#1f2937",
    fontSize: 14,
  },

  tabBarContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#4b5563',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  activeTab: {
    position: 'absolute',
    top: 10,
    bottom: 10,
    backgroundColor: '#374151',
    borderRadius: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    borderTopColor: '#4a4a4a',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  attendButton: { backgroundColor: '#2196F3' },
  disabledButton: { opacity: 0.6 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  attendingText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 14, alignSelf: 'center' },
});

export default MainAppScreen;