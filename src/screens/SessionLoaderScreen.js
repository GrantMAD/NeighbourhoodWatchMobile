// src/screens/SessionLoaderScreen.js
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
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
  }, [navigation]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1f2937' }}>
      <ActivityIndicator size="large" color="#22d3ee" />
    </View>
  );
}
