import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Image,
    Alert,
    TouchableOpacity,
    LayoutAnimation,
    Platform,
    UIManager,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import Icon from 'react-native-vector-icons/FontAwesome';
import Toast from "../components/Toast";

const ManageEventsScreen = ({ route, navigation }) => {
    if (Platform.OS === 'android') {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    const { groupId } = route.params;
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

    const [editingEventId, setEditingEventId] = useState(null);
    const [deletingEventId, setDeletingEventId] = useState(null);

    const [ongoingExpanded, setOngoingExpanded] = useState(true);
    const [futureExpanded, setFutureExpanded] = useState(true);
    const [pastExpanded, setPastExpanded] = useState(false);

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
            if (route.params?.toastMessage) {
                setToast({ visible: true, message: route.params.toastMessage, type: "success" });
                navigation.setParams({ toastMessage: null });
            }
            setEditingEventId(null); // Reset editing state when screen gains focus
            fetchEvents();
        }, [groupId, route.params?.toastMessage])
    );

    const handleDelete = async (eventId) => {
        Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'OK',
                onPress: async () => {
                    setDeletingEventId(eventId);
                    const { data, error } = await supabase
                        .from('groups')
                        .select('events')
                        .eq('id', groupId)
                        .single();

                    if (error) {
                        setToast({ visible: true, message: "Error: Failed to fetch events for deletion.", type: "error" });
                        setDeletingEventId(null);
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
                    setDeletingEventId(null);
                },
            },
        ]);
    };

    const formatEventTime = (start, end) => {
        const optionsDate = { month: 'short', day: 'numeric' };
        const optionsTime = { hour: 'numeric', minute: '2-digit' };

        const startDate = new Date(start);
        const endDate = new Date(end);

        const dateStr = startDate.toLocaleDateString('en-US', optionsDate);
        const startTime = startDate.toLocaleTimeString('en-US', optionsTime);
        const endTime = endDate.toLocaleTimeString('en-US', optionsTime);

        return `${dateStr}, ${startTime} - ${endTime}`;
    };

    const renderEventCard = (event, index) => (
        <View key={event.id ?? index.toString()} style={[styles.newsCard, { borderLeftColor: event.color || '#374151' }]}>
            {event.image && (event.image.startsWith('http://') || event.image.startsWith('https://')) ? (
                <Image source={{ uri: event.image }} style={styles.newsImage} resizeMode="cover" />
            ) : (
                <View style={[styles.placeholderImage, {backgroundColor: '#1f2937'}]}>
                    <Icon name={event.image || "shield"} size={60} color="#fff" />
                </View>
            )}
            <View style={styles.newsContent}>
                <Text style={styles.newsTitle}>{event.title}</Text>
                <Text style={styles.newsDate}>🕒 {formatEventTime(event.startDate, event.endDate)}</Text>
                <Text style={styles.newsStory} numberOfLines={3}>{event.message}</Text>
                <View style={styles.buttonsRow}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => {
                            setEditingEventId(event.id);
                            requestAnimationFrame(() => {
                                navigation.navigate('AddEventScreen', {
                                    groupId,
                                    eventToEdit: event,
                                    returnTo: { screen: 'ManageEventsScreen' }
                                });
                            });
                        }}
                    >
                        {editingEventId === event.id ? (
                            <ActivityIndicator size="small" color="#2563EB" />
                        ) : (
                            <>
                                <Text style={styles.editIcon}>✏️</Text>
                                <Text style={[styles.buttonText, { color: '#2563EB' }]}>Edit</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleDelete(event.id)}
                    >
                        {deletingEventId === event.id ? (
                            <ActivityIndicator size="small" color="#DC2626" />
                        ) : (
                            <>
                                <Text style={styles.deleteIcon}>🗑️</Text>
                                <Text style={[styles.buttonText, { color: '#DC2626' }]}>Delete</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );


    const now = new Date();

    const ongoingEvents = events
        .filter(event => new Date(event.startDate) <= now && new Date(event.endDate) >= now)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    const futureEvents = events
        .filter(event => new Date(event.startDate) > now)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    const pastEvents = events
        .filter(event => new Date(event.endDate) < now)
        .sort((a, b) => new Date(b.endDate) - new Date(a.endDate)); // Most recent past first

    const renderSection = (title, eventsList, isExpanded, setExpanded) => {
        let emoji = '';
        if (title === "Ongoing Events") {
            emoji = '🟢 ';
        } else if (title === "Upcoming Events") {
            emoji = '🗓️ ';
        } else if (title === "Past Events") {
            emoji = '🗄️ ';
        }

        return (
            <View>
                <TouchableOpacity onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setExpanded(!isExpanded);
                }} style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{emoji}{title}</Text>
                    <Text style={styles.dropdownArrow}>{isExpanded ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {isExpanded && (
                    <View>
                        {eventsList.length === 0 ? (
                            <Text style={styles.noEventsText}>No {title.toLowerCase()} found.</Text>
                        ) : (
                            eventsList.map((event, index) => renderEventCard(event, index))
                        )}
                    </View>
                )}
            </View>
        );
    };

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
                    <>
                        {renderSection("Ongoing Events", ongoingEvents, ongoingExpanded, setOngoingExpanded)}
                        {renderSection("Upcoming Events", futureEvents, futureExpanded, setFutureExpanded)}
                        {renderSection("Past Events", pastEvents, pastExpanded, setPastExpanded)}
                    </>
                )}
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollViewContent: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingBottom: 80,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
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
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 24,
    },
    noEventsText: {
        color: '#64748b',
        fontSize: 18,
        textAlign: 'center',
        marginTop: 20,
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginTop: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#212529',
    },
    dropdownArrow: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
    },
    newsCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        marginVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        borderLeftWidth: 4,
        overflow: 'hidden',
    },
    newsImage: {
        width: '100%',
        height: 180,
    },
    placeholderImage: {
        width: '100%',
        height: 180,
        backgroundColor: '#e9ecef',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderEmoji: {
        fontSize: 60,
        opacity: 0.5,
    },
    newsContent: {
        padding: 16,
    },
    newsTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 8,
    },
    newsDate: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 12,
    },
    newsStory: {
        fontSize: 16,
        color: '#495057',
        lineHeight: 24,
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
        paddingTop: 12,
    },
    iconButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 20,
    },
    editIcon: {
        fontSize: 18,
        marginRight: 6,
    },
    deleteIcon: {
        fontSize: 18,
        marginRight: 6,
    },
    buttonText: {
        fontWeight: '600',
        fontSize: 16,
    },
});


export default ManageEventsScreen;