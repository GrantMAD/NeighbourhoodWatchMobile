import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, ScrollView, Image, Alert, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { supabase } from '../../lib/supabase';
import Toast from '../components/Toast';

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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [mainImageLoading, setMainImageLoading] = useState(false);
  const [execImageLoading, setExecImageLoading] = useState(false);

  const handleShowToast = (message, type) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleHideToast = () => {
    setShowToast(false);
    setToastMessage('');
  };

  const pickImage = async (setter) => {
    if (setter === setMainImage) setMainImageLoading(true);
    if (setter === setExecImage) setExecImageLoading(true);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setter(result.assets[0].uri);
    }

    if (setter === setMainImage) setMainImageLoading(false);
    if (setter === setExecImage) setExecImageLoading(false);
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

      const { data: publicUrl } = supabase.storage.from('group-assets').getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Image upload error:', error.message);
      handleShowToast(`Upload Error: ${error.message}`, 'error');
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
      setToastMessage('Please enter a group name.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setLoading(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        handleShowToast('User not logged in or failed to fetch user.', 'error');
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
              setToastMessage(`Failed to upload image for executive ${exec.name}`);
              setToastType('error');
              setShowToast(true);
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
        setToastMessage(insertError.message);
        setToastType('error');
        setShowToast(true);
        setLoading(false);
        return;
      }

      const newGroup = insertData?.[0];
      if (!newGroup) {
        setToastMessage('Failed to create group.');
        setToastType('error');
        setShowToast(true);
        setLoading(false);
        return;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          group_id: newGroup.id,
          is_group_creator: true,
          role: 'Admin',
        })
        .eq('id', user.id);

      if (profileError) {
        setToastMessage(`Error updating profile: ${profileError.message}`);
        setToastType('error');
        setShowToast(true);
        setLoading(false);
        return;
      }

      // This duplicate profileError check is redundant and can be removed or consolidated
      // if (profileError) {
      //   Alert.alert('Error updating profile:', profileError.message);
      //   setLoading(false);
      //   return;
      // }

      setToastMessage(`Group created! Password: ${groupPassword}`);
      setToastType('success');
      setShowToast(true);

      setTimeout(() => {
        setLoading(false); // Set loading to false just before navigation
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp', params: { groupId: newGroup.id, toastMessage: `Group created! Password: ${groupPassword}`, toastType: 'success' } }],
        });
      }, 2000); // Show toast for 2 seconds before navigating
    } catch (error) {
      console.error('Error creating group:', error);
      handleShowToast('Something went wrong creating your group.', 'error');
      setLoading(false); // Ensure loading is false on error
    } finally {
      // Removed setLoading(false) from here
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create a New Group</Text>
      <Text style={styles.description}>
        Fill out the form below to create a new group for your community. You can provide as much or as little detail as you like.
      </Text>

      <Text style={styles.subheading}>Group Details</Text>
      <Text style={styles.label}>Group Name</Text>
      <TextInput value={groupName} onChangeText={setGroupName} style={styles.input} />

      <Text style={styles.label}>Welcome Text</Text>
      <TextInput value={welcomeText} onChangeText={setWelcomeText} style={styles.input} multiline />

      <Text style={styles.label}>Contact Email</Text>
      <TextInput value={contactEmail} onChangeText={setContactEmail} style={styles.input} />

      <TouchableOpacity
        onPress={() => pickImage(setMainImage)}
        style={styles.imagePickerButton}
        disabled={mainImageLoading}
      >
        {mainImageLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Select Main Image</Text>
        )}
      </TouchableOpacity>
      {mainImage && <Image source={{ uri: mainImage }} style={styles.image} />}

      <Text style={styles.subheading}>Group Information</Text>
      <Text style={styles.label}>Vision</Text>
      <TextInput value={vision} onChangeText={setVision} style={styles.input} multiline />

      <Text style={styles.label}>Mission</Text>
      <TextInput value={mission} onChangeText={setMission} style={styles.input} multiline />

      <Text style={styles.label}>Values</Text>
      <TextInput value={values} onChangeText={setValues} style={styles.input} multiline />

      <Text style={styles.label}>Objectives</Text>
      <TextInput value={objectives} onChangeText={setObjectives} style={styles.input} multiline />

      <Text style={styles.subheading}>Executive Committee</Text>
      <Text style={styles.description}>
        To add an executive, fill in their name and role, select an image, and press the "Add Executive" button.
      </Text>
      <Text style={styles.label}>Executives Section Title</Text>
      <TextInput value={executivesTitle} onChangeText={setExecutivesTitle} style={styles.input} />

      <Text style={styles.label}>Executive Name</Text>
      <TextInput value={execName} onChangeText={setExecName} style={styles.input} />
      <Text style={styles.label}>Executive Role</Text>
      <TextInput value={execRole} onChangeText={setExecRole} style={styles.input} />
      <View style={{ marginBottom: 15 }}>
        <TouchableOpacity
          onPress={() => pickImage(setExecImage)}
          style={styles.imagePickerButton}
          disabled={execImageLoading}
        >
          {execImageLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Select Executive Image</Text>
          )}
        </TouchableOpacity>
      </View>
      {execImage && <Image source={{ uri: execImage }} style={styles.execImage} />}
      <View style={{ marginTop: 15 }}>
        <TouchableOpacity onPress={addExecutive} style={styles.addButton}>
          <Text style={styles.buttonText}>Add Executive</Text>
        </TouchableOpacity>
      </View>
      {executives.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.executivesHeader}>Current Executives:</Text>
          {executives.map((exec, index) => (
            <View key={index} style={styles.execCard}>
              {exec.image && <Image source={{ uri: exec.image }} style={styles.execImage} />}
              <View>
                <Text style={styles.execName}>{exec.name}</Text>
                <Text style={styles.execRole}>{exec.role}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        onPress={handleCreateGroup}
        disabled={loading}
        style={[
          styles.createButton,
          loading && styles.loadingButton
        ]}
      >
        {loading ? (
          <>
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.buttonText}>Creating Group...</Text>
          </>
        ) : (
          <Text style={styles.buttonText}>Create Group</Text>
        )}
      </TouchableOpacity>

      {/* 👇 Add this just below the button */}
      {loading && (
        <Text style={styles.loadingNote}>
          This may take up to a minute to complete...
        </Text>
      )}


      <Toast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onHide={handleHideToast}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 80,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  subheading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 5,
  },
  label: { fontWeight: '600', marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 10, backgroundColor: '#fff' },
  image: { width: '100%', height: 200, marginVertical: 10 },
  execImage: { width: 60, height: 60, borderRadius: 30, marginRight: 10 },
  imagePickerButton: {
    backgroundColor: '#14b8a6',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  addButton: {
    backgroundColor: '#f97316',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    backgroundColor: '#1f2937',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingButton: {
    backgroundColor: '#999',
  },
  executivesHeader: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 20,
  },
  execCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    padding: 10,
    backgroundColor: '#1f2937',
    borderRadius: 5,
  },
  execName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: 'white',
  },
  execRole: {
    fontStyle: 'italic',
    color: 'white',
  },
  loadingNote: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280', 
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default CreateGroupScreen;