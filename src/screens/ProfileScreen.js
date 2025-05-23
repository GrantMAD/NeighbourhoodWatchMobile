import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';

export default function ProfileScreen() {
  // Initial static user data (editable state will update this)
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 234 567 890',
    bio: 'Community member and volunteer patroller. Passionate about neighborhood safety.',
    avatarUrl: null,
  });

  // Track if we are in edit mode
  const [isEditing, setIsEditing] = useState(false);

  // Handle toggle between edit and save
  const handleEditSave = () => {
    if (isEditing) {
      // Here you could add validation or submit logic
      // For now, just toggle back to view mode
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  // Update user state as inputs change
  const handleChange = (key, value) => {
    setUser(prev => ({ ...prev, [key]: value }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.avatarContainer}>
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>
              {user.name.charAt(0)}
            </Text>
          </View>
        )}
      </View>

      {isEditing ? (
        <TextInput
          style={styles.inputName}
          value={user.name}
          onChangeText={text => handleChange('name', text)}
          placeholder="Name"
          placeholderTextColor="#9CA3AF"
        />
      ) : (
        <Text style={styles.name}>{user.name}</Text>
      )}

      {isEditing ? (
        <TextInput
          style={styles.inputInfo}
          value={user.email}
          onChangeText={text => handleChange('email', text)}
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      ) : (
        <Text style={styles.info}>{user.email}</Text>
      )}

      {isEditing ? (
        <TextInput
          style={styles.inputInfo}
          value={user.phone}
          onChangeText={text => handleChange('phone', text)}
          placeholder="Phone"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
        />
      ) : (
        <Text style={styles.info}>{user.phone}</Text>
      )}

      <View style={styles.bioContainer}>
        <Text style={styles.bioTitle}>About Me</Text>

        {isEditing ? (
          <TextInput
            style={[styles.inputBio, { height: 100 }]}
            value={user.bio}
            onChangeText={text => handleChange('bio', text)}
            placeholder="Write something about yourself..."
            placeholderTextColor="#9CA3AF"
            multiline={true}
            textAlignVertical="top"
          />
        ) : (
          <Text style={styles.bio}>{user.bio}</Text>
        )}
      </View>

      <TouchableOpacity style={styles.editButton} onPress={handleEditSave}>
        <Text style={styles.editButtonText}>{isEditing ? 'Save Profile' : 'Edit Profile'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    flexGrow: 1,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 48,
    color: 'white',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  info: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  bioContainer: {
    marginTop: 30,
    paddingHorizontal: 10,
    alignItems: 'center',
    width: '100%',
  },
  bioTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 6,
    color: '#374151',
    alignSelf: 'center',
  },
  bio: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
  },
  editButton: {
    marginTop: 40,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 18,
  },
  inputName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    borderBottomWidth: 1,
    borderColor: '#9CA3AF',
    width: '80%',
    marginBottom: 12,
  },
  inputInfo: {
    fontSize: 16,
    color: '#111827',
    borderBottomWidth: 1,
    borderColor: '#9CA3AF',
    width: '80%',
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 4,
  },
  inputBio: {
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#9CA3AF',
    borderRadius: 8,
    width: '100%',
    padding: 10,
  },
});
