import React from "react";
import { Alert, View, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
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
import { supabase } from "../../lib/supabase";
import SettingsScreen from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function BottomTabs({ groupId }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "Members") {
            iconName = "users";
          }

          return <FontAwesome5 name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#4338ca",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} initialParams={{ groupId }} />
      <Tab.Screen name="Members" component={MembersScreen} initialParams={{ groupId }} />
    </Tab.Navigator>
  );
}

function CustomDrawerContent(props) {
  const { navigation } = props;

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    navigation.replace("SignIn"); // Adjust this screen name as needed
  };

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Sign Out"
        icon={({ color, size }) => (
          <FontAwesome5 name="sign-out-alt" size={size} color={color} />
        )}
        onPress={() =>
          Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Yes", onPress: handleSignOut },
            ],
            { cancelable: true }
          )
        }
      />
    </DrawerContentScrollView>
  );
}

const MainAppScreen = ({ route, navigation }) => {
  const { groupId } = route.params;

  return (
    <Drawer.Navigator
      screenOptions={{ headerShown: true }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="HomeTabs"
        options={{
          title: "Home",
          drawerIcon: ({ color, size }) => (
            <FontAwesome5 name="home" size={size} color={color} />
          ),
        }}
      >
        {(props) => <BottomTabs {...props} groupId={groupId} />}
      </Drawer.Screen>

      <Drawer.Screen
        name="About"
        component={AboutScreen}
        initialParams={{ groupId }}
        options={{
          drawerIcon: ({ color, size }) => (
            <FontAwesome5 name="info-circle" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        initialParams={{ groupId }}
        options={{
          drawerIcon: ({ color, size }) => (
            <FontAwesome5 name="cog" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

export default MainAppScreen;
