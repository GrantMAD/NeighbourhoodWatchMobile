import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Image,
    TouchableOpacity,
    Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';



const EventModal = ({ visible, onClose, event }) => {
    if (!event) return null;

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
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 24, marginRight: 10 }}>🗓️</Text>
                            <Text style={styles.modalTitle}>{event.title}</Text>
                        </View>
                        <View style={styles.modalHr} />
                        {event.image && (
                            <Image source={{ uri: event.image }} style={styles.modalImage} />
                        )}
                        {event.location && (
                            <View style={styles.row}>
                                <Text style={{ fontSize: 16, marginRight: 6 }}>📍</Text>
                                <Text style={styles.modalLocation}>{event.location}</Text>
                            </View>
                        )}
                        <Text style={styles.modalMessage}>{event.message}</Text>
                        <View style={styles.row}>
                            <Text style={{ fontSize: 14, marginRight: 5 }}>⏱️</Text>
                            <Text style={styles.modalDate}>
                                {new Date(event.startDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}{' '}
                                •{' '}
                                {new Date(event.startDate).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true,
                                })}{' '}
                                -{' '}
                                {new Date(event.endDate).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true,
                                })}
                            </Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={{ fontSize: 14, marginRight: 5 }}>👁️</Text>
                            <Text style={styles.modalViews}>Views: {event.views || 0}</Text>
                        </View>
                    </ScrollView>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const EventsScreen = ({ route, navigation }) => {
    const { groupId } = route.params;
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const fetchEvents = async () => {
        const { data, error } = await supabase
            .from('groups')
            .select('events')
            .eq('id', groupId)
            .single();

        if (data?.events) {
            setEvents(data.events);
        } else if (error) {
            console.error("Error fetching events:", error.message);
        }
    };

    const incrementEventViews = async (eventId) => {
        try {
            const { data, error } = await supabase
                .from("groups")
                .select("events")
                .eq("id", groupId)
                .single();

            if (error) {
                console.error("Error fetching events before updating views:", error.message);
                return null;
            }

            if (!data?.events) return null;

            const eventsCopy = [...data.events];
            const eventIndex = eventsCopy.findIndex((e) => e.id === eventId);
            if (eventIndex === -1) return null;

            eventsCopy[eventIndex].views = (eventsCopy[eventIndex].views || 0) + 1;

            const { error: updateError } = await supabase
                .from("groups")
                .update({ events: eventsCopy })
                .eq("id", groupId);

            if (updateError) {
                console.error("Error updating views:", updateError.message);
                return null;
            }

            return eventsCopy[eventIndex].views;
        } catch (err) {
            console.error("Unexpected error updating views:", err);
            return null;
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchEvents();
        }, [groupId])
    );

    

    return (
        <ScrollView contentContainerStyle={styles.scrollViewContent} style={styles.container}>
            {/* Header styled like NewsScreen */}
            <View style={styles.headerRow}>
                <View style={styles.headingContainer}>
                    <Text style={styles.headingIcon}>🗓️</Text>
                    <Text style={styles.mainHeading}>Events</Text>
                </View>

                <TouchableOpacity
                    style={styles.buttonSecondary}
                    onPress={() => navigation.navigate('AddEventScreen', { groupId })}
                >
                    <Text style={styles.buttonSecondaryText}>Add Event</Text>
                </TouchableOpacity>
            </View>

            {/* Description below header */}
            <Text style={styles.description}>
                Check out all the latest and upcoming events happening in your group.
            </Text>

            {events.length === 0 ? (
                <Text style={styles.noEventsText}>No events found.</Text>
            ) : (
                events.map((event, index) => {
                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={async () => {
                                const updatedViews = await incrementEventViews(event.id);
                                if (updatedViews !== null) {
                                    const updatedEvent = { ...event, views: updatedViews };
                                    setSelectedEvent(updatedEvent);
                                } else {
                                    setSelectedEvent(event);
                                }
                            }}
                            activeOpacity={0.8}
                            style={styles.eventCard}
                        >
                            {event.image && (
                                <Image source={{ uri: event.image }} style={styles.eventImage} />
                            )}
                            <View style={styles.eventTitleContainer}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <Text style={{ fontSize: 18, marginRight: 8 }}>🗓️</Text>
                                    <Text style={styles.eventCardTitle}>{event.title}</Text>
                                </View>
                                <Text style={styles.eventDateText}>
                                    {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })
            )}
            <EventModal
                visible={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                event={selectedEvent}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        paddingTop: 40,
        paddingHorizontal: 20,
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingBottom: 80, // Increased padding to ensure visibility
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headingIcon: {
        marginRight: 8,
    },
    mainHeading: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
    },
    buttonSecondary: {
        backgroundColor: "#22d3ee", // bright cyan background
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 30,
    },
    buttonSecondaryText: {
        color: "#1f2937", // dark text for contrast
        fontWeight: "700",
        fontSize: 16,
    },
    description: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        marginBottom: 16,
    },
    noEventsText: {
        color: '#6b7280',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
    },
    eventCard: {
        borderRadius: 8,
        marginVertical: 6,
        backgroundColor: '#333',
        overflow: 'hidden',
        position: 'relative',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#1f2937',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
        flex: 1,
    },
    dropdown: {
        backgroundColor: '#f3f4f6',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
    },
    dropdownHeading: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 12,
        color: '#333',
        textDecorationLine: 'underline',
    },
    message: {
        fontSize: 14,
        marginBottom: 12,
        color: '#444',
    },
    image: {
        height: 200,
        width: '100%',
        marginBottom: 12,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    date: {
        fontSize: 14,
        color: '#666',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    locationText: {
        color: '#666',
        fontSize: 14,
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
    modalImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalLocation: {
        fontSize: 16,
        color: '#d1d5db',
        marginBottom: 8,
        paddingTop: 8,
    },
    modalMessage: {
        fontSize: 16,
        color: '#e5e7eb',
        marginBottom: 15,
        lineHeight: 22,
    },
    modalDate: {
        fontSize: 14,
        color: '#9ca3af',
        fontStyle: 'italic',
    },
    modalViews: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 5,
    },
    eventImage: {
        width: '100%',
        height: 180,
        borderRadius: 8,
    },
    eventCardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        padding: 10,
    },
    eventTitleContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(31, 41, 55, 0.7)', // Semi-transparent dark background
        padding: 10,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    eventDateText: {
        fontSize: 12,
        color: '#d1d5db',
        fontStyle: 'italic',
    },
});

export default EventsScreen;
