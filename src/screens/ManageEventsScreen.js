import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Image,
    Alert,
    TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import Toast from "../components/Toast";

const ManageEventsScreen = ({ route, navigation }) => {
    const { groupId } = route.params;
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

    const fetchEvents = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('groups')
            .select('events')
            .eq('id', groupId)
            .single();

        if (data?.events) {
            const colors = [
                "#ffadad", "#ffd6a5", "#fdffb6", "#caffbf",
                "#9bf6ff", "#a0c4ff", "#bdb2ff", "#ffc6ff",
            ];
            const eventsWithColors = data.events.map((event, index) => ({
                ...event,
                color: colors[index % colors.length],
            }));
            setEvents(eventsWithColors);
        } else if (error) {
            console.error('Error fetching events:', error.message);
            setToast({ visible: true, message: "Error fetching events: " + error.message, type: "error" });
        }
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            fetchEvents();
        }, [groupId])
    );

    const handleDelete = async (eventId) => {
        Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'OK',
                onPress: async () => {
                    const { data, error } = await supabase
                        .from('groups')
                        .select('events')
                        .eq('id', groupId)
                        .single();

                    if (error) {
                        setToast({ visible: true, message: "Error: Failed to fetch events for deletion.", type: "error" });
                        return;
                    }

                    const updatedEvents = data.events.filter((event) => event.id !== eventId);

                    const { error: updateError } = await supabase
                        .from('groups')
                        .update({ events: updatedEvents })
                        .eq('id', groupId);

                    if (updateError) {
                        setToast({ visible: true, message: "Error: Failed to delete event.", type: "error" });
                    } else {
                        setEvents(updatedEvents);
                        setToast({ visible: true, message: "Event deleted successfully.", type: "success" });
                    }
                },
            },
        ]);
    };

    // Skeleton card styled like MembersScreen loading placeholders
    const SkeletonCard = () => (
        <View style={styles.skeletonCard}>
            <View style={styles.skeletonImage} />
            <View style={styles.skeletonContent}>
                <View style={styles.skeletonTitle} />
                <View style={styles.skeletonDateRow} />
                <View style={styles.skeletonButtonsRow}>
                    <View style={styles.skeletonButton} />
                    <View style={styles.skeletonButton} />
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <ScrollView contentContainerStyle={styles.scrollViewContent} style={styles.container}>
                <View style={styles.headerRow}>
                    <View style={styles.headingContainer}>
                        <Text style={styles.headingIcon}>🗓️</Text>
                        <Text style={styles.mainHeading}>Manage Events</Text>
                    </View>
                </View>

                <Text style={styles.description}>Loading events...</Text>

                {[...Array(3)].map((_, idx) => (
                    <SkeletonCard key={idx} />
                ))}
            </ScrollView>
        );
    }

    return (
        <>
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast({ ...toast, visible: false })}
            />
            <ScrollView contentContainerStyle={styles.scrollViewContent} style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.headingContainer}>
                    <Text style={styles.headingIcon}>🗓️</Text>
                    <Text style={styles.mainHeading}>Manage Events</Text>
                </View>
            </View>

            <Text style={styles.description}>Edit or delete your group’s events below.</Text>

            {events.length === 0 ? (
                <Text style={styles.noEventsText}>No events found.</Text>
            ) : (
                events.map((event, index) => (
                    <TouchableOpacity
                        key={event.id ?? index.toString()}
                        style={[styles.eventCard, { borderLeftColor: event.color || "#4b5563", borderLeftWidth: 4 }]} // Assuming event.color is set like in EventsScreen
                        activeOpacity={0.85}
                    >
                        <View style={styles.eventCardLeft}>
                            {event.image && event.image !== '🗓️' ? (
                                <Image source={{ uri: event.image }} style={styles.eventCardImage} />
                            ) : (
                                <View style={styles.eventCardEmojiCircle}>
                                    <Text style={styles.eventCardEmoji}>{event.image || "📅"}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.eventCardRight}>
                            <View style={{ marginBottom: 8 }}>
                                <Text style={styles.eventTitle}>{event.title}</Text>
                                {event.location ? (
                                    <Text style={styles.eventLocation}>📍 {event.location}</Text>
                                ) : null}
                            </View>
                            <View style={styles.eventMetaContainer}>
                                <Text style={styles.eventIcon}>🕒</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.eventDateText}>
                                        Start:{" "}
                                        {new Date(event.startDate).toLocaleDateString("en-US", {
                                            weekday: "long",
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                        ,{", "}
                                        {new Date(event.startDate).toLocaleTimeString("en-US", {
                                            hour: "numeric",
                                            minute: "2-digit",
                                            hour12: true,
                                        })}
                                    </Text>
                                    <Text style={styles.eventDateText}>
                                        End:{" "}
                                        {new Date(event.endDate).toLocaleDateString("en-US", {
                                            weekday: "long",
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                        ,{", "}
                                        {new Date(event.endDate).toLocaleTimeString("en-US", {
                                            hour: "numeric",
                                            minute: "2-digit",
                                            hour12: true,
                                        })}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.buttonsRow}>
                                <TouchableOpacity
                                    style={[styles.button, styles.editButton]}
                                    onPress={() => navigation.navigate('AddEventScreen', { 
                                        groupId, 
                                        eventToEdit: event, 
                                        onEventUpdated: (message) => {
                                            setToast({ visible: true, message, type: "success" });
                                        }
                                    })}
                                >
                                    <Text style={styles.buttonText}>Edit</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.button, styles.deleteButton]}
                                    onPress={() => handleDelete(event.id)}
                                >
                                    <Text style={styles.buttonText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))
            )}
        </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 40,
        paddingHorizontal: 20,
    },
    scrollViewContent: {
        paddingBottom: 80,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    headingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headingIcon: {
        fontSize: 28,
        marginRight: 12,
    },
    mainHeading: {
        fontSize: 30,
        fontWeight: '700',
        color: '#000',
    },
    description: {
        fontSize: 16,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 24,
    },
    noEventsText: {
        color: '#64748b',
        fontSize: 18,
        textAlign: 'center',
        marginTop: 60,
    },

    // Card styles
    eventCard: {
        flexDirection: "row",
        backgroundColor: "#1f2937",
        borderRadius: 12,
        marginBottom: 14,
        alignItems: "flex-start",
        height: 160,
        padding: 12,
    },
    eventCardLeft: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 14,
        overflow: "hidden",
        backgroundColor: "#374151",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 6,
        borderWidth: 2,
        borderColor: "#4b5563",
    },
    eventCardImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        resizeMode: "cover",
    },
    eventCardEmojiCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#374151",
        justifyContent: "center",
        alignItems: "center",
    },
    eventCardEmoji: {
        fontSize: 30,
    },
    eventCardRight: {
        flex: 1,
        justifyContent: "space-between",
    },
    eventTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#fff",
    },
    eventLocation: {
        fontSize: 14,
        fontWeight: "600",
        color: "#9ca3af",
    },
    eventMetaContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    eventIcon: {
        fontSize: 22,
        marginRight: 8,
        color: "#9ca3af",
    },
    eventDateText: {
        color: "#d1d5db",
        fontSize: 12,
    },
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 10,
    },
    cardImage: {
        width: '100%',
        height: 160,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    noImage: {
        backgroundColor: '#475569',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noImageText: {
        color: '#94a3b8',
        fontSize: 16,
        fontWeight: '600',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    cardContent: {
        padding: 16,
        backgroundColor: 'rgba(31, 41, 55, 0.9)',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    dateIcon: {
        fontSize: 18,
        color: '#60a5fa',
        marginRight: 6,
    },
    dateText: {
        fontSize: 15,
        color: '#cbd5e1',
        fontWeight: '500',
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 12,
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 24,
        borderRadius: 30,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 6,
        marginRight: 12,
    },
    buttonPressed: {
        opacity: 0.75,
        transform: [{ scale: 0.95 }],
    },
    editButton: {
        borderColor: '#2563eb',
        backgroundColor: 'transparent',
    },
    deleteButton: {
        borderColor: '#dc2626',
        backgroundColor: 'transparent',
    },
    buttonText: {
        fontWeight: '600',
        fontSize: 16,
        color: '#e0e7ff',
    },

    // Skeleton styles matching MembersScreen
    skeletonCard: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        marginBottom: 20,
        overflow: 'hidden',
    },
    skeletonImage: {
        width: '100%',
        height: 160,
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
    },
    skeletonContent: {
        padding: 16,
        backgroundColor: '#f9f9f9',
    },
    skeletonTitle: {
        width: '70%',
        height: 24,
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
        marginBottom: 12,
    },
    skeletonDateRow: {
        width: '50%',
        height: 18,
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
        marginBottom: 16,
    },
    skeletonButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    skeletonButton: {
        width: 80,
        height: 32,
        backgroundColor: '#e0e0e0',
        borderRadius: 30,
        marginRight: 12,
    },
    emojiContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#475569',
    },
    emoji: {
        fontSize: 64,
        color: '#94a3b8',
    },
});

export default ManageEventsScreen;
