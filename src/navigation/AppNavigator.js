// AppNavigator.js
import React from 'react';
import { View } from 'react-native';
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
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import GroupAccessScreen from '../screens/GroupAccessScreen';
import PendingApprovalScreen from '../screens/PendingApprovalScreen';
import GroupRequestsScreen from '../screens/GroupRequestsScreen';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

const ICON_CONTAINER_WIDTH = 30;

function MainDrawerNavigator({ isGroupCreator = false, route, navigation }) {
  // Get groupId param passed from the Stack navigator
  const groupId = route?.params?.groupId;

  return (
    <Drawer.Navigator initialRouteName="HomeTabs">
      <Drawer.Screen
        name="HomeTabs"
        // Forward groupId to TabNavigator
        children={(props) => <TabNavigator {...props} groupId={groupId} />}
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
      {isGroupCreator && (
        <Drawer.Screen
          name="Group Requests"
          component={GroupRequestsScreen}
          options={{
            drawerIcon: ({ color, size }) => (
              <View style={{ width: ICON_CONTAINER_WIDTH, alignItems: 'center' }}>
                <FontAwesome name="users" size={size} color={color} />
              </View>
            ),
          }}
        />
      )}
    </Drawer.Navigator>
  );
}

export default function AppNavigator({ session, profile }) {
  const isGroupCreator = profile?.is_group_creator || false;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!session ? (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      ) : !profile?.group_id ? (
        <>
          <Stack.Screen name="GroupAccessScreen" component={GroupAccessScreen} />
          <Stack.Screen name="GroupSetup" component={GroupSetupScreen} />
          <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
          <Stack.Screen name="JoinGroup" component={JoinGroupScreen} />
        </>
      ) : profile?.group_approval_status === 'pending' ? (
        <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
      ) : (
        <Stack.Screen name="MainApp">
          {(props) => <MainDrawerNavigator {...props} isGroupCreator={isGroupCreator} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}
