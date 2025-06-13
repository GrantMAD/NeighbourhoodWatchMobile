import React, { useState } from 'react';
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
import { Calendar } from 'react-native-calendars';

const AddEventScreen = ({ route, navigation }) => {
  const { groupId } = route.params;

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [markedDates, setMarkedDates] = useState({});

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

  const onDayPress = (day) => {
    const dateStr = day.dateString;

    if (!startDate || (startDate && endDate)) {
      setStartDate(dateStr);
      setEndDate(null);
      setMarkedDates({
        [dateStr]: {
          startingDay: true,
          endingDay: true,
          color: '#70d7c7',
          textColor: 'white',
        },
      });
      return;
    }

    if (startDate && !endDate) {
      if (dateStr < startDate) {
        Alert.alert('Invalid range', 'End date cannot be before start date.');
        return;
      }

      setEndDate(dateStr);
      const range = getMarkedRange(startDate, dateStr);
      setMarkedDates(range);
    }
  };

  const getMarkedRange = (start, end) => {
    let range = {};
    let startDateObj = new Date(start);
    let endDateObj = new Date(end);

    for (
      let d = new Date(startDateObj);
      d <= endDateObj;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split('T')[0];
      if (dateStr === start) {
        range[dateStr] = {
          startingDay: true,
          color: '#70d7c7',
          textColor: 'white',
        };
      } else if (dateStr === end) {
        range[dateStr] = {
          endingDay: true,
          color: '#70d7c7',
          textColor: 'white',
        };
      } else {
        range[dateStr] = {
          color: '#9be1d7',
          textColor: 'white',
        };
      }
    }
    return range;
  };

  const handleAddEvent = async () => {
    if (!title || !message || !startDate || !endDate || !location) {
      Alert.alert('Missing info', 'Please fill in all required fields.');
      return;
    }

    let imageUrl = null;

    if (imageUri) {
      imageUrl = await uploadImage(imageUri);
      if (!imageUrl) return; // already alerted in uploadImage
    }

    const newEvent = {
      title,
      message,
      image: imageUrl,
      startDate,
      endDate,
      location,
    };

    try {
      const { data: group, error: fetchError } = await supabase
        .from('groups')
        .select('events')
        .eq('id', groupId)
        .single();

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        Alert.alert('Error fetching group data.');
        return;
      }

      const updatedEvents = [...(group?.events || []), newEvent];

      const { error: updateError } = await supabase
        .from('groups')
        .update({ events: updatedEvents })
        .eq('id', groupId);

      if (updateError) {
        console.error('Update error:', updateError);
        Alert.alert('Error saving event.');
        return;
      }

      Alert.alert('Success', 'Event added!');
      navigation.goBack();
    } catch (err) {
      console.error('Unexpected error:', err);
      Alert.alert('Something went wrong. Please try again.');
    }
  };

  const renderDatePrompt = () => {
    if (!startDate && !endDate) {
      return <Text style={styles.dateRangeText}>📅 Please select a start date</Text>;
    } else if (startDate && !endDate) {
      return <Text style={styles.dateRangeText}>➡️ Now select an end date</Text>;
    } else {
      return (
        <Text style={styles.dateRangeText}>
          ✅ Selected from {startDate} to {endDate}
        </Text>
      );
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Text style={styles.label}>Title *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Message *</Text>
        <TextInput
          style={[styles.input, styles.messageInput]}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
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

        <Text style={styles.label}>Select Date Range *</Text>
        {renderDatePrompt()}

        <Calendar
          markingType={'period'}
          markedDates={markedDates}
          onDayPress={onDayPress}
          style={{ marginTop: 10, height: 350 }}
        />

        <View style={{ marginBottom: 50, marginTop: 10 }}>
          <Button title={uploading ? 'Uploading...' : 'Add Event'} onPress={handleAddEvent} disabled={uploading} />
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
});

export default AddEventScreen;
