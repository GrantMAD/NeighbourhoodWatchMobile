import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, ScrollView, Image, Alert, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { supabase } from '../../lib/supabase';

const CreateGroupScreen = ({ navigation }) => {
  const [groupName, setGroupName] = useState('');
  const [welcomeText, setWelcomeText] = useState('');
  const [vision, setVision] = useState('');
  const [mission, setMission] = useState('');
  const [values, setValues] = useState('');
  const [objectives, setObjectives] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [mainImage, setMainImage] = useState(null);
  const [executivesTitle, setExecutivesTitle] = useState('');
  const [execName, setExecName] = useState('');
  const [execRole, setExecRole] = useState('');
  const [execImage, setExecImage] = useState(null);
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async (setter) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setter(result.assets[0].uri);
    }
  };

  const addExecutive = () => {
    if (!execName || !execRole) {
      Alert.alert('Error', 'Please enter name and role');
      return;
    }
    setExecutives([...executives, { name: execName, role: execRole, image: execImage }]);
    setExecName('');
    setExecRole('');
    setExecImage(null);
  };

  const uploadImage = async (uri, folder = 'group-assets') => {
    try {
      const fileExt = uri.split('.').pop().split('?')[0] || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;
      const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const buffer = Buffer.from(base64, 'base64');

      const { error } = await supabase.storage
        .from('group-assets')
        .upload(filePath, buffer, {
          contentType,
          upsert: false,
        });

      if (error) {
        throw error;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('group-assets').getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Image upload error:', error.message);
      Alert.alert('Upload Error', error.message);
      return null;
    }
  };

  const generateGroupPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleCreateGroup = async () => {
    if (!groupName) {
      Alert.alert('Error', 'Please enter a group name.');
      return;
    }

    setLoading(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        Alert.alert('Error', 'User not logged in or failed to fetch user.');
        setLoading(false);
        return;
      }

      const user = userData.user;

      let mainImageUrl = null;
      if (mainImage) {
        mainImageUrl = await uploadImage(mainImage);
        if (!mainImageUrl) {
          setLoading(false);
          return;
        }
      }

      const executivesWithUrls = await Promise.all(
        executives.map(async (exec) => {
          let imageUrl = null;
          if (exec.image) {
            imageUrl = await uploadImage(exec.image);
            if (!imageUrl) {
              setLoading(false);
              Alert.alert('Error', `Failed to upload image for executive ${exec.name}`);
              throw new Error('Exec image upload failed');
            }
          }
          return {
            ...exec,
            image: imageUrl,
          };
        })
      );

      const groupPassword = generateGroupPassword(); // ✅ generate password

      const groupPayload = {
        name: groupName,
        objectives,
        values,
        mission,
        vision,
        welcome_text: welcomeText,
        main_image: mainImageUrl,
        executives_title: executivesTitle,
        executives: JSON.stringify(executivesWithUrls),
        contact_email: contactEmail,
        created_by: user.id,
        users: [user.id],
        group_password: groupPassword, // ✅ add password to payload
      };

      const { data: insertData, error: insertError } = await supabase
        .from('groups')
        .insert([groupPayload])
        .select();

      if (insertError) {
        Alert.alert('Error', insertError.message);
        setLoading(false);
        return;
      }

      const newGroup = insertData?.[0];
      if (!newGroup) {
        Alert.alert('Error', 'Failed to create group.');
        setLoading(false);
        return;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          group_id: newGroup.id,
          is_group_creator: true,
        })
        .eq('id', user.id);

      if (profileError) {
        Alert.alert('Error updating profile:', profileError.message);
        setLoading(false);
        return;
      }

      Alert.alert(
        'Group Created',
        `Group password: ${groupPassword}\n\nPlease share this password with others so they can join.`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainApp', params: { groupId: newGroup.id } }],
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Something went wrong creating your group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Group Name</Text>
      <TextInput value={groupName} onChangeText={setGroupName} style={styles.input} />

      <Text style={styles.label}>Welcome Text</Text>
      <TextInput value={welcomeText} onChangeText={setWelcomeText} style={styles.input} multiline />

      <Button title="Select Main Image" onPress={() => pickImage(setMainImage)} />
      {mainImage && <Image source={{ uri: mainImage }} style={styles.image} />}

      <Text style={styles.label}>Vision</Text>
      <TextInput value={vision} onChangeText={setVision} style={styles.input} multiline />

      <Text style={styles.label}>Mission</Text>
      <TextInput value={mission} onChangeText={setMission} style={styles.input} multiline />

      <Text style={styles.label}>Values</Text>
      <TextInput value={values} onChangeText={setValues} style={styles.input} multiline />

      <Text style={styles.label}>Objectives</Text>
      <TextInput value={objectives} onChangeText={setObjectives} style={styles.input} multiline />

      <Text style={styles.label}>Contact Email</Text>
      <TextInput value={contactEmail} onChangeText={setContactEmail} style={styles.input} />

      <Text style={styles.label}>Executives Section Title</Text>
      <TextInput value={executivesTitle} onChangeText={setExecutivesTitle} style={styles.input} />

      <Text style={styles.label}>Executive Name</Text>
      <TextInput value={execName} onChangeText={setExecName} style={styles.input} />
      <Text style={styles.label}>Executive Role</Text>
      <TextInput value={execRole} onChangeText={setExecRole} style={styles.input} />
      <View style={{ marginBottom: 15 }}>
        <Button title="Select Executive Image" onPress={() => pickImage(setExecImage)} />
      </View>
      {execImage && <Image source={{ uri: execImage }} style={styles.execImage} />}
      <View style={{ marginTop: 15 }}>
        <Button title="Add Executive" onPress={addExecutive} />
      </View>
      {executives.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: 'bold' }}>Current Executives:</Text>
          {executives.map((exec, index) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
              {exec.image && <Image source={{ uri: exec.image }} style={styles.execImage} />}
              <View>
                <Text>{exec.name}</Text>
                <Text>{exec.role}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        onPress={handleCreateGroup}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#999' : '#2196F3',
          paddingVertical: 12,
          borderRadius: 4,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 20,
        }}
      >
        {loading && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />}
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
          {loading ? 'Creating Group...' : 'Create Group'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 80,
  },
  label: { fontWeight: '600', marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 10, backgroundColor: '#fff' },
  image: { width: '100%', height: 200, marginVertical: 10 },
  execImage: { width: 60, height: 60, borderRadius: 30, marginRight: 10 },
});

export default CreateGroupScreen;
