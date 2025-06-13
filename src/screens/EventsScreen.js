import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Image,
    TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronDown, faChevronUp, faCalendarAlt, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';

const EventsScreen = ({ route, navigation }) => {
    const { groupId } = route.params;
    const [events, setEvents] = useState([]);
    const [expandedEventIndexes, setExpandedEventIndexes] = useState([]);

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

    const toggleExpand = (index) => {
        setExpandedEventIndexes((prev) =>
            prev.includes(index)
                ? prev.filter((i) => i !== index)
                : [...prev, index]
        );
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header styled like NewsScreen */}
            <View style={styles.headerRow}>
                <View style={styles.headingContainer}>
                    <FontAwesome name="calendar" size={28} color="#111827" style={styles.headingIcon} />
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
                    const isExpanded = expandedEventIndexes.includes(index);
                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => toggleExpand(index)}
                            activeOpacity={0.8}
                            style={styles.eventCard}
                        >
                            <View style={styles.mainRow}>
                                <FontAwesomeIcon
                                    icon={faCalendarAlt}
                                    size={18}
                                    color="#fff"
                                    style={{ marginRight: 8 }}
                                />
                                <Text style={styles.title}>{event.title}</Text>
                                <FontAwesomeIcon
                                    icon={isExpanded ? faChevronUp : faChevronDown}
                                    size={18}
                                    color="#fff"
                                />
                            </View>

                            {isExpanded && (
                                <View style={styles.dropdown}>
                                    <Text style={styles.dropdownHeading}>Event Details</Text>
                                    {event.location && (
                                        <View style={styles.row}>
                                            <FontAwesomeIcon icon={faMapMarkerAlt} size={16} color="#666" style={{ marginRight: 6 }} />
                                            <Text style={styles.locationText}>{event.location}</Text>
                                        </View>
                                    )}
                                    <Text style={styles.message}>{event.message}</Text>
                                    {event.image && (
                                        <Image source={{ uri: event.image }} style={styles.image} />
                                    )}
                                    <Text style={styles.date}>
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
                            )}
                        </TouchableOpacity>
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
        borderColor: '#111827',
        borderWidth: 2,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 30,
    },
    buttonSecondaryText: {
        color: '#111827',
        fontWeight: '600',
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
});

export default EventsScreen;
