import React, { useState, useCallback, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Image,
    TouchableOpacity,
    Modal,
    RefreshControl
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";

const EventModal = ({ visible, onClose, event }) => {
    if (!event) return null;

    return (
        <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Floating Close Button */}
                    <TouchableOpacity onPress={onClose} style={styles.closeIconWrapper}>
                        <Text style={styles.closeIcon}>✕</Text>
                    </TouchableOpacity>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalEmoji}>🗓️</Text>
                            <Text style={styles.modalTitle}>{event.title}</Text>
                        </View>

                        <View style={styles.modalDivider} />

                        {event.image === "🗓️" ? (
                            <View style={styles.emojiPlaceholder}>
                                <Text style={styles.emojiLarge}>🗓️</Text>
                            </View>
                        ) : event.image ? (
                            <Image source={{ uri: event.image }} style={styles.modalImage} />
                        ) : null}

                        {event.location ? (
                            <View style={styles.row}>
                                <Text style={styles.icon}>📍</Text>
                                <Text style={styles.modalText}>{event.location}</Text>
                            </View>
                        ) : null}

                        <Text style={styles.modalMessage}>{event.message}</Text>

                        <View style={styles.row}>
                            <Text style={styles.icon}>⏱️</Text>
                            <Text style={styles.modalDate}>
                                {new Date(event.startDate).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                })}{" "}
                                •{" "}
                                {new Date(event.startDate).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                })}{" "}
                                -{" "}
                                {new Date(event.endDate).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                })}
                            </Text>
                        </View>

                        <View style={styles.row}>
                            <Text style={styles.icon}>👁️</Text>
                            <Text style={styles.modalViews}>Views: {event.views || 0}</Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const EventsScreen = ({ route, navigation }) => {
    const { groupId, selectedEvent: initialSelectedEvent } = route.params;
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loadingViews, setLoadingViews] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchEvents = useCallback(async () => {
        const { data, error } = await supabase
            .from("groups")
            .select("events")
            .eq("id", groupId)
            .single();

        if (error) {
            console.error("Error fetching events:", error.message);
        } else if (data?.events) {
            setEvents(data.events);
        }
    }, [groupId]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchEvents();
        setRefreshing(false);
    }, [fetchEvents]);

    const incrementEventViews = async (eventId) => {
        setLoadingViews(true);
        try {
            const { data, error } = await supabase
                .from("groups")
                .select("events")
                .eq("id", groupId)
                .single();

            if (error || !data?.events) return null;

            const eventsCopy = [...data.events];
            const eventIndex = eventsCopy.findIndex((e) => e.id === eventId);
            if (eventIndex === -1) return null;

            eventsCopy[eventIndex].views = (eventsCopy[eventIndex].views || 0) + 1;

            const { error: updateError } = await supabase
                .from("groups")
                .update({ events: eventsCopy })
                .eq("id", groupId);

            if (updateError) return null;

            return eventsCopy[eventIndex].views;
        } catch (err) {
            console.error("Unexpected error updating views:", err);
            return null;
        } finally {
            setLoadingViews(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchEvents();
        }, [fetchEvents])
    );

    useEffect(() => {
        if (initialSelectedEvent) {
            setSelectedEvent(initialSelectedEvent);
        }
    }, [initialSelectedEvent]);

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.headingContainer}>
                    <Text style={styles.headingIcon}>🗓️</Text>
                    <Text style={styles.mainHeading}>Events</Text>
                </View>

                <TouchableOpacity
                    style={styles.buttonSecondary}
                    onPress={() => navigation.navigate("AddEventScreen", { groupId })}
                >
                    <Text style={styles.buttonSecondaryText}>Add Event</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.description}>
                Check out all the latest and upcoming events happening in your group.
            </Text>

            <ScrollView
                contentContainerStyle={{ paddingBottom: 80 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22d3ee" />
                }
            >
                {events.length === 0 ? (
                    <Text style={styles.noEventsText}>No events found.</Text>
                ) : (
                    events.map((event, index) => (
                        <TouchableOpacity
                            key={event.id || index}
                            onPress={async () => {
                                if (loadingViews) return; // avoid spam
                                const updatedViews = await incrementEventViews(event.id);
                                setSelectedEvent(
                                    updatedViews !== null
                                        ? { ...event, views: updatedViews }
                                        : event
                                );
                            }}
                            activeOpacity={0.85}
                            style={styles.eventCard}
                        >
                            {event.image === "🗓️" ? (
                                <View style={styles.emojiPlaceholderSmall}>
                                    <Text style={styles.emojiLargeSmall}>🗓️</Text>
                                </View>
                            ) : event.image ? (
                                <Image source={{ uri: event.image }} style={styles.eventImageSmall} />
                            ) : null}

                            <View style={styles.eventContent}>
                                <View>
                                    <Text style={styles.eventCardTitle}>{event.title}</Text>
                                    <View style={styles.eventCardHr} />
                                    {event.location ? (
                                        <View style={styles.eventRow}>
                                            <Text style={styles.eventIcon}>📍</Text>
                                            <Text style={styles.eventLocation}>{event.location}</Text>
                                        </View>
                                    ) : null}
                                    <Text style={styles.eventDescription} numberOfLines={2}>{event.message}</Text>
                                </View>
                                <Text style={styles.eventDateText}>
                                    🗓️ {new Date(event.startDate).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}, {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            <EventModal
                visible={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                event={selectedEvent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9fafb",
        paddingTop: 40,
        paddingHorizontal: 20,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    headingContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    headingIcon: {
        fontSize: 28,
        marginRight: 8,
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
        fontSize: 15,
        color: "#6b7280",
        textAlign: "center",
        marginBottom: 20,
    },
    noEventsText: {
        fontSize: 16,
        color: "#9ca3af",
        textAlign: "center",
        marginTop: 40,
    },
    eventCard: {
        flexDirection: 'row',
        backgroundColor: "#1f2937",
        borderRadius: 10,
        marginBottom: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 }, // Increased shadow offset
        shadowOpacity: 0.3, // Increased shadow opacity
        shadowRadius: 6, // Increased shadow radius
        elevation: 8, // Increased elevation
        minHeight: 140,
        maxHeight: 140,
        borderWidth: 1, // Added border
        borderColor: "#374151", // Border color
    },
    emojiPlaceholderSmall: {
        width: 100,
        height: '100%', // Take full height of the card
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#374151",
    },
    emojiLargeSmall: {
        fontSize: 50,
    },
    eventImageSmall: {
        width: 100,
        height: '100%', // Take full height of the card
    },
    eventContent: {
        flex: 1,
        padding: 10,
        justifyContent: 'space-between',
    },
    eventCardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#f9fafb",
        marginBottom: 4,
    },
    eventCardHr: {
        height: 1,
        backgroundColor: "#374151",
        marginVertical: 4,
    },
    eventRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    eventIcon: {
        fontSize: 14,
        marginRight: 5,
        color: "#d1d5db",
    },
    eventLocation: {
        fontSize: 14,
        color: "#d1d5db",
    },
    eventDescription: {
        fontSize: 13,
        color: "#e5e7eb",
        marginBottom: 8,
    },
    eventDateText: {
        fontSize: 12,
        color: "#9ca3af",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        paddingHorizontal: 20,
    },
    modalContent: {
        backgroundColor: "#fefefe",
        borderRadius: 16,
        padding: 24,
        maxHeight: "85%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
        position: "relative",
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    closeIconWrapper: {
        position: "absolute",
        top: 16,
        right: 16,
        backgroundColor: "#2563eb",
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#2563eb",
        shadowOpacity: 0.8,
        shadowRadius: 8,
        zIndex: 10,
    },
    closeIcon: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "bold",
        lineHeight: 20,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    modalEmoji: {
        fontSize: 30,
        marginRight: 12,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        flexShrink: 1,
    },
    modalDivider: {
        height: 1,
        backgroundColor: "#e5e7eb",
        marginBottom: 20,
    },
    emojiPlaceholder: {
        height: 200,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#374151",
        borderRadius: 12,
        marginBottom: 16,
    },
    emojiLarge: {
        fontSize: 120,
    },
    modalImage: {
        width: "100%",
        height: 220,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 10,
    },
    modalText: {
        fontSize: 16,
        color: "#374151",
        flexShrink: 1,
    },
    modalMessage: {
        fontSize: 16,
        color: "#1f2937",
        marginBottom: 20,
        lineHeight: 24,
    },
    modalDate: {
        fontSize: 14,
        color: "#6b7280",
        fontStyle: "italic",
    },
    modalViews: {
        fontSize: 14,
        color: "#9ca3af",
    },
});

export default EventsScreen;
