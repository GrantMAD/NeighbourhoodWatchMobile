import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React from 'react';
import { View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { GroupProvider } from './src/context/GroupContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GroupProvider>
        <AppNavigator />
      </GroupProvider>
    </GestureHandlerRootView>
  );
}
