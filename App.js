import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { GroupProvider } from './src/context/GroupContext';
import { supabase } from './lib/supabase';
import { NavigationContainer } from '@react-navigation/native';

export default function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSessionAndUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      const currentSession = data.session;
      setSession(currentSession);

      if (currentSession?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single();
        setUserProfile(profile);
      }

      setLoading(false);
    };

    getSessionAndUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GroupProvider>
        <NavigationContainer>
          <AppNavigator session={session} profile={userProfile} />
        </NavigationContainer>
      </GroupProvider>
    </GestureHandlerRootView>
  );
}
