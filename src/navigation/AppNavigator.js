import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FontAwesome } from '@expo/vector-icons';

import TabNavigator from './TabNavigator';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ContactScreen from '../screens/ContactScreen';
import GalleryScreen from '../screens/GalleryScreen';
import GroupSetupScreen from '../screens/GroupSetupScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import JoinGroupScreen from '../screens/JoinGroupScreen';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

const ICON_CONTAINER_WIDTH = 30;

function MainDrawerNavigator() {
  return (
    <Drawer.Navigator initialRouteName="HomeTabs">
      <Drawer.Screen
        name="HomeTabs"
        component={TabNavigator}
        options={{
          headerShown: false,
          title: 'Home',
          drawerIcon: ({ color, size }) => (
            <View style={{ width: ICON_CONTAINER_WIDTH, alignItems: 'center' }}>
              <FontAwesome name="home" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <View style={{ width: ICON_CONTAINER_WIDTH, alignItems: 'center' }}>
              <FontAwesome name="user-circle" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="About"
        component={AboutScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <View style={{ width: ICON_CONTAINER_WIDTH, alignItems: 'center' }}>
              <FontAwesome name="info-circle" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="Gallery"
        component={GalleryScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <View style={{ width: ICON_CONTAINER_WIDTH, alignItems: 'center' }}>
              <FontAwesome name="image" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="Contact Us"
        component={ContactScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <View style={{ width: ICON_CONTAINER_WIDTH, alignItems: 'center' }}>
              <FontAwesome name="comments" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <View style={{ width: ICON_CONTAINER_WIDTH, alignItems: 'center' }}>
              <FontAwesome name="cog" size={size} color={color} />
            </View>
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
        <Stack.Screen name="JoinGroup" component={JoinGroupScreen} />
        <Stack.Screen name="MainApp" component={MainDrawerNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="GroupSetup" component={GroupSetupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
