// src/screens/GroupRequestsScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';

const GroupRequestsScreen = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('group_id')
      .eq('id', session.user.id)
      .single();

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('group_id', profile.group_id)
      .eq('group_approval_status', 'pending');

    if (!error) setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (userId, status) => {
    await supabase
      .from('profiles')
      .update({ group_approval_status: status })
      .eq('id', userId);

    fetchRequests(); // Refresh list
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Join Requests</Text>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.full_name}</Text>
            <Text>{item.email}</Text>
            <View style={styles.buttonRow}>
              <Button title="Approve" onPress={() => updateStatus(item.id, 'approved')} />
              <Button title="Reject" color="red" onPress={() => updateStatus(item.id, 'rejected')} />
            </View>
          </View>
        )}
        ListEmptyComponent={<Text>No requests at this time.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  card: { padding: 15, backgroundColor: '#f0f0f0', marginVertical: 8, borderRadius: 8 },
  name: { fontSize: 18, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
});

export default GroupRequestsScreen;
