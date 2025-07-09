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
                                <View style={styles.emojiPlaceholder}>
                                    <Text style={styles.emojiLarge}>🗓️</Text>
                                </View>
                            ) : event.image ? (
                                <Image source={{ uri: event.image }} style={styles.eventImage} />
                            ) : null}

                            <View style={styles.eventTitleContainer}>
                                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                                    <Text style={styles.icon}>🗓️</Text>
                                    <Text style={styles.eventCardTitle}>{event.title}</Text>
                                </View>
                                <Text style={styles.eventDateText}>
                                    {new Date(event.startDate).toLocaleDateString()} -{" "}
                                    {new Date(event.endDate).toLocaleDateString()}
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
        borderRadius: 10,
        backgroundColor: "#1f2937",
        marginBottom: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 7,
    },
    emojiPlaceholder: {
        height: 180,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#374151",
    },
    emojiLarge: {
        fontSize: 100,
    },
    eventImage: {
        width: "100%",
        height: 180,
    },
    eventTitleContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 12,
        backgroundColor: "rgba(31, 41, 55, 0.9)",
    },
    eventCardTitle: {
        color: "#f9fafb",
        fontWeight: "700",
        fontSize: 18,
        marginLeft: 6,
        flexShrink: 1,
    },
    eventDateText: {
        color: "#9ca3af",
        fontSize: 12,
        alignSelf: "center",
    },
    icon: {
        fontSize: 20,
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
