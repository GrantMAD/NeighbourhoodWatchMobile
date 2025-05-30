// src/screens/PendingApprovalScreen.js
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function PendingApprovalScreen() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Your request to join the group is pending approval.</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { fontSize: 18, textAlign: 'center', marginBottom: 20 },
});
