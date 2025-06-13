import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Button,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../lib/supabase";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";

function ProfileScreen() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({
        name: "",
        number: "",
        street: "",
        avatar_url: "",
        emergency_contact: "",
    });
    const [uploading, setUploading] = useState(false);
    const [avatarLocalUri, setAvatarLocalUri] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    async function deleteOldAvatar(avatarUrl) {
        if (!avatarUrl) return; // nothing to delete

        try {
            const url = new URL(avatarUrl);
            const path = url.pathname; 
            const prefix = "/storage/v1/object/public/group-assets/";
            if (!path.startsWith(prefix)) return; // safety check
            const filePath = path.slice(prefix.length);

            console.log("Deleting old avatar from storage:", filePath);

            // Delete the file from the bucket
            const { error } = await supabase.storage.from("group-assets").remove([filePath]);
            if (error) {
                console.warn("Failed to delete old avatar from storage:", error.message);
            } else {
                console.log("Old avatar deleted from storage:", filePath);
            }
        } catch (error) {
            console.warn("Error deleting old avatar:", error.message);
        }
    }

    async function fetchProfile() {
        setLoading(true);
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw userError || new Error("No user logged in");

            const { data, error } = await supabase
                .from("profiles")
                .select("name, number, street, avatar_url, emergency_contact")
                .eq("id", user.id)
                .single();

            if (error) throw error;

            setProfile(data);
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    }

    async function updateProfile() {
        setLoading(true);
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw userError || new Error("No user logged in");

            // Fetch latest avatar_url directly from DB for deletion safety
            const { data: freshProfile, error: profileError } = await supabase
                .from("profiles")
                .select("avatar_url")
                .eq("id", user.id)
                .single();
            if (profileError) throw profileError;

            let avatarUrl = freshProfile.avatar_url;

            if (avatarLocalUri) {
                await deleteOldAvatar(avatarUrl);

                const uploadedUrl = await uploadAvatar(avatarLocalUri);
                if (uploadedUrl) {
                    avatarUrl = uploadedUrl;
                }
            }

            const { error } = await supabase
                .from("profiles")
                .update({ ...profile, avatar_url: avatarUrl })
                .eq("id", user.id);

            if (error) throw error;

            setProfile((prev) => ({
                ...prev,
                avatar_url: avatarUrl ? `${avatarUrl}?t=${Date.now()}` : "",
            }));
            setAvatarLocalUri(null);

            Alert.alert("Success", "Profile updated");
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    }

    async function pickImage() {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true,
            aspect: [1, 1],
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setAvatarLocalUri(result.assets[0].uri);
        }
    }

    async function uploadAvatar(uri) {
        setUploading(true);
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw userError || new Error("No user logged in");

            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const buffer = Buffer.from(base64, "base64");

            const fileExt = uri.split(".").pop()?.toLowerCase() || "jpg";
            const fileName = `${user.id}_avatar_${Date.now()}.${fileExt}`;
            const filePath = `userData/${fileName}`;

            const contentType = `image/${fileExt === "jpg" ? "jpeg" : fileExt}`;

            console.log("Uploading file to path:", filePath);

            const { error: uploadError } = await supabase.storage
                .from("group-assets")
                .upload(filePath, buffer, {
                    cacheControl: "3600",
                    upsert: true,
                    contentType,
                });

            if (uploadError) {
                console.error("Upload error:", uploadError);
                throw uploadError;
            }

            const { data: publicData, error: publicUrlError } = supabase.storage
                .from("group-assets")
                .getPublicUrl(filePath);

            if (publicUrlError || !publicData) {
                console.error("Error getting public URL:", publicUrlError);
                return null;
            }

            return publicData.publicUrl;
        } catch (error) {
            Alert.alert("Error uploading avatar", error.message);
            console.error("Error uploading avatar:", error);
            return null;
        } finally {
            setUploading(false);
        }
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Edit Profile</Text>

            <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                {uploading ? (
                    <ActivityIndicator size="small" />
                ) : avatarLocalUri ? (
                    <Image source={{ uri: avatarLocalUri }} style={styles.avatar} />
                ) : profile.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text>Select Avatar</Text>
                    </View>
                )}
            </TouchableOpacity>

            <TextInput
                style={styles.input}
                placeholder="Name"
                value={profile.name}
                onChangeText={(text) => setProfile({ ...profile, name: text })}
            />
            <TextInput
                style={styles.input}
                placeholder="Number"
                keyboardType="phone-pad"
                value={profile.number}
                onChangeText={(text) => setProfile({ ...profile, number: text })}
            />
            <TextInput
                style={styles.input}
                placeholder="Emergency Contact"
                value={profile.emergency_contact}
                onChangeText={(text) => setProfile({ ...profile, emergency_contact: text })}
            />
            <TextInput
                style={styles.input}
                placeholder="Street"
                value={profile.street}
                onChangeText={(text) => setProfile({ ...profile, street: text })}
            />

            <Button title="Save Profile" onPress={updateProfile} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#fff",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 20,
        color: "#4338ca",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 12,
        marginBottom: 15,
        borderRadius: 6,
    },
    avatarContainer: {
        alignSelf: "center",
        marginBottom: 20,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#e5e7eb",
        justifyContent: "center",
        alignItems: "center",
    },
});

export default ProfileScreen;
