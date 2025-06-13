import React, { useState } from "react";
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
  const { groupId } = route.params;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null); // local image URI
  const [uploading, setUploading] = useState(false);

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
      console.log("Uploading image...");

      const fileExt = uri.split(".").pop() || "jpg";
      const fileName = `${groupId}-${Date.now()}.${fileExt}`;
      const filePath = `news/${fileName}`;
      const contentType = `image/${fileExt === "jpg" ? "jpeg" : fileExt}`;

      // Read file as base64 string
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to buffer
      const buffer = Buffer.from(base64, "base64");

      // Upload buffer to Supabase Storage
      const { data, error } = await supabase.storage
        .from("group-assets")
        .upload(filePath, buffer, {
          contentType,
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error.message);
        throw error;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("group-assets").getPublicUrl(filePath);

      setUploading(false);
      console.log("Image uploaded:", publicUrl);
      return publicUrl;
    } catch (error) {
      console.error("Image upload error:", error.message);
      setUploading(false);
      Alert.alert("Upload failed", error.message);
      return null;
    }
  };

  const saveNews = async () => {
    console.log("Save button clicked");

    if (!title.trim() || !content.trim()) {
      Alert.alert("Validation Error", "Title and content are required");
      return;
    }

    console.log("groupId:", groupId);

    let imageUrl = null;
    if (image) {
      imageUrl = await uploadImage(image);
      if (!imageUrl) return;
    }

    try {
      const { data: groupData, error: fetchError } = await supabase
        .from("groups")
        .select("news")
        .eq("id", groupId)
        .single();

      if (fetchError) throw fetchError;

      const updatedNews = groupData.news ? [...groupData.news] : [];
      updatedNews.push({
        id: Date.now(),
        title: title.trim(),
        content: content.trim(),
        image: imageUrl,
        date: new Date().toISOString(),
        views: 0,  // <-- add this field here
      });

      const { error: updateError } = await supabase
        .from("groups")
        .update({ news: updatedNews })
        .eq("id", groupId);

      if (updateError) throw updateError;

      Alert.alert("Success", "News story added!");
      navigation.goBack();
    } catch (error) {
      console.error("Error saving news:", error.message);
      Alert.alert("Error saving news", error.message);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View>
        <Text style={styles.heading}>Add a News Story</Text>
        <Text style={styles.description}>
          Share the latest news and updates with your group by adding a news
          story here.
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

        {uploading ? (
          <ActivityIndicator size="large" color="#4338ca" style={{ marginTop: 20 }} />
        ) : (
          <View style={{ marginTop: 20, marginBottom: 50 }}>
            <Button title="Save News" onPress={saveNews} color="#4338ca" />
          </View>
        )}
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
});
