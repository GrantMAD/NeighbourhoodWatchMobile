import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Button,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";
import { supabase } from "../../lib/supabase";

// Polyfill Buffer globally (if not already)
if (typeof global.Buffer === "undefined") {
  global.Buffer = Buffer;
}

export default function AddNewsScreen({ navigation, route }) {
  const { groupId, storyToEdit } = route.params;
  const isEditMode = !!storyToEdit;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null); // local image URI
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      setTitle(storyToEdit.title);
      setContent(storyToEdit.content);
      setImage(storyToEdit.image || null);
      navigation.setOptions({ title: "Edit News Story" });
    }
  }, [isEditMode, storyToEdit, navigation]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Permission to access media library is required!"
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    try {
      setUploading(true);

      const fileExt = uri.split(".").pop() || "jpg";
      const fileName = `${groupId}-${Date.now()}.${fileExt}`;
      const filePath = `news/${fileName}`;
      const contentType = `image/${fileExt === "jpg" ? "jpeg" : fileExt}`;

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const buffer = Buffer.from(base64, "base64");

      const { data, error } = await supabase.storage
        .from("group-assets")
        .upload(filePath, buffer, {
          contentType,
          upsert: false,
        });

      if (error) {
        throw error;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("group-assets").getPublicUrl(filePath);

      setUploading(false);
      return publicUrl;
    } catch (error) {
      console.error("Image upload error:", error.message);
      setUploading(false);
      Alert.alert("Upload failed", error.message);
      return null;
    }
  };

  const saveNews = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Validation Error", "Title and content are required");
      return;
    }

    setIsSaving(true);

    try {
      let imageUrl = storyToEdit?.image || null;
      if (image && image !== storyToEdit?.image) {
          imageUrl = await uploadImage(image);
          if (!imageUrl) return;
      }

      const storyData = {
          id: isEditMode ? storyToEdit.id : Date.now(),
          title: title.trim(),
          content: content.trim(),
          image: imageUrl,
          date: isEditMode ? storyToEdit.date : new Date().toISOString(),
          views: isEditMode ? storyToEdit.views : 0,
      };

      const { data: groupData, error: fetchError } = await supabase
        .from("groups")
        .select("news")
        .eq("id", groupId)
        .single();

      if (fetchError) throw fetchError;

      let updatedNews;
      if (isEditMode) {
        updatedNews = groupData.news.map(story =>
          story.id === storyToEdit.id ? storyData : story
        );
      } else {
        updatedNews = [...(groupData.news || []), storyData];
      }

      const { error: updateError } = await supabase
        .from("groups")
        .update({ news: updatedNews })
        .eq("id", groupId);

      if (updateError) throw updateError;

      if (!isEditMode) {
        await notifyGroupUsersAboutNewNews(groupId, storyData.title);
      }

      Alert.alert("Success", `News story ${isEditMode ? 'updated' : 'added'}!`);
      navigation.goBack();
    } catch (error) {
      console.error("Error saving news:", error.message);
      Alert.alert("Error saving news", error.message);
    } finally {
      setIsSaving(false);
    }
  };

  function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
  }

  async function notifyGroupUsersAboutNewNews(groupId, newsTitle) {
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
        .select("id, notifications, receive_news_notifications")
        .in("id", otherUserIds);

      if (profilesError) throw profilesError;

      const timestamp = new Date().toISOString();
      const notification = {
        id: generateUniqueId(),
        type: "new_news",
        message: `${senderName} added a new news story: ${newsTitle}`,
        timestamp,
        read: false,
        avatar_url: senderAvatarUrl,
      };

      const updates = profiles
        .filter(profile => profile.receive_news_notifications) // Filter based on preference
        .map(profile => {
          const updatedNotifications = [...(profile.notifications || []), notification];
          return supabase
            .from("profiles")
            .update({ notifications: updatedNotifications })
            .eq("id", profile.id);
        });

      await Promise.all(updates);

    } catch (err) {
      console.error("Error sending new news notification:", err.message);
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View>
        <Text style={styles.heading}>{isEditMode ? "Edit News Story" : "Add a News Story"}</Text>
        <Text style={styles.description}>
          {isEditMode ? "Edit the details of the news story below." : "Share the latest news and updates with your group by adding a news story here."}
        </Text>

        <Text style={styles.label}>Title *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          placeholder="Enter news title"
        />

        <Text style={styles.label}>Content *</Text>
        <TextInput
          value={content}
          onChangeText={setContent}
          style={[styles.input, styles.contentInput]}
          placeholder="Enter news content"
          multiline
        />

        <Text style={styles.label}>Image</Text>
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {image ? (
            <Image source={{ uri: image }} style={styles.imagePreview} />
          ) : (
            <Text style={{ color: "#999" }}>Tap to choose an image</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={saveNews}
          style={[styles.saveButton, (isSaving || uploading) && styles.loadingButton]}
          disabled={isSaving || uploading}
        >
          {isSaving ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={{ color: '#ffffff', marginLeft: 10 }}>{isEditMode ? 'Updating...' : 'Saving...'}</Text>
            </>
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditMode ? "Update Story" : "Save News"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  label: {
    marginTop: 12,
    fontWeight: "bold",
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
    fontSize: 16,
  },
  contentInput: {
    height: 120,
    textAlignVertical: "top",
  },
  imagePicker: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
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
  saveButton: {
    backgroundColor: "#4338ca",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 50,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#a5b4fc',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 50,
  },
});
