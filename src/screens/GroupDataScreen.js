import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    ScrollView,
    Alert,
    Image,
    ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";
import { supabase } from "../../lib/supabase";

export default function GroupDataScreen() {
    const [groupData, setGroupData] = useState({
        name: "",
        contact_email: "",
        welcome_text: "",
        vision: "",
        mission: "",
        objectives: "",
        main_image: null,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [groupId, setGroupId] = useState(null);
    const [newImage, setNewImage] = useState(null); // local URI of newly picked image

    useEffect(() => {
        const fetchGroupData = async () => {
            setLoading(true);
            try {
                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError || !user) {
                    Alert.alert("Error", "Could not get user.");
                    setLoading(false);
                    return;
                }

                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("group_id")
                    .eq("id", user.id)
                    .single();

                if (profileError || !profile?.group_id) {
                    Alert.alert("Error", "Could not find user profile or group ID.");
                    setLoading(false);
                    return;
                }

                setGroupId(profile.group_id);

                const { data: group, error: groupError } = await supabase
                    .from("groups")
                    .select(
                        "name, contact_email, welcome_text, vision, mission, objectives, main_image"
                    )
                    .eq("id", profile.group_id)
                    .single();

                if (groupError || !group) {
                    Alert.alert("Error", "Could not fetch group data.");
                    setLoading(false);
                    return;
                }

                setGroupData(group);
            } catch (error) {
                Alert.alert("Error", "Unexpected error: " + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchGroupData();
    }, []);

    const handleChange = (field, value) => {
        setGroupData((prev) => ({ ...prev, [field]: value }));
    };

    // Delete previous image from supabase storage
    const deleteOldImage = async (imageUrl) => {
        if (!imageUrl) return;

        try {
            // Supabase Storage base URL (adjust this if your project has a custom domain)
            const baseURL = "https://epegetangczhtouixwfc.supabase.co/storage/v1/object/public/group-assets/";

            // Extract the relative file path from the full public URL
            const filePath = imageUrl.replace(baseURL, "");

            // Ensure filePath is valid
            if (filePath) {
                const { error } = await supabase.storage
                    .from("group-assets")
                    .remove([filePath]);

                if (error) {
                    console.error("Failed to delete old image:", error.message);
                } else {
                    console.log("Old image deleted from storage.");
                }
            }
        } catch (err) {
            console.error("Error deleting old image:", err.message);
        }
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert("Permission denied", "Permission to access gallery is required!");
            return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (!pickerResult.canceled) {
            // For SDK 48+, result is pickerResult.assets, not pickerResult.uri
            const uri = pickerResult.assets[0].uri;
            setNewImage(uri);
        }
    };

    const uploadImage = async (uri, groupId) => {
        try {
            const response = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const buffer = Buffer.from(response, "base64");

            // Use timestamp + random suffix to avoid overwriting files with same name
            const fileExt = uri.split(".").pop();
            const fileName = `${groupId}_${Date.now()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from("group-assets")
                .upload(`group-assets/${fileName}`, buffer, {
                    contentType: `image/${fileExt === "jpg" ? "jpeg" : fileExt}`,
                    upsert: true,
                });

            if (error) {
                throw error;
            }

            // Get public URL
            const { data: publicUrlData } = supabase.storage
                .from("group-assets")
                .getPublicUrl(`group-assets/${fileName}`);

            return publicUrlData.publicUrl;
        } catch (error) {
            Alert.alert("Upload Error", error.message);
            return null;
        }
    };

    const handleSave = async () => {
        if (!groupId) return;

        setSaving(true);

        try {
            let updatedMainImage = groupData.main_image; // default to existing

            // If new image selected, delete old image first and upload new one
            if (newImage) {
                await deleteOldImage(groupData.main_image);
                const uploadedUrl = await uploadImage(newImage, groupId);
                if (uploadedUrl) {
                    updatedMainImage = uploadedUrl; // update local var, not state yet
                }
            }

            // Prepare payload with updated main_image url
            const updatePayload = { ...groupData, main_image: updatedMainImage };

            // Send update to Supabase
            const { error } = await supabase
                .from("groups")
                .update(updatePayload)
                .eq("id", groupId);

            if (error) {
                Alert.alert("Error", "Failed to update group data.");
            } else {
                // Update state only after successful update
                setGroupData((prev) => ({ ...prev, main_image: updatedMainImage }));
                setNewImage(null);
                Alert.alert("Success", "Group data updated.");
            }
        } catch (error) {
            Alert.alert("Error", "Unexpected error: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#4338ca" />
                <Text>Loading group data...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.title}>Edit Group Info</Text>

            {[
                { key: "name", label: "Group Name" },
                { key: "contact_email", label: "Contact Email" },
                { key: "welcome_text", label: "Welcome Text", multiline: true },
                { key: "vision", label: "Vision", multiline: true },
                { key: "mission", label: "Mission", multiline: true },
                { key: "objectives", label: "Objectives", multiline: true },
            ].map(({ key, label, multiline }) => (
                <View key={key} style={styles.inputContainer}>
                    <Text style={styles.label}>{label}</Text>
                    <TextInput
                        style={[styles.input, multiline && styles.textArea]}
                        value={groupData[key]}
                        onChangeText={(text) => handleChange(key, text)}
                        multiline={multiline}
                        numberOfLines={multiline ? 4 : 1}
                    />
                </View>
            ))}

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Main Image</Text>
                {newImage ? (
                    <Image source={{ uri: newImage }} style={styles.imagePreview} />
                ) : groupData.main_image ? (
                    <Image source={{ uri: groupData.main_image }} style={styles.imagePreview} />
                ) : (
                    <Text>No image uploaded.</Text>
                )}
                <Button title="Pick/Change Image" onPress={pickImage} />
            </View>

            {saving ? (
                <ActivityIndicator size="large" color="#4338ca" />
            ) : (
                <Button title="Save Changes" onPress={handleSave} />
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#fff",
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 20,
        color: "#4338ca",
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        marginBottom: 6,
        fontWeight: "600",
    },
    input: {
        borderWidth: 1,
        borderColor: "#999",
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        backgroundColor: "#f9f9f9",
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: "top",
    },
    imagePreview: {
        width: "100%",
        height: 200,
        borderRadius: 10,
        marginBottom: 10,
        resizeMode: "cover",
    },
});
