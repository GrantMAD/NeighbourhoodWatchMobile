import React, { useState, useCallback, useRef } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Image,
    TouchableOpacity,
    RefreshControl,
    Modal,
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

    return `${startDate.toLocaleDateString("en-US", optionsDate)}, ${startDate.toLocaleTimeString(
        "en-US",
        optionsTime
    )} - ${endDate.toLocaleDateString("en-US", optionsDate)}, ${endDate.toLocaleTimeString(
        "en-US",
        optionsTime
    )}`;
};

// Modal for event details
const EventModal = ({ visible, onClose, event }) => {
    if (!event) return null;

    const isImageUrl = (str) => typeof str === "string" && str.startsWith("http");

    return (
        <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
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

                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <Text style={styles.modalTitle}>{event.title}</Text>

                        {event.location ? (
                            <View style={styles.modalRow}>
                                <Text style={styles.modalIcon}>📍</Text>
                                <Text style={styles.modalDetailText}>{event.location}</Text>
                            </View>
                        ) : null}

                        <Text style={styles.modalDescription}>{event.message}</Text>

                        {/* UPDATED START/END DATES */}
                        <View style={{ marginBottom: 12 }}>
                            <View style={[styles.modalRow, { alignItems: "flex-start", marginBottom: 12 }]}>
                                <Text style={[styles.modalIcon, { marginTop: 4 }]}>🕒</Text>
                                <View style={{ flexDirection: "column" }}>
                                    <Text style={[styles.modalDetailText, { marginBottom: 2 }]}>
                                        Start: {new Date(event.startDate).toLocaleString("en-US", {
                                            weekday: "long",
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric",
                                            hour: "numeric",
                                            minute: "2-digit",
                                            hour12: true,
                                        })}
                                    </Text>
                                    <Text style={styles.modalDetailText}>
                                        End: {new Date(event.endDate).toLocaleString("en-US", {
                                            weekday: "long",
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric",
                                            hour: "numeric",
                                            minute: "2-digit",
                                            hour12: true,
                                        })}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.modalRow}>
                            <Text style={styles.modalIcon}>👁️</Text>
                            <Text style={styles.modalDetailText}>Views: {event.views || 0}</Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const DayEventsModal = ({ visible, onClose, events, onEventPress }) => {
    if (!events || events.length === 0) return null;

    const isImageUrl = (str) => typeof str === "string" && str.startsWith("http");

    return (
        <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
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
                                    },
                                ]}
                            >
                                {isImageUrl(event.image) ? (
                                    <Image source={{ uri: event.image }} style={styles.dayEventImage} />
                                ) : (
                                    <View style={styles.dayEventEmojiCircle}>
                                        <Text style={styles.dayEventEmoji}>{event.image || "📅"}</Text>
                                    </View>
                                )}
                                <Text style={styles.dayEventText}>{event.title}</Text>
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
    const eventRefs = useRef({});

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

    const onEventPress = (event) => {
        setDayEventsModalVisible(false);
        setSelectedEvent(event);
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
                style={[styles.eventCard, { borderLeftColor: color, borderLeftWidth: 4 }]}
                activeOpacity={0.85}
                onPress={() => setSelectedEvent(event)}
            >
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
                                Start:{" "}
                                {new Date(event.startDate).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                                ,{" "}
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
                                ,{" "}
                                {new Date(event.endDate).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                })}
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

                    <TouchableOpacity
                        style={styles.buttonSecondary}
                        onPress={() => navigation.navigate("AddEventScreen", { 
                            groupId, 
                            onEventAdded: (message) => {
                                setToast({ visible: true, message, type: "success" });
                            }
                        })}
                    >
                        <Text style={styles.buttonSecondaryText}>Add Event</Text>
                    </TouchableOpacity>
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

            <EventModal visible={!!selectedEvent} event={selectedEvent} onClose={() => setSelectedEvent(null)} />

            <DayEventsModal
                visible={isDayEventsModalVisible}
                onClose={() => setDayEventsModalVisible(false)}
                events={dayEvents}
                onEventPress={onEventPress}
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
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    modalContainer: {
        width: "100%",
        maxHeight: "80%",
        backgroundColor: "#1f2937",
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 10,
    },
    closeButton: {
        position: "absolute",
        top: -10,
        right: -10,
        zIndex: 10,
        backgroundColor: "#2563eb",
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: "center",
        alignItems: "center",
    },
    closeButtonText: {
        fontSize: 22,
        color: "#fff",
        lineHeight: 22,
        marginTop: -2, // Adjust as needed for visual centering
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
        backgroundColor: "#374151",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    emoji: {
        fontSize: 72,
    },
    modalContent: {
        paddingBottom: 16,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 12,
    },
    modalRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    modalIcon: {
        fontSize: 22,
        marginRight: 8,
        color: "#9ca3af",
    },
    modalDetailText: {
        color: "#d1d5db",
        fontSize: 14,
        flexShrink: 1,
    },
    modalDescription: {
        color: "#d1d5db",
        fontSize: 16,
        marginBottom: 20,
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
});

export default EventsScreen;
