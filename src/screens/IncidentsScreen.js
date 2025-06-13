import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { supabase } from "../../lib/supabase";

const IncidentScreen = ({ navigation, route }) => {
    const { groupId } = route.params;
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedReportIds, setExpandedReportIds] = useState([]);
    const [sortOrder, setSortOrder] = useState("newest");

    const handleAddReport = () => {
        navigation.navigate("AddReportScreen");
    };

    const handleExport = () => {
        console.log("Export logic will go here (PDF or Email)");
    };

    const toggleExpand = (id) => {
        if (expandedReportIds.includes(id)) {
            setExpandedReportIds(expandedReportIds.filter((reportId) => reportId !== id));
        } else {
            setExpandedReportIds([...expandedReportIds, id]);
        }
    };

    const toggleSortOrder = () => {
        setSortOrder(sortOrder === "newest" ? "oldest" : "newest");
    };

    useEffect(() => {
        if (!groupId) return;

        const fetchReports = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("groups")
                .select("reports")
                .eq("id", groupId)
                .single();

            if (error) {
                console.log("Error fetching reports:", error.message);
                setReports([]);
            } else {
                const sorted = [...(data?.reports ?? [])].sort((a, b) => {
                    const aTime = new Date(a.reported_at).getTime();
                    const bTime = new Date(b.reported_at).getTime();
                    return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
                });
                setReports(sorted);
            }
            setLoading(false);
        };

        // Fetch initially on mount and whenever screen is focused
        const unsubscribe = navigation.addListener("focus", () => {
            fetchReports();
        });

        // Also fetch once on mount
        fetchReports();

        return unsubscribe; // Clean up the listener on unmount
    }, [groupId, sortOrder, navigation]);


    const getSeverityColor = (level) => {
        switch (level?.toLowerCase()) {
            case "low":
                return "#10b981"; // Green
            case "medium":
                return "#f59e0b"; // Yellow
            case "high":
                return "#ef4444"; // Red
            default:
                return "#9ca3af"; // Gray
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.heading}>Incident Reports</Text>
            <Text style={styles.description}>
                View and submit incidents reported by community members.
            </Text>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.button} onPress={handleAddReport}>
                    <Text style={styles.buttonText}>Submit Report</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={toggleSortOrder}>
                    <Text style={styles.secondaryButtonText}>
                        Sort: {sortOrder === "newest" ? "Newest First" : "Oldest First"}
                    </Text>
                </TouchableOpacity>
            </View>

            {loading && <Text style={styles.loadingText}>Loading reports...</Text>}

            {!loading && reports.length === 0 && (
                <Text style={styles.emptyText}>No reports found.</Text>
            )}

            {!loading &&
                reports.map((report, index) => {
                    const id = report.id ?? index;
                    const isExpanded = expandedReportIds.includes(id);
                    const severityColor = getSeverityColor(report.severity_tag);
                    return (
                        <View key={id} style={styles.reportCard}>
                            <TouchableOpacity
                                style={[
                                    styles.cardHeader,
                                    isExpanded && styles.cardHeaderExpanded,
                                ]}
                                onPress={() => toggleExpand(id)}
                            >
                                <View style={styles.leftHeaderGroup}>
                                    <Text style={styles.cardArrow}>{isExpanded ? "▼" : "▶"}</Text>
                                    <View style={styles.cardHeaderTextContainer}>
                                        <Text style={styles.cardTitle}>{report.title || "Untitled"}</Text>
                                        <Text style={styles.cardSubtitle}>
                                            {report.date_of_incident
                                                ? new Date(report.date_of_incident).toLocaleDateString()
                                                : "No Date"}
                                        </Text>
                                    </View>
                                </View>

                                <View style={[styles.severityTag, { backgroundColor: severityColor }]}>
                                    <Text style={styles.severityText}>
                                        {report.severity_tag?.toUpperCase() || "N/A"}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {
                                isExpanded && (
                                    <View style={styles.cardBody}>
                                        <Text style={styles.sectionTitle}>Incident Info</Text>
                                        <Text style={styles.reportRow}>
                                            📝 <Text style={styles.label}>Description:</Text> {report.description || "No description"}
                                        </Text>
                                        <Text style={styles.reportRow}>
                                            ⏱️ <Text style={styles.label}>Reported At:</Text> {report.reported_at ? new Date(report.reported_at).toLocaleString() : "N/A"}
                                        </Text>

                                        <Text style={styles.sectionTitle}>Location</Text>
                                        <Text style={styles.reportRow}>
                                            📍 <Text style={styles.label}>Location:</Text> {report.location_of_incident || "Unknown"}
                                        </Text>
                                        <Text style={styles.reportRow}>
                                            🕒 <Text style={styles.label}>Time:</Text> {report.time_of_incident || "N/A"}
                                        </Text>
                                        <Text style={styles.reportRow}>
                                            📅 <Text style={styles.label}>Date of Incident:</Text> {report.date_of_incident ? new Date(report.date_of_incident).toLocaleDateString() : "N/A"}
                                        </Text>

                                        <Text style={styles.sectionTitle}>Reporting Details</Text>
                                        <Text style={styles.reportRow}>
                                            👮 <Text style={styles.label}>Patroller:</Text> {report.patroller_name || "N/A"}
                                        </Text>
                                        <Text style={styles.reportRow}>
                                            🚔 <Text style={styles.label}>Police Ref:</Text> {report.police_reference || "N/A"}
                                        </Text>
                                        <Text style={styles.reportRow}>
                                            🗓️ <Text style={styles.label}>Date of Report:</Text> {report.date_of_report ? new Date(report.date_of_report).toLocaleDateString() : "N/A"}
                                        </Text>
                                    </View>
                                )
                            }
                        </View>
                    );
                })}
        </ScrollView >
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#fff",
        flexGrow: 1,
    },
    heading: {
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 10,
        color: "#1f2937",
        textAlign: "center",
    },
    description: {
        fontSize: 16,
        color: "#4b5563",
        marginBottom: 20,
        textAlign: "center",
    },
    actions: {
        flexDirection: "row",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 20,
    },
    button: {
        backgroundColor: "#2563eb",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    buttonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    secondaryButton: {
        backgroundColor: "#f3f4f6",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    secondaryButtonText: {
        color: "#111827",
        fontSize: 14,
        fontWeight: "500",
    },
    loadingText: {
        textAlign: "center",
        color: "#6b7280",
    },
    emptyText: {
        textAlign: "center",
        color: "#9ca3af",
    },
    reportCard: {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    cardBody: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        backgroundColor: "#1f2937",  
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        borderBottomLeftRadius: 12,   
        borderBottomRightRadius: 12,
    },

    cardHeaderExpanded: {
        borderBottomLeftRadius: 0,   
        borderBottomRightRadius: 0,
    },
    cardArrow: {
        fontSize: 16,
        color: "#d1d5db", 
        fontWeight: "bold",
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#f9fafb", 
    },
    cardSubtitle: {
        fontSize: 12,
        color: "#9ca3af", 
    },
    severityTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    severityText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#2563eb",
        marginTop: 10,
        marginBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: "#e0e7ff",
        paddingBottom: 2,
    },
    leftHeaderGroup: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

});

export default IncidentScreen;
