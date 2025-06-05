import React, { useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

const EventsScreen = ({ route }) => {
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
        }
    };

    // Refetch on screen focus
    useFocusEffect(
        useCallback(() => {
            fetchEvents();
        }, [groupId])
    );

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.mainHeading}>Events</Text>
            <Text style={styles.description}>
                Check out all the latest and upcoming events happening in your group.
            </Text>

            <Text style={styles.header}>Upcoming Events</Text>
            {events.length === 0 ? (
                <Text>No events found.</Text>
            ) : (
                events.map((event, index) => (
                    <View key={index} style={styles.card}>
                        <Text style={styles.title}>{event.title}</Text>
                        <Text style={styles.message}>{event.message}</Text>
                        {event.image && (
                            <Image source={{ uri: event.image }} style={styles.image} />
                        )}
                        <Text style={styles.date}>
                            {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                        </Text>
                    </View>
                ))
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 16 },
    mainHeading: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#222',
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    card: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    title: { fontSize: 16, fontWeight: 'bold' },
    message: { marginTop: 4 },
    image: { height: 200, width: '100%', marginTop: 8, borderRadius: 8 },
    date: { color: 'gray', marginTop: 4 },
});

export default EventsScreen;
