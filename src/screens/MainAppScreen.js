import React, { useEffect, useState } from "react";
import {
  Alert,
  TouchableOpacity,
  View,
  Text,
  Image,
  StyleSheet,
} from "react-native";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from "@react-navigation/drawer";
import { FontAwesome5 } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import AboutScreen from "../screens/AboutScreen";
import MembersScreen from "../screens/MembersScreen";
import SettingsScreen from "../screens/SettingsScreen";
import EventsScreen from "../screens/EventsScreen";
import { supabase } from "../../lib/supabase";

const Drawer = createDrawerNavigator();

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

  // Helper to render header left (hamburger menu) for all screens
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
  });

  return (
    <Drawer.Navigator
      screenOptions={{
        drawerActiveTintColor: "#22d3ee",
        drawerInactiveTintColor: "#fff",
        drawerStyle: { backgroundColor: "#1f2937" },
        drawerLabelStyle: { fontWeight: "600" },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        initialParams={{ groupId }}
        options={({ navigation }) => ({
          title: "Home",
          drawerIcon: ({ color, size, focused }) => (
            <FontAwesome5
              name="home"
              size={size}
              color={focused ? "#22d3ee" : "#fff"}
            />
          ),
          ...screenOptionsWithDrawerButton({ navigation }),
        })}
      />

      <Drawer.Screen
        name="Members"
        component={MembersScreen}
        initialParams={{ groupId }}
        options={({ navigation }) => ({
          title: "Members",
          drawerIcon: ({ color, size, focused }) => (
            <FontAwesome5
              name="users"
              size={size}
              color={focused ? "#22d3ee" : "#fff"}
            />
          ),
          ...screenOptionsWithDrawerButton({ navigation }),
        })}
      />

      <Drawer.Screen
        name="Events"
        component={EventsScreen}
        initialParams={{ groupId }}
        options={({ navigation }) => ({
          title: "Events",
          drawerIcon: ({ color, size, focused }) => (
            <FontAwesome5
              name="calendar-alt"
              size={size}
              color={focused ? "#22d3ee" : "#fff"}
            />
          ),
          ...screenOptionsWithDrawerButton({ navigation }),
        })}
      />

      <Drawer.Screen
        name="About"
        component={AboutScreen}
        initialParams={{ groupId }}
        options={({ navigation }) => ({
          title: "About",
          drawerIcon: ({ color, size, focused }) => (
            <FontAwesome5
              name="info-circle"
              size={size}
              color={focused ? "#22d3ee" : "#fff"}
            />
          ),
          ...screenOptionsWithDrawerButton({ navigation }),
        })}
      />

      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        initialParams={{ groupId }}
        options={({ navigation }) => ({
          title: "Settings",
          drawerIcon: ({ color, size, focused }) => (
            <FontAwesome5
              name="cog"
              size={size}
              color={focused ? "#22d3ee" : "#fff"}
            />
          ),
          ...screenOptionsWithDrawerButton({ navigation }),
        })}
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
