import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
} from "react-native";

import { supabase } from "../../lib/supabase";


const IncidentModal = ({ visible, onClose, report, getSeverityColor }) => {
    const [reporterName, setReporterName] = useState("N/A");

    useEffect(() => {
        const fetchReporterName = async () => {
            if (report && report.reported_by) {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("name")
                    .eq("id", report.reported_by)
                    .single();

                if (error) {
                    console.error("Error fetching reporter name:", error.message);
                    setReporterName("N/A");
                } else if (data) {
                    setReporterName(data.name);
                } else {
                    setReporterName("N/A");
                }
            }
        };

        if (visible) {
            fetchReporterName();
        }
    }, [visible, report]);

    if (!report) return null;

    const severityColor = getSeverityColor(report.severity_tag);

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <ScrollView>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Text style={{ fontSize: 24 }}>⚠️</Text>
                            <Text style={styles.modalTitle}>{report.title || "Untitled"}</Text>
                        </View>
                        <View style={styles.modalHr} />

                        <View style={[styles.severityTag, { backgroundColor: severityColor }]}>
                            <Text style={styles.severityText}>
                                {report.severity_tag?.toUpperCase() || "N/A"}
                            </Text>
                        </View>

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
                            👮 <Text style={styles.label}>Patroller:</Text> {reporterName}
                        </Text>
                        <Text style={styles.reportRow}>
                            🚔 <Text style={styles.label}>Police Ref:</Text> {report.police_reference || "N/A"}
                        </Text>
                        <Text style={styles.reportRow}>
                            🗓️ <Text style={styles.label}>Date of Report:</Text> {report.date_of_report ? new Date(report.date_of_report).toLocaleDateString() : "N/A"}
                        </Text>
                    </ScrollView>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const LoadingState = () => (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.heading}>Incident Reports</Text>
        <Text style={styles.description}>
            View and submit incidents reported by community members.
        </Text>
        <View style={styles.actions}>
            <TouchableOpacity style={styles.button} onPress={() => {}} disabled={true}>
                <Text style={styles.buttonText}>Submit Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => {}} disabled={true}>
                <Text style={styles.secondaryButtonText}>Sort: Date (Newest)</Text>
            </TouchableOpacity>
        </View>
        {[...Array(3)].map((_, i) => (
            <View key={i} style={styles.loadingReportCard} />
        ))}
    </ScrollView>
);

const IncidentScreen = ({ navigation, route }) => {
    const { groupId } = route.params;
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [sortOrder, setSortOrder] = useState("date_newest"); // "date_newest", "date_oldest", "severity_high", "severity_low"
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const handleAddReport = () => {
        navigation.navigate("AddReportScreen");
    };

    const handleExport = () => {
        console.log("Export logic will go here (PDF or Email)");
    };

    const handleSortSelect = (option) => {
        setSortOrder(option);
        setDropdownVisible(false);
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
                let fetchedReports = data?.reports ?? [];

                // Extract unique reporter IDs
                const reporterIds = [...new Set(fetchedReports.map(report => report.reported_by).filter(Boolean))];

                let reporterNamesMap = {};
                if (reporterIds.length > 0) {
                    const { data: profilesData, error: profilesError } = await supabase
                        .from("profiles")
                        .select("id, name")
                        .in("id", reporterIds);

                    if (profilesError) {
                        console.error("Error fetching reporter profiles:", profilesError.message);
                    } else {
                        reporterNamesMap = profilesData.reduce((acc, profile) => {
                            acc[profile.id] = profile.name;
                            return acc;
                        }, {});
                    }
                }

                // Attach reporter names to reports
                fetchedReports = fetchedReports.map(report => ({
                    ...report,
                    reporterName: reporterNamesMap[report.reported_by] || "Unknown Patroller"
                }));

                let sorted = [...fetchedReports];

                if (sortOrder.startsWith("date")) {
                    sorted.sort((a, b) => {
                        const aTime = new Date(a.reported_at).getTime();
                        const bTime = new Date(b.reported_at).getTime();
                        return sortOrder === "date_newest" ? bTime - aTime : aTime - bTime;
                    });
                } else if (sortOrder.startsWith("severity")) {
                    const severityOrder = { "high": 3, "medium": 2, "low": 1 };
                    sorted.sort((a, b) => {
                        const aSeverity = severityOrder[a.severity_tag?.toLowerCase()] || 0;
                        const bSeverity = severityOrder[b.severity_tag?.toLowerCase()] || 0;
                        return sortOrder === "severity_high" ? bSeverity - aSeverity : aSeverity - bSeverity;
                    });
                }
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

    if (loading) {
        return <LoadingState />;
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollViewContent}>
            <Text style={styles.heading}>Incident Reports</Text>
            <Text style={styles.description}>
                View and submit incidents reported by community members.
            </Text>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.button} onPress={handleAddReport}>
                    <Text style={styles.buttonText}>Submit Report</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setDropdownVisible(!dropdownVisible)}>
                    <Text style={styles.secondaryButtonText}>
                        Sort: {
                            sortOrder === "date_newest" ? "Date (Newest)" :
                            sortOrder === "date_oldest" ? "Date (Oldest)" :
                            sortOrder === "severity_high" ? "Severity (High)" :
                            "Severity (Low)"
                        }
                    </Text>
                </TouchableOpacity>
                {dropdownVisible && (
                    <View style={styles.dropdownContainer}>
                        <TouchableOpacity style={styles.dropdownItem} onPress={() => handleSortSelect("date_newest")}>
                            <Text style={styles.dropdownItemText}>Date (Newest)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.dropdownItem} onPress={() => handleSortSelect("date_oldest")}>
                            <Text style={styles.dropdownItemText}>Date (Oldest)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.dropdownItem} onPress={() => handleSortSelect("severity_high")}>
                            <Text style={styles.dropdownItemText}>Severity (High)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.dropdownItem} onPress={() => handleSortSelect("severity_medium")}>
                            <Text style={styles.dropdownItemText}>Severity (Medium)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.dropdownItem} onPress={() => handleSortSelect("severity_low")}>
                            <Text style={styles.dropdownItemText}>Severity (Low)</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {!loading && reports.length === 0 && (
                <Text style={styles.emptyText}>No reports found.</Text>
            )}

            {!loading &&
                reports.map((report, index) => {
                    const id = report.id ?? index;
                    const severityColor = getSeverityColor(report.severity_tag);
                    return (
                        <TouchableOpacity
                            key={id}
                            style={styles.reportCard}
                            onPress={() => setSelectedReport(report)}
                        >
                            <View style={styles.cardHeader}>
                                <View style={styles.leftHeaderGroup}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                        <Text style={{ fontSize: 24 }}>⚠️</Text>
                                        <Text style={styles.cardTitle}>{report.title || "Untitled"}</Text>
                                    </View>
                                    <Text style={styles.cardSubtitle}>
                                        🗓️ Reported on: {report.date_of_incident
                                            ? new Date(report.date_of_incident).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })
                                            : "No Date"}
                                    </Text>
                                    <Text style={styles.cardPatrollerName}>
                                        👮 Added by: {report.reporterName}
                                    </Text>
                                </View>

                                <View style={[styles.severityTag, { backgroundColor: severityColor }]}>
                                    <Text style={styles.severityText}>
                                        {report.severity_tag?.toUpperCase() || "N/A"}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            <IncidentModal
                visible={!!selectedReport}
                onClose={() => setSelectedReport(null)}
                report={selectedReport}
                getSeverityColor={getSeverityColor}
            />
        </ScrollView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#fff",
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
        position: 'relative', // Added for dropdown positioning
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
    scrollViewContent: {
        flexGrow: 1,
        paddingBottom: 80, // Add padding to the bottom
    },
    dropdownContainer: {
        position: 'absolute',
        top: 50,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 1000,
    },
    dropdownItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    dropdownItemText: {
        fontSize: 14,
        color: '#333',
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
        paddingTop: 5,
        marginLeft: 32, // Align with title text
    },
    cardPatrollerName: {
        fontSize: 12,
        color: "#9ca3af",
        marginTop: 2,
        marginLeft: 32, // Adjust this value if needed for perfect alignment
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
        flexDirection: "column",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#1f2937',
        borderRadius: 10,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
        paddingTop: 40, // Make space for the absolute close button
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    closeButton: {
        marginTop: 20,
        backgroundColor: '#2563eb',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#f9fafb',
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#f9fafb',
        paddingTop: 10, 
    },
    modalHr: {
        height: 1,
        backgroundColor: '#4b5563',
        marginVertical: 10,
    },
    reportRow: {
        fontSize: 14,
        color: '#e5e7eb',
        marginBottom: 8,
        lineHeight: 20,
    },
    label: {
        fontWeight: 'bold',
        color: '#d1d5db',
    },
    loadingReportCard: {
        width: '100%',
        height: 120,
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        marginBottom: 16,
    },
});

export default IncidentScreen;
