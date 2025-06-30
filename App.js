import 'react-native-gesture-handler';
import { useEffect } from 'react';
import * as NavigationBar from 'expo-navigation-bar';
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import SignInScreen from './src/screens/SignInScreen'
import SignUpScreen from './src/screens/SignUpScreen'
import GroupAccessScreen from './src/screens/GroupAccessScreen'
import JoinGroupScreen from './src/screens/JoinGroupScreen'
import CreateGroupScreen from './src/screens/CreateGroupScreen'
import { NavigationContainer } from '@react-navigation/native'
import MainAppScreen from './src/screens/MainAppScreen'
import WelcomeScreen from './src/screens/WelcomeScreen'
import AddEventScreen from './src/screens/AddEventScreen'
import AddNewsScreen from './src/screens/AddNewsScreen'
import NewsScreen from './src/screens/NewsScreen'
import NotificationScreen from './src/screens/NotificationScreen'
import WaitingStatusScreen from './src/screens/WaitingStatusScreen'
import NoGroupScreen from './src/screens/NoGroupScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import ChangePasswordScreen from './src/screens/ChangePasswordScreen'
import GroupDataScreen from './src/screens/GroupDataScreen'
import AddReportScreen from './src/screens/AddReportScreen'
import SessionLoaderScreen from './src/screens/SessionLoaderScreen';
import ManageMembersScreen from './src/screens/ManageMembersScreen'
import NotificationSetting from './src/screens/NotificationSetting';

const Stack = createNativeStackNavigator()

export default function App() {
  useEffect(() => {
    NavigationBar.setVisibilityAsync("hidden");
    NavigationBar.setBehaviorAsync("inset-swipe");
  }, []);
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="SessionLoader"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#374151',
            borderBottomWidth: 1,
            borderBottomColor: '#4b5563',
            shadowColor: 'white',
            shadowOpacity: 1,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            elevation: 5,
          },
          headerTintColor: '#f9fafb',
          headerTitleStyle: {
            fontWeight: '700',
          },
        }}
      >
        {/* Session check screen */}
        <Stack.Screen
          name="SessionLoader"
          component={SessionLoaderScreen}
          options={{ headerShown: false }}
        />
        {/* Welcome screen */}
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NoGroupScreen"
          component={NoGroupScreen}
          options={{ headerShown: false }}
        />
        {/* Auth screens */}
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />

        {/* Group access flow */}
        <Stack.Screen
          name="MainApp"
          component={MainAppScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GroupAccess"
          component={GroupAccessScreen}
          options={{ title: 'Get Started' }}
        />
        <Stack.Screen
          name="JoinGroup"
          component={JoinGroupScreen}
          options={{ title: 'Join a Group' }}
        />
        <Stack.Screen
          name="CreateGroup"
          component={CreateGroupScreen}
          options={{ title: 'Create a Group' }}
        />
        <Stack.Screen
          name="AddEventScreen"
          component={AddEventScreen}
          options={{ title: "Add Event" }}
        />
        <Stack.Screen
          name="AddNewsScreen"
          component={AddNewsScreen}
          options={{ title: "Add News" }}
        />
        <Stack.Screen
          name="AddReportScreen"
          component={AddReportScreen}
          options={{ title: "Add Report" }}
        />
        <Stack.Screen
          name="NewsScreen"
          component={NewsScreen}
          options={{ title: "News" }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationScreen}
          options={{ title: "Notifications" }}
        />
        <Stack.Screen
          name="WaitingStatusScreen"
          component={WaitingStatusScreen}
          options={{ title: "Pending Requests" }}
        />
        <Stack.Screen
          name="ProfileScreen"
          component={ProfileScreen}
          options={{ title: "Profile" }}
        />
        <Stack.Screen
          name="ChangePasswordScreen"
          component={ChangePasswordScreen}
          options={{ title: "Change Password" }}
        />
        <Stack.Screen
          name="GroupDataScreen"
          component={GroupDataScreen}
          options={{ title: "Group Data" }}
        />
        <Stack.Screen
          name="NotificationSetting"
          component={NotificationSetting}
          options={{ title: "Notification Setting" }}
        />
        <Stack.Screen
          name="ManageMembersScreen"
          component={ManageMembersScreen}
          options={{ title: "Manage Members" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
