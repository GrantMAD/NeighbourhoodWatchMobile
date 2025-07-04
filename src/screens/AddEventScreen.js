import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { supabase } from '../../lib/supabase';
import DateTimePicker from "@react-native-community/datetimepicker";

const AddEventScreen = ({ route, navigation }) => {
  const { groupId, eventToEdit } = route.params;
  const isEditMode = !!eventToEdit;

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      setTitle(eventToEdit.title);
      setMessage(eventToEdit.message);
      setImageUri(eventToEdit.image || '');
      setLocation(eventToEdit.location);
      setStartDate(new Date(eventToEdit.startDate));
      setEndDate(new Date(eventToEdit.endDate));
      navigation.setOptions({ title: 'Edit Event' });
    }
  }, [isEditMode, eventToEdit, navigation]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    try {
      setUploading(true);
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${groupId}-${Date.now()}.${fileExt}`;
      const filePath = `event/${fileName}`;
      const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const buffer = Buffer.from(base64, 'base64');

      const { data, error } = await supabase.storage
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

      setUploading(false);
      return publicUrl;
    } catch (error) {
      console.error('Image upload error:', error.message);
      setUploading(false);
      Alert.alert('Upload failed', error.message);
      return null;
    }
  };

  const onChangeStartDate = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (event.type === "set" && selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onChangeEndDate = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (event.type === "set" && selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const handleSaveEvent = async () => {
    if (!title || !message || !startDate || !endDate || !location) {
      Alert.alert('Missing info', 'Please fill in all required fields.');
      return;
    }

    let imageUrl = eventToEdit?.image || null;
    if (imageUri && imageUri !== eventToEdit?.image) {
      imageUrl = await uploadImage(imageUri);
      if (!imageUrl) return;
    }

    const eventData = {
      id: isEditMode ? eventToEdit.id : Date.now().toString(),
      title,
      message,
      image: imageUrl,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      location,
      views: isEditMode ? eventToEdit.views : 0,
    };

    try {
      const { data: group, error: fetchError } = await supabase
        .from('groups')
        .select('events')
        .eq('id', groupId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      let updatedEvents;
      if (isEditMode) {
        updatedEvents = group.events.map(event =>
          event.id === eventToEdit.id ? eventData : event
        );
      } else {
        updatedEvents = [...(group?.events || []), eventData];
      }

      const { error: updateError } = await supabase
        .from('groups')
        .update({ events: updatedEvents })
        .eq('id', groupId);

      if (updateError) {
        throw updateError;
      }

      Alert.alert('Success', `Event ${isEditMode ? 'updated' : 'added'}!`);
      navigation.goBack();
    } catch (err) {
      console.error('Error saving event:', err.message);
      Alert.alert('Error', `Failed to save event: ${err.message}`);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString();
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Text style={styles.label}>Title *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Enter event title" />

        <Text style={styles.label}>Message *</Text>
        <TextInput
          style={[styles.input, styles.messageInput]}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholder="Enter event details or message"
        />
        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Enter location of the event"
        />
        <Text style={styles.label}>Image</Text>
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <Text style={{ color: '#999' }}>Tap to choose an image</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Start Date *</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowStartDatePicker(true)}
        >
          <Text>{formatDate(startDate)}</Text>
          <Text>🗓️</Text>
        </TouchableOpacity>
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={onChangeStartDate}
          />
        )}

        <Text style={styles.label}>End Date *</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowEndDatePicker(true)}
        >
          <Text>{formatDate(endDate)}</Text>
          <Text>🗓️</Text>
        </TouchableOpacity>
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={onChangeEndDate}
            minimumDate={startDate}
          />
        )}

        <View style={{ marginBottom: 50, marginTop: 10 }}>
          <Button title={uploading ? 'Uploading...' : (isEditMode ? 'Update Event' : 'Add Event')} onPress={handleSaveEvent} disabled={uploading} />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  label: { marginTop: 12, fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  messageInput: {
    height: 100,
  },
  imagePicker: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  dateRangeText: {
    marginTop: 8,
    fontStyle: 'italic',
    color: '#333',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
});

export default AddEventScreen;
