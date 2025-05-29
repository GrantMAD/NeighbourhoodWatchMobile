import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react'
import AppNavigator from './src/navigation/AppNavigator';
import { GroupProvider } from './src/context/GroupContext';
import { supabase } from './lib/supabase'
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      setSession(data.session)
    }

    getSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GroupProvider>
        {session ? <HomeScreen onLogout={() => setSession(null)} /> : <AppNavigator />}
      </GroupProvider>
    </GestureHandlerRootView>
  );
}
