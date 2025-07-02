import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Image,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

const ManageEventsScreen = ({ route, navigation }) => {
    const { groupId } = route.params;
    const [events, setEvents] = useState([]);

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

    useFocusEffect(
        useCallback(() => {
            fetchEvents();
        }, [groupId])
    );

    const handleDelete = async (eventId) => {
        Alert.alert(
            "Delete Event",
            "Are you sure you want to delete this event?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "OK", onPress: async () => {
                        const { data, error } = await supabase
                            .from('groups')
                            .select('events')
                            .eq('id', groupId)
                            .single();

                        if (error) {
                            Alert.alert("Error", "Failed to fetch events for deletion.");
                            return;
                        }

                        const updatedEvents = data.events.filter(event => event.id !== eventId);

                        const { error: updateError } = await supabase
                            .from('groups')
                            .update({ events: updatedEvents })
                            .eq('id', groupId);

                        if (updateError) {
                            Alert.alert("Error", "Failed to delete event.");
                        } else {
                            setEvents(updatedEvents);
                            Alert.alert("Success", "Event deleted successfully.");
                        }
                    }
                }
            ]
        );
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollViewContent} style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.headingContainer}>
                    <Text style={styles.headingIcon}>🗓️</Text>
                    <Text style={styles.mainHeading}>Manage Events</Text>
                </View>
            </View>

            <Text style={styles.description}>Here you can edit or delete the events for your group.</Text>

            {events.length === 0 ? (
                <Text style={styles.noEventsText}>No events found.</Text>
            ) : (
                events.map((event, index) => {
                    return (
                        <View key={index} style={styles.eventCard}>
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
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={[styles.button, styles.editButton]}
                                    onPress={() => navigation.navigate('AddEventScreen', { groupId, eventToEdit: event })}
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
                    );
                })
            )}
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
        paddingBottom: 80,
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
        bottom: 50,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(31, 41, 55, 0.7)',
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
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 10,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    editButton: {
        backgroundColor: '#2563eb',
    },
    deleteButton: {
        backgroundColor: '#dc2626',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default ManageEventsScreen;
