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
    ScrollView,
    Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../lib/supabase";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";
import { Picker } from '@react-native-picker/picker';

function ProfileScreen() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({
        name: "",
        number: "",
        street: "",
        avatar_url: "",
        emergency_contact: "",
        vehicle_info: "",
        neighbourhoodwatch: [],
        Requests: [],
    });
    const [uploading, setUploading] = useState(false);
    const [avatarLocalUri, setAvatarLocalUri] = useState(null);
    const [joinModalVisible, setJoinModalVisible] = useState(false);
    const [selectedNeighbourhoodWatch, setSelectedNeighbourhoodWatch] = useState(null);
    const [newNeighbourhoodWatchName, setNewNeighbourhoodWatchName] = useState("");
    const [showCreateNewInput, setShowCreateNewInput] = useState(false);
    const [availableNeighbourhoodWatches, setAvailableNeighbourhoodWatches] = useState([]);
    const [hasPendingRequest, setHasPendingRequest] = useState(false);

    useEffect(() => {
        fetchProfile();
        fetchNeighbourhoodWatches();
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
                .select("name, number, street, avatar_url, emergency_contact, vehicle_info, neighbourhoodwatch, Requests")
                .eq("id", user.id)
                .single();

            if (error) throw error;

            setProfile(data);
            // Check for pending neighbourhood watch requests
            const pendingNWRequest = (data.Requests || []).some(
                (req) => req.type === "Neighbourhood watch request" && req.status === "pending"
            );
            setHasPendingRequest(pendingNWRequest);
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    }

    async function fetchNeighbourhoodWatches() {
        try {
            const { data: profilesData, error } = await supabase
                .from('profiles')
                .select('neighbourhoodwatch');

            if (error) throw error;

            let allWatches = [];
            const uniqueWatchIds = new Set();

            profilesData.forEach(profile => {
                if (profile.neighbourhoodwatch && Array.isArray(profile.neighbourhoodwatch)) {
                    profile.neighbourhoodwatch.forEach(watch => {
                        if (!uniqueWatchIds.has(watch.id)) {
                            allWatches.push(watch);
                            uniqueWatchIds.add(watch.id);
                        }
                    });
                }
            });
            setAvailableNeighbourhoodWatches(allWatches);
        } catch (error) {
            console.error("Error fetching neighbourhood watches:", error.message);
            Alert.alert("Error", "Failed to fetch neighbourhood watches.");
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

    async function handleCreateNewNeighbourhoodWatch() {
        if (!newNeighbourhoodWatchName.trim()) {
            Alert.alert("Error", "Neighbourhood Watch name cannot be empty.");
            return;
        }

        setLoading(true);
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw userError || new Error("No user logged in");

            // Fetch current profile to get the existing neighbourhoodwatch array
            const { data: currentProfile, error: fetchError } = await supabase
                .from("profiles")
                .select("neighbourhoodwatch")
                .eq("id", user.id)
                .single();

            if (fetchError) throw fetchError;

            const currentNeighbourhoodWatches = currentProfile.neighbourhoodwatch || [];

            const newWatch = {
                id: Math.random().toString(36).substring(2, 15), // Simple unique ID
                name: newNeighbourhoodWatchName.trim(),
                creator_id: user.id,
                members: [user.id], // Initialize with creator's ID
            };

            const updatedWatches = [...currentNeighbourhoodWatches, newWatch];

            const { error } = await supabase
                .from("profiles")
                .update({ neighbourhoodwatch: updatedWatches })
                .eq("id", user.id);

            if (error) throw error;

            Alert.alert("Success", "Neighbourhood Watch created!");
            setNewNeighbourhoodWatchName("");
            setShowCreateNewInput(false);
            setJoinModalVisible(false); // Close modal after creation
            fetchNeighbourhoodWatches(); // Refresh the list
        } catch (error) {
            Alert.alert("Error creating Neighbourhood Watch", error.message);
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

    async function handleSendJoinRequest() {
        if (!selectedNeighbourhoodWatch) {
            Alert.alert("Error", "Please select a Neighbourhood Watch to join.");
            return;
        }

        setLoading(true);
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw userError || new Error("No user logged in");

            // Get the selected neighbourhood watch details
            const selectedWatch = availableNeighbourhoodWatches.find(
                (nw) => nw.id === selectedNeighbourhoodWatch
            );

            if (!selectedWatch) {
                Alert.alert("Error", "Selected Neighbourhood Watch not found.");
                return;
            }

            // Fetch the creator's profile to update their Requests and notifications
            const { data: creatorProfile, error: creatorError } = await supabase
                .from("profiles")
                .select("Requests, notifications")
                .eq("id", selectedWatch.creator_id)
                .single();

            if (creatorError) throw creatorError;

            const currentRequests = creatorProfile.Requests || [];
            const currentNotifications = creatorProfile.notifications || [];

            const newRequest = {
                id: Math.random().toString(36).substring(2, 15), // Unique ID for the request
                neighbourhoodWatchId: selectedWatch.id,
                neighbourhoodWatchName: selectedWatch.name,
                requesterId: user.id,
                requesterName: profile.name, // Current user's name
                status: "pending",
                timestamp: new Date().toISOString(),
                type: "Neighbourhood watch request", // Add type for identification
            };

            const newNotification = {
                id: Math.random().toString(36).substring(2, 15), // Unique ID for the notification
                type: "neighbourhood_watch_request",
                message: `${profile.name} wants to join ${selectedWatch.name}.`,
                requestId: newRequest.id,
                requesterId: user.id, // Add requesterId
                avatar_url: profile.avatar_url, // Add requester's avatar_url
                neighbourhoodWatchId: selectedWatch.id, // Add neighbourhoodWatchId
                neighbourhoodWatchName: selectedWatch.name, // Add neighbourhoodWatchName
                creatorId: selectedWatch.creator_id, // Add creatorId
                read: false,
                timestamp: new Date().toISOString(),
                actions: [
                    { type: "accept", label: "Accept" },
                    { type: "decline", label: "Decline" },
                ],
            };

            const updatedRequests = [...currentRequests, newRequest];
            const updatedNotifications = [...currentNotifications, newNotification];

            const { error: updateError } = await supabase
                .from("profiles")
                .update({
                    Requests: updatedRequests,
                    notifications: updatedNotifications,
                })
                .eq("id", selectedWatch.creator_id);

            if (updateError) throw updateError;

            // Update the requester's own profile with the pending request
            const { data: requesterProfile, error: fetchRequesterError } = await supabase
                .from("profiles")
                .select("Requests")
                .eq("id", user.id)
                .single();

            if (fetchRequesterError) throw fetchRequesterError;

            const updatedRequesterRequests = [...(requesterProfile.Requests || []), newRequest];

            const { error: updateRequesterError } = await supabase
                .from("profiles")
                .update({ Requests: updatedRequesterRequests })
                .eq("id", user.id);

            if (updateRequesterError) throw updateRequesterError;

            Alert.alert("Success", "Join request sent!");
            setJoinModalVisible(false);
            setSelectedNeighbourhoodWatch(null);
            setHasPendingRequest(true); // Set pending status for the requester
        } catch (error) {
            Alert.alert("Error sending join request", error.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleLeaveNeighbourhoodWatch() {
        Alert.alert(
            "Leave Neighbourhood Watch",
            "Are you sure you want to leave this Neighbourhood Watch?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Leave",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const { data: { user }, error: userError } = await supabase.auth.getUser();
                            if (userError || !user) throw userError || new Error("No user logged in");

                            const currentWatch = profile.neighbourhoodwatch[0];
                            if (!currentWatch) throw new Error("Not in a neighbourhood watch.");

                            // 1. Remove user from the creator's neighbourhoodwatch members array
                            const { data: creatorProfile, error: fetchCreatorError } = await supabase
                                .from("profiles")
                                .select("neighbourhoodwatch")
                                .eq("id", currentWatch.creator_id)
                                .single();

                            if (fetchCreatorError || !creatorProfile) throw fetchCreatorError || new Error("Creator profile not found.");

                            const updatedCreatorWatches = (creatorProfile.neighbourhoodwatch || []).map(nw => {
                                if (nw.id === currentWatch.id) {
                                    const updatedMembers = (nw.members || []).filter(memberId => memberId !== user.id);
                                    return { ...nw, members: updatedMembers };
                                }
                                return nw;
                            });

                            const { error: updateCreatorError } = await supabase
                                .from("profiles")
                                .update({ neighbourhoodwatch: updatedCreatorWatches })
                                .eq("id", currentWatch.creator_id);

                            if (updateCreatorError) throw updateCreatorError;

                            // 2. Clear neighbourhoodwatch from current user's profile
                            const { error: updateUserProfileError } = await supabase
                                .from("profiles")
                                .update({ neighbourhoodwatch: [] })
                                .eq("id", user.id);

                            if (updateUserProfileError) throw updateUserProfileError;

                            Alert.alert("Success", "You have left the Neighbourhood Watch.");
                            fetchProfile(); // Refresh profile data
                        } catch (error) {
                            Alert.alert("Error", error.message);
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
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

            <Text style={styles.inputHeading}>👤 Name</Text>
            <TextInput
                style={styles.input}
                placeholder="Name"
                value={profile.name}
                onChangeText={(text) => setProfile({ ...profile, name: text })}
            />
            <Text style={styles.inputHeading}>📞 Number</Text>
            <TextInput
                style={styles.input}
                placeholder="Number"
                keyboardType="phone-pad"
                value={profile.number}
                onChangeText={(text) => setProfile({ ...profile, number: text })}
            />
            <Text style={styles.inputHeading}>🆘 Emergency Contact</Text>
            <TextInput
                style={styles.input}
                placeholder="Emergency Contact"
                value={profile.emergency_contact}
                onChangeText={(text) => setProfile({ ...profile, emergency_contact: text })}
            />
            <Text style={styles.inputHeading}>🏠 Street</Text>
            <TextInput
                style={styles.input}
                placeholder="Street"
                value={profile.street}
                onChangeText={(text) => setProfile({ ...profile, street: text })}
            />

            <Text style={styles.inputHeading}>🏘️ Your Neighbourhood Watch</Text>
            {profile.neighbourhoodwatch && profile.neighbourhoodwatch.length > 0 ? (
                <View style={styles.neighbourhoodWatchDisplay}>
                    <Text style={styles.neighbourhoodWatchText}>
                        {profile.neighbourhoodwatch[0].name}
                    </Text>
                    <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveNeighbourhoodWatch}>
                        <Text style={styles.leaveButtonText}>Leave</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <Text style={styles.noNeighbourhoodWatchText}>
                    You are currently not in a neighbourhood watch.
                </Text>
            )}

            {(!profile.neighbourhoodwatch || profile.neighbourhoodwatch.length === 0) && (
                hasPendingRequest ? (
                    <Text style={styles.pendingRequestText}>Request pending...</Text>
                ) : (
                    <TouchableOpacity style={styles.actionButton} onPress={() => setJoinModalVisible(true)}>
                        <Text style={styles.actionButtonText}>Join NeighbourhoodWatch</Text>
                    </TouchableOpacity>
                )
            )}

            <Text style={styles.inputHeading}>🚗 Vehicle Info</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g., Blue Honda Civic, License: NW1234"
                value={profile.vehicle_info}
                onChangeText={(text) => setProfile({ ...profile, vehicle_info: text })}
            />

            <TouchableOpacity style={styles.actionButton} onPress={updateProfile}>
                <Text style={styles.actionButtonText}>Save Profile</Text>
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={joinModalVisible}
                onRequestClose={() => setJoinModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setJoinModalVisible(false)}>
                            <Text style={styles.closeButtonText}>X</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Neighbourhood Selection</Text>
                        <Text style={styles.modalText}>You can join or create neighbourhood watches here.</Text>

                        <Picker
                            selectedValue={selectedNeighbourhoodWatch}
                            style={styles.picker}
                            onValueChange={(itemValue, itemIndex) =>
                                setSelectedNeighbourhoodWatch(itemValue)
                            }>
                            <Picker.Item key="select-placeholder" label="Select" value={null} />
                            {availableNeighbourhoodWatches.length > 0 ? (
                                availableNeighbourhoodWatches.map((nw) => (
                                    <Picker.Item key={nw.id} label={nw.name} value={nw.id} />
                                ))
                            ) : (
                                <Picker.Item key="no-watches-placeholder" label="No Neighbourhood Watches available" value={null} />
                            )}
                        </Picker>

                        {selectedNeighbourhoodWatch && (
                            <TouchableOpacity style={[styles.modalButton, styles.joinButton]} onPress={handleSendJoinRequest}>
                                <Text style={styles.modalButtonText}>Send Join Request</Text>
                            </TouchableOpacity>
                        )}

                        {showCreateNewInput ? (
                            <View style={styles.createNewContainer}>
                                <TextInput
                                    style={[styles.input, styles.modalInput]}
                                    placeholder="New Neighbourhood Watch Name"
                                    placeholderTextColor="#9CA3AF"
                                    value={newNeighbourhoodWatchName}
                                    onChangeText={setNewNeighbourhoodWatchName}
                                />
                                <TouchableOpacity style={styles.modalButton} onPress={handleCreateNewNeighbourhoodWatch}>
                                    <Text style={styles.modalButtonText}>Save New Watch</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.modalButton} onPress={() => setShowCreateNewInput(true)}>
                                <Text style={styles.modalButtonText}>Create Neighbourhood Watch</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>
        </ScrollView>
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
    inputHeading: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
        marginTop: 10,
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
    neighbourhoodWatchText: {
        fontSize: 16,
        color: "#333",
        marginBottom: 15,
    },
    noNeighbourhoodWatchText: {
        fontSize: 16,
        color: "#888",
        fontStyle: "italic",
        marginBottom: 15,
    },
    pendingRequestText: {
        fontSize: 16,
        color: "#f97316",
        fontStyle: "italic",
        marginBottom: 15,
        textAlign: "center",
    },
    actionButton: {
        backgroundColor: "#14b8a6", 
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
        marginBottom: 60, // Increased margin to push button further above navigation
    },
    actionButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22,
    },
    modalView: {
        margin: 20,
        backgroundColor: "#1f2937",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
        marginBottom: 15,
    },
    modalText: {
        marginBottom: 15,
        textAlign: "center",
        color: "white",
    },
    picker: {
        width: 200,
        height: 50,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "#ccc",
        backgroundColor: 'white',
        color: 'black',
    },
    neighbourhoodWatchDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    leaveButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
    },
    leaveButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    modalButton: {
        backgroundColor: "#14b8a6",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
        width: '90%',
    },
    modalButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    joinButton: {
        backgroundColor: "#f97316",
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        backgroundColor: '#374151',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    createNewContainer: {
        width: '100%',
        alignItems: 'center',
        marginTop: 10,
    },
    modalInput: {
        backgroundColor: '#374151',
        color: 'white',
        borderColor: '#4B5563',
        width: '90%',
    },
});

export default ProfileScreen;