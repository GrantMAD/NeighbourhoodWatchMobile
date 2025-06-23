import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase'; // Adjust the path if needed

const ContactScreen = ({ route }) => {
  const { groupId } = route.params;

  const [form, setForm] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [contactEmail, setContactEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroupContact = async () => {
      if (!groupId) {
        Alert.alert('Error', 'No group ID provided.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('groups')
        .select('contact_email')
        .eq('id', groupId)
        .single();

      if (error) {
        console.error('Failed to fetch group contact email:', error.message);
        Alert.alert('Error fetching contact info');
      } else {
        setContactEmail(data.contact_email);
      }

      setLoading(false);
    };

    fetchGroupContact();
  }, [groupId]);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.message) {
      Alert.alert('Please fill out all fields.');
      return;
    }

    if (!contactEmail) {
      Alert.alert('No contact email found for this group.');
      return;
    }

    // Placeholder for sending logic — replace with Supabase Function or EmailJS
    console.log('Send message to:', contactEmail);
    console.log('Message content:', form);

    Alert.alert('Message Sent', `Your message was sent to ${contactEmail}`);

    setForm({ name: '', email: '', message: '' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Contact Us</Text>
        <Text style={styles.subtitle}>We’ll email your message to the group contact.</Text>

        <TextInput
          style={styles.input}
          placeholder="Your Name"
          value={form.name}
          onChangeText={(text) => handleChange('name', text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Your Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email}
          onChangeText={(text) => handleChange('email', text)}
        />

        <TextInput
          style={[styles.input, { height: 120 }]}
          placeholder="Your Message"
          multiline
          value={form.message}
          onChangeText={(text) => handleChange('message', text)}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Send Message</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ContactScreen;

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
    color: '#111',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: '#555',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
