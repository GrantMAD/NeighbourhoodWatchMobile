import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { supabase } from '../../lib/supabase';
import { Calendar } from 'react-native-calendars';

const AddEventScreen = ({ route, navigation }) => {
  const { groupId, eventToEdit } = route.params;
  const isEditMode = !!eventToEdit;

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState('');
  const [selectedRange, setSelectedRange] = useState({ startDate: null, endDate: null });

  useEffect(() => {
    if (isEditMode) {
      setTitle(eventToEdit.title);
      setMessage(eventToEdit.message);
      setImageUri(eventToEdit.image || '');
      setLocation(eventToEdit.location);
      setSelectedRange({
        startDate: eventToEdit.startDate ? new Date(eventToEdit.startDate).toISOString().split('T')[0] : null,
        endDate: eventToEdit.endDate ? new Date(eventToEdit.endDate).toISOString().split('T')[0] : null,
      });
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

      return publicUrl;
    } catch (error) {
      console.error('Image upload error:', error.message);
      Alert.alert('Upload failed', error.message);
      return null;
    }
  };

  const handleDayPress = (day) => {
    if (!selectedRange.startDate) {
      setSelectedRange({ startDate: day.dateString, endDate: null });
    } else if (!selectedRange.endDate && day.dateString >= selectedRange.startDate) {
      setSelectedRange({ ...selectedRange, endDate: day.dateString });
    } else {
      setSelectedRange({ startDate: day.dateString, endDate: null });
    }
  };

  const getMarkedDates = () => {
    const markedDates = {};
    if (selectedRange.startDate) {
      markedDates[selectedRange.startDate] = {
        startingDay: true,
        color: '#22d3ee',
        textColor: 'white',
      };
      if (selectedRange.endDate && selectedRange.endDate !== selectedRange.startDate) {
        const start = new Date(selectedRange.startDate);
        const end = new Date(selectedRange.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateString = d.toISOString().split('T')[0];
          markedDates[dateString] = {
            ...markedDates[dateString],
            color: '#22d3ee',
            textColor: 'white',
          };
        }
        markedDates[selectedRange.endDate] = {
          endingDay: true,
          color: '#22d3ee',
          textColor: 'white',
        };
      }
    }
    return markedDates;
  };

  const handleSaveEvent = async () => {
    if (!title || !message || !selectedRange.startDate || !selectedRange.endDate || !location) {
      Alert.alert('Missing info', 'Please fill in all required fields and select a date range.');
      return;
    }

    setUploading(true);

    let imageUrl = eventToEdit?.image || null;
    if (imageUri && imageUri !== eventToEdit?.image) {
      imageUrl = await uploadImage(imageUri);
      if (!imageUrl) {
        setUploading(false);
        return;
      }
    } else if (!imageUri && !isEditMode) {
      imageUrl = "🗓️";
    }

    const eventData = {
      id: isEditMode ? eventToEdit.id : Date.now().toString(),
      title,
      message,
      image: imageUrl,
      startDate: new Date(selectedRange.startDate).toISOString(),
      endDate: new Date(selectedRange.endDate).toISOString(),
      location,
      views: isEditMode ? eventToEdit.views : 0,
      attendees: isEditMode ? eventToEdit.attendees || [] : [],
      attending_count: isEditMode ? eventToEdit.attending_count || 0 : 0,
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

      if (!isEditMode) {
        await notifyGroupUsersAboutNewEvent(groupId, eventData.id, eventData.title);
      }

      if (isEditMode) {
        if (route.params?.onEventUpdated) {
          route.params.onEventUpdated(`Event updated successfully!`);
        }
      } else {
        if (route.params?.onEventAdded) {
          route.params.onEventAdded(`Event added successfully!`);
        }
      }
      navigation.goBack();
    } catch (err) {
      console.error('Error saving event:', err.message);
      Alert.alert('Error', `Failed to save event: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
  }

  async function notifyGroupUsersAboutNewEvent(groupId, eventId, eventTitle) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data: senderProfile, error: senderError } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();

      if (senderError) throw senderError;

      const senderName = senderProfile.name || "A member";
      const senderAvatarUrl = senderProfile.avatar_url;

      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("users")
        .eq("id", groupId)
        .single();

      if (groupError || !groupData?.users) {
        console.error("Failed to fetch group users", groupError);
        return;
      }

      const otherUserIds = groupData.users.filter(id => id !== user.id);
      if (otherUserIds.length === 0) return;

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, notifications, receive_event_notifications")
        .in("id", otherUserIds);

      if (profilesError) throw profilesError;

      const timestamp = new Date().toISOString();
      const notification = {
        id: generateUniqueId(),
        type: "new_event",
        message: `${senderName} added a new event: ${eventTitle}`,
        timestamp,
        read: false,
        avatar_url: senderAvatarUrl,
        eventId: eventId,
        groupId: groupId,
      };

      const updates = profiles
        .filter(profile => profile.receive_event_notifications) // Filter based on preference
        .map(profile => {
          const updatedNotifications = [...(profile.notifications || []), notification];
          return supabase
            .from("profiles")
            .update({ notifications: updatedNotifications })
            .eq("id", profile.id);
      });

      await Promise.all(updates);

    } catch (err) {
      console.error("Error sending new event notification:", err.message);
    }
  }

  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'Select Date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Text style={styles.heading}>{isEditMode ? "Edit Event" : "Add a New Event"}</Text>
        <Text style={styles.description}>
          {isEditMode ? "Edit the details of the event below." : "Create and share new events with your group members."}
        </Text>
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

        <Text style={styles.label}>Select Event Date Range *</Text>
        <View style={{ backgroundColor: "#ffffff", borderRadius: 12, marginBottom: 20, marginTop: 10 }}>
          <Calendar
            markingType="period"
            markedDates={getMarkedDates()}
            onDayPress={handleDayPress}
            style={{
              borderRadius: 12,
              backgroundColor: "#ffffff",
            }}
            theme={{
              backgroundColor: "#ffffff",
              calendarBackground: "#ffffff",
              textSectionTitleColor: "#4b5563",
              selectedDayBackgroundColor: "#22d3ee",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#22d3ee",
              dayTextColor: "#111827",
              textDisabledColor: "#d1d5db",
              monthTextColor: "#1f2937",
              arrowColor: "#3b82f6",
              disabledArrowColor: "#d1d5db",
              indicatorColor: "#3b82f6",
              textDayFontWeight: "400",
              textMonthFontWeight: "700",
              textDayHeaderFontWeight: "600",
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
          />
        </View>

        {selectedRange.startDate && selectedRange.endDate && (
          <View style={styles.dateRangeDisplay}>
            <Text style={styles.dateRangeText}>
              Start: {formatDateDisplay(selectedRange.startDate)}
            </Text>
            <Text style={styles.dateRangeText}>
              End: {formatDateDisplay(selectedRange.endDate)}
            </Text>
          </View>
        )}

        <View style={{ marginBottom: 50, marginTop: 10 }}>
          {uploading ? (
            <View style={styles.loadingButton}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={{ color: '#ffffff', marginLeft: 10 }}>{isEditMode ? 'Updating...' : 'Adding...'}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveEvent}>
              <Text style={styles.saveButtonText}>{isEditMode ? 'Update Event' : 'Add Event'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
    </View>
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
  loadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#a5b4fc',
    padding: 10,
    borderRadius: 5,
  },
  dateRangeDisplay: {
    marginTop: 15,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  saveButton: {
    backgroundColor: '#1f2937',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    color: "#1f2937",
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
    textAlign: "center",
  },
});

export default AddEventScreen;
