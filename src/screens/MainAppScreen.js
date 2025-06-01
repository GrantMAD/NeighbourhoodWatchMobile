import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import AboutScreen from '../screens/AboutScreen';
import MembersScreen from '../screens/MembersScreen';

const Tab = createBottomTabNavigator();

const MainAppScreen = ({ route }) => {
  const { groupId } = route.params;

  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Home" component={HomeScreen} initialParams={{ groupId }} />
      <Tab.Screen name="About" component={AboutScreen} initialParams={{ groupId }} />
      <Tab.Screen name="Members" component={MembersScreen} initialParams={{ groupId }} />
    </Tab.Navigator>
  );
};

export default MainAppScreen;
