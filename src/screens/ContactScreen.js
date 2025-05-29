import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView } from 'react-native';
import emailjs from '@emailjs/browser';
import { useGroup } from '../context/GroupContext';


const ContactScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const formRef = useRef();
  const { groupData } = useGroup();
  const contactEmail = groupData.contactEmail || 'Email not set';



  const sendEmail = () => {
    if (!name || !email || !message) {
      Alert.alert('All fields are required.');
      return;
    }

    const templateParams = {
      name,
      email,
      message,
    };

    emailjs
      .send('service_eclqt7c', 'Neighbourhood_rw0it3m', templateParams, 'soAbfXEvIO-hm50JH')
      .then((result) => {
        Alert.alert('Success!', 'We will be in contact shortly');
        setName('');
        setEmail('');
        setMessage('');
      })
      .catch((error) => {
        console.error(error.text);
        Alert.alert('Error', 'Failed to send message. Please try again later.');
      });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Contact Us</Text>
      <Text style={styles.instructions}>
        Email us at{' '}
        <Text style={styles.emailLink} onPress={() => Linking.openURL(`mailto:${contactEmail}`)}>
          {contactEmail}
        </Text>{' '}
        or send us a message below:
      </Text>

      <TextInput
        placeholder="Your name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Your email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Your message"
        style={[styles.input, styles.textArea]}
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={5}
      />

      <Button title="Send Message" onPress={sendEmail} color="#2563eb" />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f4f4f5',
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  instructions: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#555',
  },
  emailLink: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 20,
    fontSize: 16,
    paddingVertical: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});

export default ContactScreen;
