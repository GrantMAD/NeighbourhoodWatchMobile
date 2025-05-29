import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import IncidentsScreen from '../screens/IncidentsScreen';
import MembersScreen from '../screens/MembersScreen';
import EventsScreen from '../screens/EventScreen';

const Tab = createBottomTabNavigator();

function HamburgerMenuButton() {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      style={{ marginLeft: 15 }}
      onPress={() => navigation.getParent()?.openDrawer()}
    >
      <FontAwesome name="bars" size={24} color="#2f95dc" />
    </TouchableOpacity>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Incidents') iconName = 'exclamation-triangle';
          else if (route.name === 'Members') iconName = 'users';
          else if (route.name === 'Events') iconName = 'calendar'; // ✅ Events icon
          return <FontAwesome name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2f95dc',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerLeft: () => <HamburgerMenuButton /> }}
      />
      <Tab.Screen
        name="Incidents"
        component={IncidentsScreen}
        options={{ headerLeft: () => <HamburgerMenuButton /> }}
      />
      <Tab.Screen
        name="Members"
        component={MembersScreen}
        options={{ headerLeft: () => <HamburgerMenuButton /> }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{ headerLeft: () => <HamburgerMenuButton /> }}
      />
    </Tab.Navigator>
  );
}
