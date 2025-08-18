// src/screens/SessionLoaderScreen.js
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Alert, Linking } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SessionLoaderScreen({ navigation }) {
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('group_id, role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role === 'super_admin') {
          navigation.replace('SuperAdminDashboard');
        } else if (profile?.group_id) {
          navigation.replace('MainApp', { groupId: profile.group_id });
        } else {
          navigation.replace('NoGroupScreen');
        }
      } else {
        navigation.replace('Welcome');
      }
    };

    checkSession();

    const handleDeepLink = async (event) => {
      const { url } = event;
      if (url) {
        const params = new URL(url).searchParams;
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            Alert.alert('Error', 'Failed to set session from deep link');
            return;
          }

          const userId = data.user?.id;
          if (userId) {
            await supabase
              .from('profiles')
              .update({ is_verified: true })
              .eq('id', userId);
          }

          Alert.alert('Success', 'Email verified successfully!');
          navigation.replace('GroupAccess');
        }
      }
    };

    Linking.addEventListener('url', handleDeepLink);

    return () => {
      // Linking.removeEventListener('url', handleDeepLink);
    };
  }, [navigation]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1f2937' }}>
      <ActivityIndicator size="large" color="#22d3ee" />
    </View>
  );
}
