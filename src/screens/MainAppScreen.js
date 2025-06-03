import React, { useEffect, useState, useRef } from "react";
import {
  Alert,
  TouchableOpacity,
  View,
  Text,
  Image,
  StyleSheet,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from "@react-navigation/drawer";
import { FontAwesome5 } from "@expo/vector-icons";
import { Animated } from "react-native";

import HomeScreen from "../screens/HomeScreen";
import AboutScreen from "../screens/AboutScreen";
import MembersScreen from "../screens/MembersScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { supabase } from "../../lib/supabase";

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Custom pulsing icon component
function PulsingIcon({ name, size, color, focused }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    } else {
      scaleAnim.setValue(1);
    }
  }, [focused, scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <FontAwesome5 name={name} size={size} color={color} />
    </Animated.View>
  );
}

function BottomTabs({ navigation, groupId }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        title: route.name,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName = route.name === "Home" ? "home" : "users";
          return (
            <PulsingIcon
              name={iconName}
              size={size}
              color={color}
              focused={focused}
            />
          );
        },
        tabBarActiveTintColor: "#475569", // Slate 600 (active icon)
        tabBarInactiveTintColor: "#1f2937", // Slate 800 (inactive icon)
        tabBarStyle: {
          backgroundColor: "#f9fafb",
          borderTopColor: "#e5e7eb",
        },
        headerStyle: {
          backgroundColor: "#1f2937", // Slate 800
          borderBottomWidth: 1,
          borderBottomColor: "#4b5563",
        },
        headerTintColor: "#f9fafb",
        headerTitleStyle: { fontWeight: "700" },
        headerTitleContainerStyle: {
          paddingLeft: 20,
        },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={{ marginLeft: 15 }}
          >
            <FontAwesome5 name="bars" size={24} color="#f9fafb" />
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} initialParams={{ groupId }} />
      <Tab.Screen
        name="Members"
        component={MembersScreen}
        initialParams={{ groupId }}
      />
    </Tab.Navigator>
  );
}

function CustomDrawerContent(props) {
  const { navigation } = props;
  const [userEmail, setUserEmail] = useState("Loading...");

  const placeholderImage = "https://www.gravatar.com/avatar/?d=mp&s=64";

  useEffect(() => {
    async function fetchEmail() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("Failed to get user:", userError?.message);
          setUserEmail("No user found");
          return;
        }

        const userId = user.id;
        const { data, error } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error fetching email from profiles:", error.message);
          setUserEmail("Email not found");
          return;
        }

        setUserEmail(data.email);
      } catch (err) {
        console.error("Unexpected error loading email:", err);
        setUserEmail("Error loading email");
      }
    }

    fetchEmail();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Sign Out Error", error.message);
      return;
    }
    navigation.replace("SignIn");
  };

  return (
    <DrawerContentScrollView {...props}>
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
          <FontAwesome5 name="sign-out-alt" size={size} color={color} />
        )}
        labelStyle={{ color: "#fff" }}
        style={{ backgroundColor: "transparent" }}
        activeTintColor="#22d3ee"
        inactiveTintColor="#fff"
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

const MainAppScreen = ({ route, navigation }) => {
  const { groupId } = route.params;

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: "#22d3ee",
        drawerInactiveTintColor: "#fff",
        drawerStyle: { backgroundColor: "#1f2937" },
        drawerLabelStyle: { fontWeight: "600" },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="HomeTabs"
        options={{
          title: "Home",
          drawerIcon: ({ color, size, focused }) => (
            <FontAwesome5 name="home" size={size} color={focused ? "#22d3ee" : "#fff"} />
          ),
        }}
      >
        {(props) => <BottomTabs {...props} groupId={groupId} />}
      </Drawer.Screen>

      <Drawer.Screen
        name="About"
        component={AboutScreen}
        initialParams={{ groupId }}
        options={({ navigation }) => ({
          drawerIcon: ({ color, size, focused }) => (
            <FontAwesome5
              name="info-circle"
              size={size}
              color={focused ? "#22d3ee" : "#fff"}
            />
          ),
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
              style={{ marginLeft: 15 }}
            >
              <FontAwesome5 name="bars" size={24} color="#f9fafb" />
            </TouchableOpacity>
          ),
        })}
      />

      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        initialParams={{ groupId }}
        options={{
          drawerIcon: ({ color, size, focused }) => (
            <FontAwesome5 name="cog" size={size} color={focused ? "#22d3ee" : "#fff"} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  profileContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#4b5563",
    marginBottom: 8,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: "#374151",
  },
  welcomeText: {
    color: "#f9fafb",
    fontWeight: "700",
    fontSize: 16,
  },
  emailText: {
    color: "#f9fafb",
    fontWeight: "600",
    fontSize: 14,
    flexShrink: 1,
  },
});

export default MainAppScreen;
