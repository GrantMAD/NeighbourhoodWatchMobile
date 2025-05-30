import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, Image, ScrollView, StyleSheet, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useGroup } from '../context/GroupContext';
import { supabase } from '../../lib/supabase';

const GroupSetupScreen = ({ navigation, route }) => {
  const { setGroupData } = useGroup();
  const { groupId } = route.params;

  // Your existing states for group data inputs...
  const [welcomeText, setWelcomeText] = useState('');
  const [mainImage, setMainImage] = useState(null);
  const [vision, setVision] = useState('');
  const [mission, setMission] = useState('');
  const [values, setValues] = useState('');
  const [objectives, setObjectives] = useState('');
  const [executivesTitle, setExecutivesTitle] = useState('');
  const [executives, setExecutives] = useState([]);
  const [execName, setExecName] = useState('');
  const [execRole, setExecRole] = useState('');
  const [execImage, setExecImage] = useState(null);
  const [contactEmail, setContactEmail] = useState('');

  const pickImage = async (setImage) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const addExecutive = () => {
    if (!execName || !execRole) {
      alert('Please enter name and role');
      return;
    }
    setExecutives([...executives, { name: execName, role: execRole, image: execImage }]);
    setExecName('');
    setExecRole('');
    setExecImage(null);
  };

  const handleSubmit = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      Alert.alert('Error', 'User not logged in.');
      return;
    }

    const groupUpdate = {
      welcome_text: welcomeText,
      main_image: mainImage,
      vision,
      mission,
      values,
      objectives,
      executives_title: executivesTitle,
      executives: JSON.stringify(executives),
      contact_email: contactEmail,
      created_by: user.id,
    };

    const { error } = await supabase
      .from('groups')
      .update(groupUpdate)
      .eq('id', groupId);

    if (error) {
      Alert.alert('Error saving group setup', error.message);
      return;
    }

    setGroupData({
      welcomeText,
      mainImage,
      vision,
      mission,
      values,
      objectives,
      executivesTitle,
      executives: JSON.stringify(executives),
      contactEmail,
      createdBy: user.id,
    });

    // Reset navigation stack and go to MainApp passing groupId
    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: 'MainApp', params: { groupId } }],
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Your inputs as before */}
      <Text style={styles.label}>Welcome Message</Text>
      <TextInput value={welcomeText} onChangeText={setWelcomeText} style={styles.input} multiline />

      <Button title="Select Main Image" onPress={() => pickImage(setMainImage)} />
      {mainImage && <Image source={{ uri: mainImage }} style={styles.image} />}

      <Text style={styles.sectionTitle}>About Screen Content</Text>
      <Text style={styles.label}>Our Vision</Text>
      <TextInput value={vision} onChangeText={setVision} style={styles.input} multiline />
      <Text style={styles.label}>Our Mission</Text>
      <TextInput value={mission} onChangeText={setMission} style={styles.input} multiline />
      <Text style={styles.label}>Our Values</Text>
      <TextInput value={values} onChangeText={setValues} style={styles.input} multiline />
      <Text style={styles.label}>Objectives</Text>
      <TextInput value={objectives} onChangeText={setObjectives} style={styles.input} multiline />

      <Text style={styles.label}>Executives Section Title</Text>
      <TextInput value={executivesTitle} onChangeText={setExecutivesTitle} style={styles.input} />

      <Text style={styles.label}>Add Executive</Text>
      <TextInput placeholder="Name" value={execName} onChangeText={setExecName} style={styles.input} />
      <TextInput placeholder="Role" value={execRole} onChangeText={setExecRole} style={styles.input} />
      <Button title="Select Executive Image" onPress={() => pickImage(setExecImage)} />
      {execImage && <Image source={{ uri: execImage }} style={styles.execImage} />}
      <Button title="Add Executive" onPress={addExecutive} />

      {executives.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 10 }}>Current Executives</Text>
          {executives.map((exec, index) => (
            <View key={index} style={{ marginBottom: 15, flexDirection: 'row', alignItems: 'center' }}>
              {exec.image && (
                <Image source={{ uri: exec.image }} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }} />
              )}
              <View>
                <Text style={{ fontWeight: '600' }}>{exec.name}</Text>
                <Text>{exec.role}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.label}>Contact Email</Text>
      <TextInput value={contactEmail} onChangeText={setContactEmail} style={styles.input} />

      <View style={{ marginVertical: 30 }}>
        <Button title="Save & Continue" onPress={handleSubmit} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 50 },
  label: { fontSize: 16, marginBottom: 6, fontWeight: '600', color: '#333' },
  sectionTitle: { fontSize: 22, fontWeight: '700', marginTop: 30, marginBottom: 12, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, backgroundColor: '#fff' },
  image: { width: '100%', height: 200, marginVertical: 10 },
  execImage: { width: 100, height: 100, borderRadius: 50, marginVertical: 10 },
});

export default GroupSetupScreen;
