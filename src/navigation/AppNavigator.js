import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import TabNavigator from './TabNavigator';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';

const Drawer = createDrawerNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Drawer.Navigator initialRouteName="HomeTabs">
                <Drawer.Screen
                    name="HomeTabs"
                    component={TabNavigator}
                    options={{
                        headerShown: false,
                        title: 'Home',
                        drawerIcon: ({ color, size }) => (
                            <FontAwesome name="home" size={size} color={color} />
                        ),
                    }}
                />
                <Drawer.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{
                        drawerIcon: ({ color, size }) => (
                            <FontAwesome name="cog" size={size} color={color} />
                        ),
                    }}
                />
                <Drawer.Screen
                    name="About"
                    component={AboutScreen}
                    options={{
                        drawerIcon: ({ color, size }) => (
                            <FontAwesome name="info-circle" size={size} color={color} />
                        ),
                    }}
                />
            </Drawer.Navigator>

        </NavigationContainer>
    );
}
