import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Image,
    TouchableOpacity,
    RefreshControl,
    Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";

// Helper functions
const formatDate = (date) =>
    date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatEventRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    return `🕒 ${formatDate(startDate)}, ${formatTime(startDate)} - ${formatTime(endDate)}`;
};

// Modal for event details
const EventModal = ({ visible, onClose, event }) => {
    if (!event) return null;

    const isImageUrl = (str) => typeof str === "string" && str.startsWith("http");

    return (
        <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>

                    {isImageUrl(event.image) ? (
                        <Image source={{ uri: event.image }} style={styles.modalImage} />
                    ) : (
                        <View style={styles.emojiContainer}>
                            <Text style={styles.emoji}>{event.image || "📅"}</Text>
                        </View>
                    )}

                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <Text style={styles.modalTitle}>{event.title}</Text>

                        {event.location ? (
                            <View style={styles.modalRow}>
                                <Text style={styles.modalIcon}>📍</Text>
                                <Text style={styles.modalDetailText}>{event.location}</Text>
                            </View>
                        ) : null}

                        <Text style={styles.modalDescription}>{event.message}</Text>

                        <View style={styles.modalRow}>
                            <Text style={styles.modalIcon}>🕒</Text>
                            <Text style={styles.modalDetailText}>
                                Start: {new Date(event.startDate).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                })}, {new Date(event.startDate).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                })}
                            </Text>
                        </View>

                        <View style={styles.modalRow}>
                            <Text style={styles.modalIcon} />
                            <Text style={styles.modalDetailText}>
                                End: {new Date(event.endDate).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                })}, {new Date(event.endDate).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                })}
                            </Text>
                        </View>

                        <View style={styles.modalRow}>
                            <Text style={styles.modalIcon}>👁️</Text>
                            <Text style={styles.modalDetailText}>Views: {event.views || 0}</Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// Updated SkeletonLoader (to match NewsScreen)
const SkeletonLoader = () => (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollViewContent}>
        {[...Array(3)].map((_, i) => (
            <View key={i} style={styles.loadingEventCard} />
        ))}
    </ScrollView>
);

// Main screen
const EventsScreen = ({ route, navigation }) => {
    const { groupId } = route.params;
    const [events, setEvents] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    const isImageUrl = (str) => typeof str === "string" && str.startsWith("http");

    const fetchEvents = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("groups")
            .select("events")
            .eq("id", groupId)
            .single();

        if (error) {
            console.error("Error fetching events:", error.message);
        } else if (data?.events) {
            const sorted = [...data.events].sort(
                (a, b) => new Date(b.startDate) - new Date(a.startDate)
            );
            setEvents(sorted);
        }
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            fetchEvents();
        }, [groupId])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchEvents();
        setRefreshing(false);
    };

    return (
        <>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollViewContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.headerRow}>
                    <View style={styles.headingContainer}>
                        <Text style={styles.headingIcon}>📅</Text>
                        <Text style={styles.mainHeading}>Events</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.buttonSecondary}
                        onPress={() => navigation.navigate("AddEventScreen", { groupId })}
                    >
                        <Text style={styles.buttonSecondaryText}>Add Event</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.description}>View upcoming events for your group.</Text>

                {loading ? (
                    <SkeletonLoader />
                ) : events.length === 0 ? (
                    <Text style={styles.noEventsText}>No events available.</Text>
                ) : (
                    events.map((event, index) => (
                        <TouchableOpacity
                            key={event.id || index}
                            style={styles.eventCard}
                            activeOpacity={0.85}
                            onPress={() => setSelectedEvent(event)}
                        >
                            <View style={styles.eventImageContainer}>
                                {isImageUrl(event.image) ? (
                                    <Image source={{ uri: event.image }} style={styles.eventImage} />
                                ) : (
                                    <View style={styles.eventEmojiPlaceholder}>
                                        <Text style={styles.eventEmoji}>{event.image || "📅"}</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.eventContent}>
                                <Text style={styles.eventTitle}>{event.title}</Text>
                                <Text style={styles.eventDescription} numberOfLines={3}>
                                    {event.message}
                                </Text>
                                <View style={styles.eventFooter}>
                                    <Text style={styles.eventTime}>
                                        {formatEventRange(event.startDate, event.endDate)}
                                    </Text>
                                    <Text style={styles.eventLocation2}>📍 {event.location || "TBD"}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            <EventModal
                visible={!!selectedEvent}
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: 40,
        paddingHorizontal: 20,
    },
    scrollViewContent: {
        paddingBottom: 80,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    headingContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    headingIcon: {
        marginRight: 8,
        fontSize: 24,
    },
    mainHeading: {
        fontSize: 28,
        fontWeight: "700",
        color: "#111827",
    },
    buttonSecondary: {
        backgroundColor: "#22d3ee",
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 30,
    },
    buttonSecondaryText: {
        color: "#1f2937",
        fontWeight: "700",
        fontSize: 16,
    },
    description: {
        color: "#36393fff",
        fontSize: 14,
        marginBottom: 20,
        fontWeight: "500",
        textAlign: "center",
    },
    noEventsText: {
        color: "#6b7280",
        fontSize: 16,
        textAlign: "center",
        marginTop: 20,
    },
    eventCard: {
        backgroundColor: "#1f2937",
        borderRadius: 12,
        marginBottom: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    eventImageContainer: {
        width: "100%",
        height: 180,
        backgroundColor: "#374151",
        justifyContent: "center",
        alignItems: "center",
    },
    eventImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    eventEmojiPlaceholder: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#374151",
    },
    eventEmoji: {
        fontSize: 80,
    },
    eventContent: {
        padding: 16,
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#ffffff",
        marginBottom: 8,
    },
    eventDescription: {
        fontSize: 14,
        color: "#e5e7eb",
        marginBottom: 12,
        lineHeight: 20,
    },
    eventFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#374151",
        paddingTop: 12,
    },
    eventTime: {
        fontSize: 12,
        color: "#d1d5db",
        flex: 1,
    },
    eventLocation2: {
        fontSize: 12,
        color: "#fff",
        marginBottom: 2,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.8)",
        justifyContent: "center",
        paddingHorizontal: 30,
    },
    modalContainer: {
        backgroundColor: "#1f2937",
        borderRadius: 16,
        paddingTop: 40,
        paddingBottom: 24,
        paddingHorizontal: 24,
        maxHeight: "85%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 15,
        position: "relative",
    },
    closeButton: {
        position: "absolute",
        top: 14,
        right: 14,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "#3b82f6",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#3b82f6",
        shadowOpacity: 0.7,
        shadowRadius: 6,
        zIndex: 10,
    },
    closeButtonText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "700",
        lineHeight: 20,
    },
    modalImage: {
        width: "100%",
        height: 200,
        borderRadius: 12,
        marginBottom: 20,
    },
    emojiContainer: {
        width: "100%",
        height: 200,
        borderRadius: 12,
        backgroundColor: "#374151",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    emoji: {
        fontSize: 72,
    },
    modalContent: {
        paddingBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#f3f4f6",
        marginBottom: 12,
    },
    modalDescription: {
        fontSize: 15,
        lineHeight: 22,
        color: "#d1d5db",
        marginBottom: 24,
    },
    modalRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    modalIcon: {
        fontSize: 18,
        width: 24,
        marginRight: 8,
        textAlign: "center",
        color: "#d1d5db",
    },
    modalDetailText: {
        fontSize: 13,
        color: "#d1d5db",
        flexShrink: 1,
    },
    loadingEventCard: {
        width: '100%',
        height: 180,
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        marginBottom: 16,
    },
});

export default EventsScreen;
