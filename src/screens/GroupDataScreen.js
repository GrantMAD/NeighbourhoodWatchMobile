import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
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
import Toast from "../components/Toast";

const LoadingState = () => (
    <View style={{ padding: 20, flex: 1, backgroundColor: "#fff" }}>
        <View style={styles.loadingTitle} />
        {[...Array(2)].map((_, i) => (
            <View key={i} style={styles.inputContainer}>
                <View style={styles.loadingLabel} />
                <View style={styles.loadingInput} />
            </View>
        ))}
        {[...Array(4)].map((_, i) => (
            <View key={i + 2} style={styles.inputContainer}>
                <View style={styles.loadingLabel} />
                <View style={styles.loadingTextArea} />
            </View>
        ))}
    </View>
);

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
    const [deletingIndex, setDeletingIndex] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

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
                    setToast({ visible: true, message: "Error: Could not get user.", type: "error" });
                    setLoading(false);
                    return;
                }

                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("group_id")
                    .eq("id", user.id)
                    .single();

                if (profileError || !profile?.group_id) {
                    setToast({ visible: true, message: "Error: Could not find user profile or group ID.", type: "error" });
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
                    setToast({ visible: true, message: "Error: Could not fetch group data.", type: "error" });
                    setLoading(false);
                    return;
                }

                setGroupData({
                    ...group,
                    executives: Array.isArray(group.executives) ? group.executives : [],
                });
            } catch (error) {
                setToast({ visible: true, message: "Error: Unexpected error: " + error.message, type: "error" });
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
            setToast({ visible: true, message: "Upload Error: " + error.message, type: "error" });
            return null;
        }
    };

    const handleAddExecutive = () => {
        if (!execName || !execRole) {
            setToast({ visible: true, message: "Missing Fields: Please fill in both name and role.", type: "error" });
            return;
        }
        const newExec = { name: execName, role: execRole, image: execImage };
        setGroupData((prev) => ({ ...prev, executives: [...prev.executives, newExec] }));
        setExecName("");
        setExecRole("");
        setExecImage(null);
        setToast({ visible: true, message: "Executive added successfully!", type: "success" });
    };

    const handleDeleteExecutive = async (index) => {
        setDeletingIndex(index);
        const executiveToDelete = groupData.executives[index];
        const imageUrlToDelete = executiveToDelete.image;

        const updatedExecutives = groupData.executives.filter((_, i) => i !== index);

        try {
            const { error } = await supabase
                .from("groups")
                .update({ executives: updatedExecutives })
                .eq("id", groupId);

            if (error) {
                throw error;
            }

            if (imageUrlToDelete) {
                await deleteOldImage(imageUrlToDelete);
            }

            setGroupData((prev) => ({ ...prev, executives: updatedExecutives }));
            setToast({ visible: true, message: "Executive has been removed.", type: "success" });

        } catch (error) {
            setToast({ visible: true, message: "Error: Could not remove executive: " + error.message, type: "error" });
        } finally {
            setDeletingIndex(null);
        }
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
                setToast({ visible: true, message: "Error: Failed to update group data.", type: "error" });
            } else {
                setGroupData((prev) => ({ ...prev, main_image: updatedMainImage, executives: updatedExecutives }));
                setNewImage(null);
                setToast({ visible: true, message: "Group data updated successfully!", type: "success" });
            }
        } catch (error) {
            setToast({ visible: true, message: "Error: Unexpected error: " + error.message, type: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <LoadingState />;
    }

    return (
        <View style={{ flex: 1 }}>
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast({ ...toast, visible: false })}
            />
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
                <Text style={styles.title}>Edit Group Info</Text>
            <Text style={styles.description}>Update your group's information, including contact details, welcome message, and executive team.</Text>

            {["name", "contact_email", "welcome_text", "vision", "mission", "objectives"].map((key) => (
                <View key={key} style={styles.inputContainer}>
                    <Text style={styles.label}>
                        {key === "name" && "📝 "}
                        {key === "contact_email" && "📧 "}
                        {key === "welcome_text" && "👋 "}
                        {key === "vision" && "🌟 "}
                        {key === "mission" && "🎯 "}
                        {key === "objectives" && "📈 "}
                        {key.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
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
                <Text style={styles.label}>🖼️ Main Image</Text>
                {newImage ? (
                    <Image source={{ uri: newImage }} style={styles.imagePreview} />
                ) : groupData.main_image ? (
                    <Image source={{ uri: groupData.main_image }} style={styles.imagePreview} />
                ) : (
                    <Text>No image uploaded.</Text>
                )}
                <TouchableOpacity style={styles.customButton} onPress={() => pickImage(setNewImage)}>
                    <Text style={styles.customButtonText}>Pick/Change Image</Text>
                </TouchableOpacity>
            </View>

            {/* Executive inputs */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>👥 Add Executive</Text>
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
                    <TouchableOpacity style={styles.customButton} onPress={() => pickImage(setExecImage)}>
                        <Text style={styles.customButtonText}>Pick Executive Image</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={[styles.customButton, styles.addExecutiveButton]} onPress={handleAddExecutive}>
                    <Text style={styles.customButtonText}>Add Executive</Text>
                </TouchableOpacity>
            </View>

            {/* Display executives as cards */}
            {groupData.executives.length > 0 && (
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>🧑‍💼 Executives</Text>
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
                            <TouchableOpacity 
                                onPress={() => handleDeleteExecutive(index)} 
                                style={styles.deleteButton}
                                disabled={deletingIndex === index} // Disable button while deleting
                            >
                                {deletingIndex === index ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <FontAwesomeIcon icon={faTrash} size={15} color="white" />
                                )}
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            {saving ? (
                <ActivityIndicator size="large" color="#4338ca" />
            ) : (
                <View style={{ paddingBottom: 30 }}>
                    <TouchableOpacity style={styles.customButton} onPress={handleSave}>
                        <Text style={styles.customButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                </View>
            )}
            </ScrollView>
        </View>
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
        marginBottom: 5,
        color: "#4338ca",
        textAlign: "center",
    },
    description: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 20,
        textAlign: "center",
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
        marginTop: 10,
        color: "#000",
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
    loadingTitle: {
        width: '60%',
        height: 30,
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
        marginBottom: 30,
    },
    loadingLabel: {
        width: '40%',
        height: 20,
        backgroundColor: '#e0e0e0',
        borderRadius: 6,
        marginBottom: 8,
    },
    loadingInput: {
        width: '100%',
        height: 40,
        backgroundColor: '#f0f0f0',
        borderRadius: 6,
    },
    loadingTextArea: {
        width: '100%',
        height: 80,
        backgroundColor: '#f0f0f0',
        borderRadius: 6,
    },
    deleteButton: {
        marginLeft: 'auto',
        backgroundColor: '#ef4444',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    customButton: {
        backgroundColor: '#1f2937',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    customButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    addExecutiveButton: {
        backgroundColor: '#2e4053',
    },
});
