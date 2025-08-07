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
        <TouchableOpacity
            key={event.id ?? index.toString()}
            style={styles.cardTouchable}
            activeOpacity={0.9}
        >
            <View style={[styles.eventCard, { borderLeftColor: event.color || '#374151' }]}>
                <View style={styles.eventImageContainer}>
                    {event.image && (event.image.startsWith('http://') || event.image.startsWith('https://')) ? (
                        <Image source={{ uri: event.image }} style={styles.eventImage} resizeMode="cover" />
                    ) : (
                        <Text style={styles.eventEmoji}>{event.image || '📅'}</Text>
                    )}
                </View>
                <View style={styles.eventTextContainer}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventTime}>🕒 {formatEventTime(event.startDate, event.endDate)}</Text>
                    <Text style={styles.eventMessage} numberOfLines={2}>{event.message}</Text>
                    <View style={styles.buttonsRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.editButton]}
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
                                <ActivityIndicator size="small" color="#F1F5F9" />
                            ) : (
                                <Text style={styles.buttonText}>Edit</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.deleteButton]}
                            onPress={() => handleDelete(event.id)}
                        >
                            {deletingEventId === event.id ? (
                                <ActivityIndicator size="small" color="#F1F5F9" />
                            ) : (
                                <Text style={styles.buttonText}>Delete</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
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
        marginTop: 20,
    },

    cardTouchable: {
        marginHorizontal: 4,
    },
    eventCard: {
        flexDirection: 'row',
        backgroundColor: '#1f2937',
        borderRadius: 16,
        padding: 12,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 5,
    },
    eventImageContainer: {
        width: 52,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        backgroundColor: '#475569',
    },
    eventEmoji: {
        fontSize: 26,
    },
    eventImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    eventTextContainer: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 4,
    },
    eventTime: {
        fontSize: 14,
        color: '#ffffff',
        marginBottom: 6,
    },
    eventMessage: {
        fontSize: 14,
        color: '#ffffff',
        lineHeight: 20,
    },

    // Section Title
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
    },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1f2937',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginTop: 16,
        elevation: 2, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    dropdownArrow: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },

    // Retained styles
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
        justifyContent: 'flex-end',
        marginTop: 16,
    },
    button: {
        paddingVertical: 6,
        paddingHorizontal: 18,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    editButton: {
        backgroundColor: '#2563EB',
    },
    deleteButton: {
        backgroundColor: '#DC2626',
    },
    buttonText: {
        fontWeight: '600',
        fontSize: 14,
        color: '#F1F5F9',
    },

    // Skeleton styles
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