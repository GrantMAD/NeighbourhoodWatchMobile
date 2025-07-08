import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    Alert,
    TouchableOpacity,
    Platform,
    ScrollView,
    StyleSheet,
    ActivityIndicator
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "../../lib/supabase";

const AddReportScreen = ({ navigation, route }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [policeRef, setPoliceRef] = useState("");
    const [timeOfIncident, setTimeOfIncident] = useState("");
    const [location, setLocation] = useState("");
    const [dateOfIncident, setDateOfIncident] = useState(new Date());
    const [dateOfReport, setDateOfReport] = useState(new Date());
    const [showIncidentDatePicker, setShowIncidentDatePicker] = useState(false);
    const [showReportDatePicker, setShowReportDatePicker] = useState(false);
    const [severityTag, setSeverityTag] = useState("");
    const [loading, setLoading] = useState(false);

    const onChangeIncidentDate = (event, selectedDate) => {
        setShowIncidentDatePicker(Platform.OS === "ios");
        if (selectedDate) setDateOfIncident(selectedDate);
    };

    const onChangeReportDate = (event, selectedDate) => {
        setShowReportDatePicker(Platform.OS === "ios");
        if (selectedDate) setDateOfReport(selectedDate);
    };

    const handleAddReport = async () => {
        if (
            !title ||
            !description ||
            !policeRef ||
            !timeOfIncident ||
            !location ||
            !severityTag
        ) {
            Alert.alert("Missing fields", "Please fill in all fields");
            return;
        }

        setLoading(true);  // start spinner

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            const { group_id } = profile;

            const { data: groupData, error } = await supabase
                .from("groups")
                .select("reports")
                .eq("id", group_id)
                .single();

            if (error) {
                Alert.alert("Error", "Could not fetch group");
                setLoading(false);
                return;
            }

            const newReport = {
                id: Date.now().toString(),
                title,
                description,
                police_reference: policeRef,
                time_of_incident: timeOfIncident,
                location_of_incident: location,
                date_of_incident: dateOfIncident.toISOString(),
                date_of_report: dateOfReport.toISOString(),
                severity_tag: severityTag,
                reported_by: user.id,
                reported_at: new Date().toISOString(),
            };

            const updatedReports = [...(groupData.reports || []), newReport];

            const { error: updateError } = await supabase
                .from("groups")
                .update({ reports: updatedReports })
                .eq("id", group_id);

            setLoading(false);

            if (updateError) {
                Alert.alert("Error", "Could not save report");
            } else {
                await notifyGroupUsersAboutNewReport(group_id, newReport.title);
                Alert.alert("Success", "Report added");
                navigation.goBack();
            }
        } catch (e) {
            setLoading(false);
            Alert.alert("Error", "Something went wrong");
            console.error(e);
        }
    };

    function generateUniqueId() {
        return Math.random().toString(36).substr(2, 9);
    }

    async function notifyGroupUsersAboutNewReport(groupId, reportTitle) {
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
                .select("id, notifications")
                .in("id", otherUserIds);

            if (profilesError) throw profilesError;

            const timestamp = new Date().toISOString();
            const notification = {
                id: generateUniqueId(),
                type: "new_report",
                message: `${senderName} added a new report: ${reportTitle}`,
                timestamp,
                read: false,
                avatar_url: senderAvatarUrl,
            };

            const updates = profiles.map(profile => {
                const updatedNotifications = [...(profile.notifications || []), notification];
                return supabase
                    .from("profiles")
                    .update({ notifications: updatedNotifications })
                    .eq("id", profile.id);
            });

            await Promise.all(updates);

        } catch (err) {
            console.error("Error sending new report notification:", err.message);
        }
    }


    const formatDate = (date) => {
        return date.toLocaleDateString();
    };

    const severityColors = {
        Low: "#28a745",
        Medium: "#ffc107",
        High: "#dc3545",
    };

    const handleTimeInput = (text) => {
        let cleaned = text.replace(/[^0-9]/g, "");
        if (cleaned.length > 2) {
            cleaned = cleaned.slice(0, 2) + ":" + cleaned.slice(2, 4);
        }
        if (cleaned.length > 5) {
            cleaned = cleaned.slice(0, 5);
        }
        setTimeOfIncident(cleaned);
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.heading}>Add New Incident Report</Text>
            <Text style={styles.description}>
                Please fill in the details below to report an incident accurately.
            </Text>

            <Text style={styles.label}>Title:</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Enter incident title" />

            <Text style={styles.label}>Description:</Text>
            <TextInput
                style={[styles.input, styles.textarea]}
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="Describe the incident..."
            />

            

            <Text style={styles.label}>Police Reference Number:</Text>
            <TextInput
                style={styles.input}
                value={policeRef}
                onChangeText={setPoliceRef}
                placeholder="e.g., CAS-12345-2023"
            />

            <Text style={styles.label}>Time of Incident:</Text>
            <TextInput
                style={styles.input}
                value={timeOfIncident}
                onChangeText={handleTimeInput}
                placeholder="14:30"
                keyboardType="numeric"
                maxLength={5}
            />

            <Text style={styles.label}>Location of Incident:</Text>
            <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g., 123 Main St, Suburb"
            />

            <Text style={styles.label}>Date of Incident:</Text>
            <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowIncidentDatePicker(true)}
            >
                <Text>{formatDate(dateOfIncident)}</Text>
                <Text>🗓️</Text>
            </TouchableOpacity>
            {showIncidentDatePicker && (
                <DateTimePicker
                    value={dateOfIncident}
                    mode="date"
                    display="default"
                    onChange={onChangeIncidentDate}
                    maximumDate={new Date()}
                />
            )}

            <Text style={styles.label}>Date of Report:</Text>
            <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowReportDatePicker(true)}
            >
                <Text>{formatDate(dateOfReport)}</Text>
                <Text>🗓️</Text>
            </TouchableOpacity>
            {showReportDatePicker && (
                <DateTimePicker
                    value={dateOfReport}
                    mode="date"
                    display="default"
                    onChange={onChangeReportDate}
                    maximumDate={new Date()}
                />
            )}

            <Text style={styles.label}>Severity:</Text>
            <View style={styles.severityContainer}>
                {["Low", "Medium", "High"].map((level) => {
                    const isSelected = severityTag === level;
                    return (
                        <TouchableOpacity
                            key={level}
                            style={[
                                styles.severityButton,
                                {
                                    borderColor: severityColors[level],
                                    backgroundColor: isSelected ? severityColors[level] : "transparent",
                                },
                            ]}
                            onPress={() => setSeverityTag(level)}
                        >
                            <Text
                                style={[
                                    styles.severityText,
                                    { color: isSelected ? "white" : severityColors[level] },
                                ]}
                            >
                                {level}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleAddReport} disabled={loading}>
                <Text style={styles.submitBtnText}>
                    Submit Report
                </Text>
                {loading && (
                    <ActivityIndicator
                        style={{ marginLeft: 10 }}
                        size="small"
                        color="white"
                    />
                )}
            </TouchableOpacity>
        </ScrollView>
    );
};

export default AddReportScreen;

const styles = StyleSheet.create({
    container: { padding: 20 },
    label: { fontWeight: "bold", marginBottom: 5, marginTop: 12 },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    textarea: {
        height: 100,
        textAlignVertical: "top",
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
    submitBtn: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
        flexDirection: "row",         
        justifyContent: "center",
    },
    submitBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    heading: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center",
    },
    description: {
        fontSize: 16,
        color: "#555",
        marginBottom: 20,
        textAlign: "center",
    },
    severityContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 15,
    },
    severityButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderWidth: 2,
        borderRadius: 5,
    },
    severityText: {
        fontWeight: "bold",
        fontSize: 16,
    },
});
