import React, { useState, useCallback, useRef, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Image,
    TouchableOpacity,
    RefreshControl,
    Modal,
    ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import { Calendar } from "react-native-calendars";
import Toast from "../components/Toast";

// Helper functions
const formatFullEventRange = (start, end) => {
    const optionsDate = { weekday: "long", month: "long", day: "numeric", year: "numeric" };
    const optionsTime = { hour: "numeric", minute: "2-digit", hour12: true };

    const startDate = new Date(start);
    const endDate = new Date(end);

    return (
        `Start: ${startDate.toLocaleDateString("en-US", optionsDate)}, ${startDate.toLocaleTimeString("en-US", optionsTime)}\n` +
        `End: ${endDate.toLocaleDateString("en-US", optionsDate)}, ${endDate.toLocaleTimeString("en-US", optionsTime)}`
    );
};

// Modal for event details
const EventModal = ({ visible, onClose, event, onAttend, onNoLongerAttending, isAttending, isProcessing }) => {
    if (!event) return null;

    const isImageUrl = (str) => typeof str === "string" && str.startsWith("http");

    return (
        <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
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

                    <ScrollView>
                        <Text style={styles.modalTitle}>{event.title}</Text>

                        <View style={styles.modalSection}>
                            <Text style={styles.sectionTitle}>About</Text>
                            <Text style={styles.modalDescription}>{event.message}</Text>
                        </View>

                        <View style={styles.modalSection}>
                            <Text style={styles.sectionTitle}>Details</Text>
                            {event.location ? (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailIcon}>📍</Text>
                                    <Text style={styles.label}>Location:</Text>
                                    <Text style={styles.detailText}>{event.location}</Text>
                                </View>
                            ) : null}
                            <View style={styles.detailRow}>
                                <Text style={styles.detailIcon}>🕒</Text>
                                <Text style={styles.label}>Time:</Text>
                                <Text style={styles.detailText}>{formatFullEventRange(event.startDate, event.endDate)}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailIcon}>👁️</Text>
                                <Text style={styles.label}>Views:</Text>
                                <Text style={styles.detailText}>{event.views || 0}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailIcon}>👥</Text>
                                <Text style={styles.label}>Attending:</Text>
                                <Text style={styles.detailText}>{event.attending_count || 0}</Text>
                            </View>
                        </View>

                        {isAttending && (
                            <Text style={styles.attendingText}>You are Attending this event.</Text>
                        )}

                        <View style={styles.actionRow}>
                            {isAttending ? (
                                <TouchableOpacity
                                    style={[styles.button, styles.noLongerAttendingButton, isProcessing && styles.disabledButton]}
                                    onPress={() => onNoLongerAttending(event)}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.buttonText}>No Longer Attending</Text>
                                    )}
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.button, styles.attendButton, isProcessing && styles.disabledButton]}
                                    onPress={() => onAttend(event)}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.buttonText}>Attend</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const DayEventsModal = ({ visible, onClose, events, onEventPress, loadingDayEventId }) => {
    if (!events || events.length === 0) return null;

    const isImageUrl = (str) => typeof str === "string" && str.startsWith("http");

    return (
        <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Events</Text>
                    <ScrollView>
                        {events.map((event, index) => (
                            <TouchableOpacity
                                key={event.id || index}
                                onPress={() => onEventPress(event)}
                                style={[
                                    styles.dayEventContainer,
                                    {
                                        borderLeftWidth: 4,
                                        borderLeftColor: event.color || "#4b5563",
                                        paddingLeft: 12,
                                        justifyContent: "space-between", // distribute title and icon horizontally
                                    },
                                    loadingDayEventId === event.id && styles.dayEventContainerLoading,
                                ]}
                                disabled={loadingDayEventId === event.id}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                                    {isImageUrl(event.image) ? (
                                        <Image source={{ uri: event.image }} style={styles.dayEventImage} />
                                    ) : (
                                        <View style={styles.dayEventEmojiCircle}>
                                            <Text style={styles.dayEventEmoji}>{event.image || "📅"}</Text>
                                        </View>
                                    )}
                                    <Text style={[styles.dayEventText, { marginLeft: 8, flexShrink: 1 }]}>
                                        {event.title}
                                    </Text>
                                </View>

                                {/* Eye icon on the right */}
                                <Text style={{ fontSize: 18, color: "#9ca3af", marginLeft: 10, marginRight: 12 }}>👁️</Text>
                                {loadingDayEventId === event.id && (
                                    <View style={styles.dayEventLoadingOverlay}>
                                        <ActivityIndicator size="large" color="#22d3ee" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
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

const EventsScreen = ({ route, navigation }) => {
    const { groupId } = route.params;
    const [events, setEvents] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [markedDates, setMarkedDates] = useState({});
    const [dayEvents, setDayEvents] = useState([]);
    const [isDayEventsModalVisible, setDayEventsModalVisible] = useState(false);
    const [showEvents, setShowEvents] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
    const [loadingEventId, setLoadingEventId] = useState(null);
    const [loadingDayEventId, setLoadingDayEventId] = useState(null);
    const [attendedEvents, setAttendedEvents] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const eventRefs = useRef({});

    useEffect(() => {
        if (route.params?.toastMessage) {
            setToast({ visible: true, message: route.params.toastMessage, type: "success" });
            navigation.setParams({ toastMessage: null });
        }

        if (route.params?.selectedEvent) {
            const openEventFromParams = async () => {
                const event = route.params.selectedEvent;
                const updatedViews = await incrementEventViews(event.id);
                if (updatedViews !== null) {
                    setSelectedEvent({ ...event, views: updatedViews });
                } else {
                    setSelectedEvent(event);
                }
            };
            openEventFromParams();
            navigation.setParams({ selectedEvent: null });
        }
    }, [route.params?.toastMessage, route.params?.selectedEvent]);

    useFocusEffect(
        useCallback(() => {
            fetchEvents();
            fetchUserAttendedEvents();
            fetchUserRole();
        }, [groupId])
    );

    const fetchUserAttendedEvents = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('attended_events')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error fetching attended_events:', error.message);
                return;
            }

            setAttendedEvents(profile?.attended_events || []);
        } catch (error) {
            console.error('Unexpected error fetching attended_events:', error);
        }
    };

    const fetchUserRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            if (error) {
                console.error('Error fetching user role:', error.message);
            } else if (profile) {
                setUserRole(profile.role);
            }
        }
    };

    const isImageUrl = (str) => typeof str === "string" && str.startsWith("http");

    const fetchEvents = async () => {
        setLoading(true);
        const { data, error } = await supabase.from("groups").select("events").eq("id", groupId).single();

        if (error) {
            console.error("Error fetching events:", error.message);
        } else if (data?.events) {
            const sorted = [...data.events].sort(
                (a, b) => new Date(b.startDate) - new Date(a.startDate)
            );

            const colors = [
                "#ffadad",
                "#ffd6a5",
                "#fdffb6",
                "#caffbf",
                "#9bf6ff",
                "#a0c4ff",
                "#bdb2ff",
                "#ffc6ff",
            ];

            const newMarkedDates = {};

            sorted.forEach((event, index) => {
                const color = colors[index % colors.length];
                event.color = color; // 🔥 Attach color to event directly

                const startDate = new Date(event.startDate);
                const endDate = new Date(event.endDate);

                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    const dateString = d.toISOString().split("T")[0];
                    newMarkedDates[dateString] = {
                        ...newMarkedDates[dateString],
                        periods: [
                            ...(newMarkedDates[dateString]?.periods || []),
                            {
                                startingDay: d.getTime() === startDate.getTime(),
                                endingDay: d.getTime() === endDate.getTime(),
                                color,
                            },
                        ],
                    };
                }
            });

            setEvents(sorted);
            setMarkedDates(newMarkedDates);
        }

        setLoading(false);
    };

    const handleAttendEvent = async (event) => {
        const { id: eventId } = event;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setToast({ visible: true, message: "You must be logged in to attend an event.", type: "error" });
            return;
        }

        setLoadingEventId(eventId);

        try {
            const { data: group, error: fetchError } = await supabase
                .from('groups')
                .select('events')
                .eq('id', groupId)
                .single();

            if (fetchError) throw fetchError;

            const eventToUpdate = group.events.find(e => e.id === eventId);
            if (!eventToUpdate) {
                Alert.alert('Error', 'Event not found.');
                return;
            }

            if (eventToUpdate.attendees && eventToUpdate.attendees.includes(user.id)) {
                setToast({ visible: true, message: 'You are already attending this event.', type: 'info' });
                return;
            }

            const updatedEvent = {
                ...eventToUpdate,
                attendees: [...(eventToUpdate.attendees || []), user.id],
                attending_count: (eventToUpdate.attending_count || 0) + 1,
            };

            const updatedEvents = group.events.map(e => e.id === eventId ? updatedEvent : e);

            const { error: updateError } = await supabase
                .from('groups')
                .update({ events: updatedEvents })
                .eq('id', groupId);

            if (updateError) throw updateError;

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('attended_events')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;

            const updatedAttendedEvents = [...(profile.attended_events || []), eventId];

            const { error: profileUpdateError } = await supabase
                .from('profiles')
                .update({ attended_events: updatedAttendedEvents })
                .eq('id', user.id);

            if (profileUpdateError) throw profileUpdateError;

            setAttendedEvents(updatedAttendedEvents);
            setSelectedEvent(updatedEvent);
            setToast({ visible: true, message: "You are now attending the event!", type: "success" });

        } catch (error) {
            console.error('Error attending event:', error.message);
            Alert.alert('Error', `Failed to attend event: ${error.message}`);
        } finally {
            setLoadingEventId(null);
        }
    };

    const handleNoLongerAttending = async (event) => {
        const { id: eventId } = event;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setToast({ visible: true, message: "You must be logged in to modify your attendance.", type: "error" });
            return;
        }

        setLoadingEventId(eventId);

        try {
            const { data: group, error: fetchError } = await supabase
                .from('groups')
                .select('events')
                .eq('id', groupId)
                .single();

            if (fetchError) throw fetchError;

            const eventToUpdate = group.events.find(e => e.id === eventId);
            if (!eventToUpdate) {
                Alert.alert('Error', 'Event not found.');
                return;
            }

            const updatedEvent = {
                ...eventToUpdate,
                attendees: (eventToUpdate.attendees || []).filter(id => id !== user.id),
                attending_count: Math.max(0, (eventToUpdate.attending_count || 0) - 1),
            };

            const updatedEvents = group.events.map(e => e.id === eventId ? updatedEvent : e);

            const { error: updateError } = await supabase
                .from('groups')
                .update({ events: updatedEvents })
                .eq('id', groupId);

            if (updateError) throw updateError;

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('attended_events')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;

            const updatedAttendedEvents = (profile.attended_events || []).filter(id => id !== eventId);

            const { error: profileUpdateError } = await supabase
                .from('profiles')
                .update({ attended_events: updatedAttendedEvents })
                .eq('id', user.id);

            if (profileUpdateError) throw profileUpdateError;

            setAttendedEvents(updatedAttendedEvents);
            setSelectedEvent(updatedEvent);
            setToast({ visible: true, message: "You are no longer attending the event.", type: "success" });

        } catch (error) {
            console.error('Error updating attendance:', error.message);
            Alert.alert('Error', `Failed to update attendance: ${error.message}`);
        } finally {
            setLoadingEventId(null);
        }
    };

    const incrementEventViews = async (eventId) => {
        try {
            // Get current events from Supabase
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

            // Clone events and find the target event
            const eventsCopy = [...data.events];
            const eventIndex = eventsCopy.findIndex((e) => e.id === eventId);
            if (eventIndex === -1) return null;

            // Increment views safely
            eventsCopy[eventIndex].views = (eventsCopy[eventIndex].views || 0) + 1;

            // Update in Supabase
            const { error: updateError } = await supabase
                .from("groups")
                .update({ events: eventsCopy })
                .eq("id", groupId);

            if (updateError) {
                console.error("Error updating event views:", updateError.message);
                return null;
            }

            // Return new views count
            return eventsCopy[eventIndex].views;
        } catch (err) {
            console.error("Unexpected error updating event views:", err);
            return null;
        }
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

    const onDayPress = (day) => {
        const dayEvents = events.filter((event) => {
            const startDate = new Date(event.startDate).toISOString().split("T")[0];
            const endDate = new Date(event.endDate).toISOString().split("T")[0];
            return day.dateString >= startDate && day.dateString <= endDate;
        });

        if (dayEvents.length > 0) {
            setDayEvents(dayEvents);
            setDayEventsModalVisible(true);
        }
    };

    const onEventPress = async (event) => {
        setLoadingDayEventId(event.id);

        const updatedViews = await incrementEventViews(event.id);

        setDayEventsModalVisible(false);
        if (updatedViews !== null) {
            setSelectedEvent({ ...event, views: updatedViews });
        } else {
            setSelectedEvent(event);
        }
        setLoadingDayEventId(null);
    };

    // Categorize events
    const now = new Date();

    const futureEvents = events.filter((event) => new Date(event.startDate) > now);
    const ongoingEvents = events.filter((event) => {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        return start <= now && now <= end;
    });
    const pastEvents = events.filter((event) => new Date(event.endDate) < now);

    // Helper to render event card, same as your existing event card JSX
    const renderEventCard = (event, index) => {
        const color = event.color || "#4b5563";

        return (
            <TouchableOpacity
                key={event.id || index}
                style={[styles.eventCard, { borderLeftColor: color, borderLeftWidth: 4 }, loadingEventId === event.id && styles.eventCardLoading]}
                activeOpacity={0.85}
                disabled={loadingEventId === event.id}
                onPress={async () => {
                    setLoadingEventId(event.id);
                    const updatedViews = await incrementEventViews(event.id);
                    if (updatedViews !== null) {
                        setSelectedEvent({ ...event, views: updatedViews });
                    } else {
                        setSelectedEvent(event);
                    }
                    setLoadingEventId(null);
                }}
            >
                {loadingEventId === event.id && (
                    <View style={styles.eventCardLoadingOverlay}>
                        <ActivityIndicator size="large" color="#22d3ee" />
                    </View>
                )}
                <View style={styles.eventCardLeft}>
                    {isImageUrl(event.image) ? (
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
                                {formatFullEventRange(event.startDate, event.endDate)}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
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

                    {userRole === 'Admin' && (
                        <TouchableOpacity
                            onPress={() => navigation.navigate("AddEventScreen", {
                                groupId,
                                returnTo: { tab: 'Events' }
                            })}
                        >
                            <Text style={styles.link}>+ Add Event</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={styles.description}>View upcoming events for your group.</Text>
                <Text style={styles.helperText}>Tap on a date with events to view details.</Text>

                <View style={{ backgroundColor: "#ffffff", borderRadius: 12, marginBottom: 20 }}>
                    <Calendar
                        markingType="multi-period"
                        markedDates={markedDates}
                        onDayPress={onDayPress}
                        style={{
                            borderRadius: 12,
                            backgroundColor: "#ffffff", // outer background
                        }}
                        theme={{
                            backgroundColor: "#ffffff",
                            calendarBackground: "#ffffff", // main calendar
                            textSectionTitleColor: "#4b5563",
                            selectedDayBackgroundColor: "#22d3ee",
                            selectedDayTextColor: "#ffffff",
                            todayTextColor: "#22d3ee",
                            dayTextColor: "#111827",
                            textDisabledColor: "#d1d5db",
                            monthTextColor: "#1f2937",
                            arrowColor: "#3b82f6",
                            disabledArrowColor: "#d1d5db",
                            indicatorColor: "#3b82f6",
                            textDayFontWeight: "400",
                            textMonthFontWeight: "700",
                            textDayHeaderFontWeight: "600",
                            textDayFontSize: 16,
                            textMonthFontSize: 18,
                            textDayHeaderFontSize: 14,
                        }}
                    />
                </View>

                {showEvents && (
                    loading ? (
                        <SkeletonLoader />
                    ) : events.length === 0 ? (
                        <Text style={styles.noEventsText}>No events available.</Text>
                    ) : (
                        <>
                            {ongoingEvents.length > 0 && (
                                <>
                                    <Text style={styles.categoryHeading}>Ongoing Events</Text>
                                    {ongoingEvents.map((event, index) => renderEventCard(event, index))}
                                </>
                            )}
                            {futureEvents.length > 0 && (
                                <>
                                    <Text style={styles.categoryHeading}>Future Events</Text>
                                    {futureEvents.map((event, index) => renderEventCard(event, index))}
                                </>
                            )}
                            {pastEvents.length > 0 && (
                                <>
                                    <Text style={styles.categoryHeading}>Past Events</Text>
                                    {pastEvents.map((event, index) => renderEventCard(event, index))}
                                </>
                            )}
                        </>
                    )
                )}

                <View
                    style={{
                        alignSelf: "center",
                        marginBottom: 24,
                        borderRadius: 20,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.4,
                        shadowRadius: 6,
                        elevation: 6, // Android shadow
                    }}
                >
                    <TouchableOpacity
                        onPress={() => setShowEvents(!showEvents)}
                        style={{
                            paddingVertical: 12,
                            paddingHorizontal: 28,
                            borderRadius: 20,
                            backgroundColor: "#1f2937", // Dark background
                            overflow: "hidden", // make sure the button content respects borderRadius
                        }}
                    >
                        <Text
                            style={{
                                color: "#ffffff", // White text
                                fontWeight: "700",
                                fontSize: 16,
                                textAlign: "center",
                            }}
                        >
                            {showEvents ? "Hide Events" : "View All Events"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <EventModal
                visible={!!selectedEvent}
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                onAttend={handleAttendEvent}
                onNoLongerAttending={handleNoLongerAttending}
                isAttending={selectedEvent && attendedEvents.includes(selectedEvent.id)}
                isProcessing={loadingEventId === selectedEvent?.id}
            />

            <DayEventsModal
                visible={isDayEventsModalVisible}
                onClose={() => setDayEventsModalVisible(false)}
                events={dayEvents}
                onEventPress={onEventPress}
                loadingDayEventId={loadingDayEventId}
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
    link: {
        color: '#3b82f6',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonSecondary: {
        backgroundColor: "#1f2937",
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 30,
    },
    buttonSecondaryText: {
        color: "#ffffff",
        fontWeight: "700",
        fontSize: 16,
    },
    description: {
        color: "#36393fff",
        fontSize: 14,
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
        flexDirection: "row",
        backgroundColor: "#1f2937",
        borderRadius: 12,
        marginBottom: 14,
        alignItems: "flex-start",
        height: 120,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 20,
        padding: 20,
        width: "90%",
        maxHeight: "85%",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
        borderWidth: 1,
        borderColor: "#d1d5db",
    },
    closeButton: {
        position: "absolute",
        top: 10,
        right: 10,
        backgroundColor: "rgba(0, 0, 0, 0.1)",
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
    },
    closeButtonText: {
        color: "#000",
        fontSize: 16,
    },
    modalImage: {
        width: "100%",
        height: 180,
        borderRadius: 12,
        marginBottom: 12,
        resizeMode: "cover",
    },
    emojiContainer: {
        width: "100%",
        height: 180,
        borderRadius: 12,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#d1d5db",
    },
    emoji: {
        fontSize: 72,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 15,
    },
    modalSection: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#374151",
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#d1d5db",
        paddingBottom: 5,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    detailIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    label: {
        fontWeight: "bold",
        color: "#4b5563",
        marginRight: 5,
    },
    detailText: {
        fontSize: 14,
        color: "#4b5563",
        flex: 1,
    },
    modalDescription: {
        fontSize: 14,
        color: "#4b5563",
        lineHeight: 20,
    },
    dayEventContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomColor: "#374151",
        borderBottomWidth: 1,
        backgroundColor: "#111827",
        borderRadius: 8,
        marginBottom: 8,
    },
    dayEventImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    dayEventEmojiCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#374151",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    dayEventEmoji: {
        fontSize: 28,
    },
    dayEventText: {
        color: "#fff",
        fontSize: 18,
        flexShrink: 1,
    },
    loadingEventCard: {
        height: 120,
        backgroundColor: "#374151",
        borderRadius: 12,
        marginBottom: 14,
        opacity: 0.7,
    },
    categoryHeading: {
        color: "#9ca3af",
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 8,
        marginTop: 24,
    },
    helperText: {
        color: "#6b7280",
        fontSize: 12,
        fontWeight: "400",
        textAlign: "center",
        marginBottom: 12,
    },
    eventCardLoading: {
        opacity: 0.7,
    },
    eventCardLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    dayEventContainerLoading: {
        opacity: 0.5,
    },
    dayEventLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
        borderTopColor: '#3a3a3a',
        borderTopWidth: 1,
        paddingTop: 12,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 22,
        borderRadius: 8,
        marginLeft: 10,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 90,
    },
    attendButton: { backgroundColor: '#2196F3' },
    noLongerAttendingButton: { backgroundColor: '#d9534f' },
    disabledButton: { opacity: 0.6 },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    attendingText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 14, alignSelf: 'center' },
});

export default EventsScreen;