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
    TouchableOpacity,
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
        executives: [],
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [groupId, setGroupId] = useState(null);
    const [newImage, setNewImage] = useState(null);

    // Inputs for adding a new executive
    const [execName, setExecName] = useState("");
    const [execRole, setExecRole] = useState("");
    const [execImage, setExecImage] = useState(null);

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
                    .select("name, contact_email, welcome_text, vision, mission, objectives, main_image, executives")
                    .eq("id", profile.group_id)
                    .single();

                if (groupError || !group) {
                    Alert.alert("Error", "Could not fetch group data.");
                    setLoading(false);
                    return;
                }

                setGroupData({
                    ...group,
                    executives: Array.isArray(group.executives) ? group.executives : [],
                });
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

    const deleteOldImage = async (imageUrl) => {
        if (!imageUrl) return;
        try {
            const baseURL = "https://epegetangczhtouixwfc.supabase.co/storage/v1/object/public/group-assets/";
            const filePath = imageUrl.replace(baseURL, "");
            if (filePath) {
                const { error } = await supabase.storage.from("group-assets").remove([filePath]);
                if (error) console.error("Failed to delete old image:", error.message);
            }
        } catch (err) {
            console.error("Error deleting old image:", err.message);
        }
    };

    const pickImage = async (callback) => {
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
            callback(pickerResult.assets[0].uri);
        }
    };

    const uploadImage = async (uri, filenamePrefix) => {
        try {
            const response = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            const buffer = Buffer.from(response, "base64");
            const fileExt = uri.split(".").pop();
            const fileName = `${filenamePrefix}_${Date.now()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from("group-assets")
                .upload(`group-assets/${fileName}`, buffer, {
                    contentType: `image/${fileExt === "jpg" ? "jpeg" : fileExt}`,
                    upsert: true,
                });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from("group-assets")
                .getPublicUrl(`group-assets/${fileName}`);

            return publicUrlData.publicUrl;
        } catch (error) {
            Alert.alert("Upload Error", error.message);
            return null;
        }
    };

    const handleAddExecutive = () => {
        if (!execName || !execRole) {
            Alert.alert("Missing Fields", "Please fill in both name and role.");
            return;
        }
        const newExec = { name: execName, role: execRole, image: execImage };
        setGroupData((prev) => ({ ...prev, executives: [...prev.executives, newExec] }));
        setExecName("");
        setExecRole("");
        setExecImage(null);
    };

    const handleSave = async () => {
        if (!groupId) return;
        setSaving(true);
        try {
            let updatedMainImage = groupData.main_image;
            if (newImage) {
                await deleteOldImage(groupData.main_image);
                const uploadedUrl = await uploadImage(newImage, groupId);
                if (uploadedUrl) updatedMainImage = uploadedUrl;
            }

            const updatedExecutives = await Promise.all(
                groupData.executives.map(async (exec) => {
                    if (exec.image && exec.image.startsWith("file://")) {
                        const url = await uploadImage(exec.image, `${groupId}_exec`);
                        return { ...exec, image: url };
                    }
                    return exec;
                })
            );

            const updatePayload = {
                ...groupData,
                main_image: updatedMainImage,
                executives: updatedExecutives,
            };

            const { error } = await supabase.from("groups").update(updatePayload).eq("id", groupId);
            if (error) {
                Alert.alert("Error", "Failed to update group data.");
            } else {
                setGroupData((prev) => ({ ...prev, main_image: updatedMainImage, executives: updatedExecutives }));
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

            {["name", "contact_email", "welcome_text", "vision", "mission", "objectives"].map((key) => (
                <View key={key} style={styles.inputContainer}>
                    <Text style={styles.label}>{key.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}</Text>
                    <TextInput
                        style={[styles.input, ["welcome_text", "vision", "mission", "objectives"].includes(key) && styles.textArea]}
                        value={groupData[key]}
                        onChangeText={(text) => handleChange(key, text)}
                        multiline={["welcome_text", "vision", "mission", "objectives"].includes(key)}
                        numberOfLines={4}
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
                <Button title="Pick/Change Image" onPress={() => pickImage(setNewImage)} />
            </View>

            {/* Executive inputs */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Add Executive</Text>
                <TextInput
                    style={styles.executiveInput}
                    placeholder="Name"
                    value={execName}
                    onChangeText={setExecName}
                />
                <TextInput
                    style={styles.executiveInput}
                    placeholder="Role"
                    value={execRole}
                    onChangeText={setExecRole}
                />
                <View style={styles.imageLocal}>
                    {execImage && <Image source={{ uri: execImage }} style={styles.execImage} />}
                </View>

                <View style={{ marginBottom: 10 }}>
                    <Button title="Pick Executive Image" onPress={() => pickImage(setExecImage)} />
                </View>
                <Button title="Add Executive" onPress={handleAddExecutive} />
            </View>

            {/* Display executives as cards */}
            {groupData.executives.length > 0 && (
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Executives</Text>
                    {groupData.executives.map((exec, index) => (
                        <View key={index} style={styles.execCard}>
                            {exec.image ? (
                                <Image source={{ uri: exec.image }} style={styles.execImage} />
                            ) : (
                                <View style={[styles.execImage, styles.execImagePlaceholder]} />
                            )}
                            <View style={styles.execTextContainer}>
                                <Text style={styles.execName}>{exec.name}</Text>
                                <Text style={styles.execRole}>{exec.role}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {saving ? (
                <ActivityIndicator size="large" color="#4338ca" />
            ) : (
                <View style={{ paddingBottom: 30 }}>
                    <Button title="Save Changes" onPress={handleSave} />
                </View>
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
        color: "#4338ca",
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
    execCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1f2937",
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
    },
    execImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#ccc",
        marginRight: 14,
    },
    execImagePlaceholder: {
        justifyContent: "center",
        alignItems: "center",
    },
    execTextContainer: {
        flexShrink: 1,
    },
    execName: {
        fontSize: 16,
        fontWeight: "700",
        color: "white",
    },
    execRole: {
        fontSize: 14,
        color: "white",
    },
    imageLocal: {
        marginBottom: 10,
        marginTop: 10,
    },
    executiveInput: {
        borderWidth: 1,
        borderColor: "#999",
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        backgroundColor: "#f9f9f9",
        marginBottom: 10,
    },
});
