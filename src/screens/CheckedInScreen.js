import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    ActivityIndicator,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

const CheckedInScreen = () => {
    const [checkedInUsers, setCheckedInUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedUserId, setExpandedUserId] = useState(null);
    const [checkInExpanded, setCheckInExpanded] = useState({});
    const [checkOutExpanded, setCheckOutExpanded] = useState({});

    const fetchCheckedInUsers = async () => {
        const { data, error } = await supabase
            .from("profiles")
            .select("id, name, avatar_url, checked_in, check_in_time, check_out_time");

        if (error) {
            console.error("Error fetching profiles:", error);
            return [];
        }

        return data?.filter((user) => user.checked_in === true) || [];
    };

    const loadUsers = async () => {
        setLoading(true);
        const users = await fetchCheckedInUsers();
        setCheckedInUsers(users);
        setLoading(false);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        const users = await fetchCheckedInUsers();
        setCheckedInUsers(users);
        setRefreshing(false);
    }, []);

    const toggleExpand = (userId) => {
        setExpandedUserId(expandedUserId === userId ? null : userId);
    };

    const toggleCheckIn = (userId) => {
        setCheckInExpanded((prev) => ({
            ...prev,
            [userId]: !prev[userId],
        }));
    };

    const toggleCheckOut = (userId) => {
        setCheckOutExpanded((prev) => ({
            ...prev,
            [userId]: !prev[userId],
        }));
    };

    const groupByDayWithDate = (timestamps) => {
        if (!Array.isArray(timestamps)) return {};

        return timestamps.reduce((acc, ts) => {
            const date = new Date(ts);
            const day = date.toLocaleDateString('en-US', { weekday: 'long' });
            const fullDate = date.toLocaleDateString('en-ZA', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
            const key = `${day} - ${fullDate}`;
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (!acc[key]) acc[key] = [];
            acc[key].push(formattedTime);
            return acc;
        }, {});
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Checked-In Members</Text>
            <Text style={styles.description}>
                The following members have currently checked in. Tap a user to view their check-in and check-out times. Pull down to refresh.
            </Text>

            <FlatList
                data={checkedInUsers}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingTop: 10, flexGrow: 1 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#22d3ee"
                        colors={["#22d3ee"]}
                    />
                }
                renderItem={({ item }) => {
                    const isExpanded = expandedUserId === item.id;
                    const isCheckInOpen = checkInExpanded[item.id];
                    const isCheckOutOpen = checkOutExpanded[item.id];

                    return (
                        <TouchableOpacity onPress={() => toggleExpand(item.id)}>
                            <View style={styles.userRow}>
                                <Image
                                    source={{ uri: item.avatar_url || "https://www.gravatar.com/avatar/?d=mp&s=64" }}
                                    style={styles.avatar}
                                />
                                <Text style={styles.userName}>{item.name || "Unnamed User"}</Text>
                            </View>

                            {isExpanded && (
                                <View style={styles.detailBox}>
                                    <TouchableOpacity onPress={() => toggleCheckIn(item.id)} style={styles.toggleHeader}>
                                        <Text style={styles.detailHeader}>Check-in Times</Text>
                                        <FontAwesomeIcon icon={isCheckInOpen ? faChevronUp : faChevronDown} color="#e5e7eb" />
                                    </TouchableOpacity>
                                    {isCheckInOpen && (
                                        <View style={styles.timeList}>
                                            {Array.isArray(item.check_in_time) && item.check_in_time.length > 0 ? (
                                                Object.entries(groupByDayWithDate(item.check_in_time)).map(([dayKey, times]) => (
                                                    <View key={dayKey} style={{ marginBottom: 6 }}>
                                                        <Text style={styles.dayKey}>{dayKey}</Text>
                                                        {times.map((time, idx) => (
                                                            <Text key={idx} style={styles.timeText}>• {time}</Text>
                                                        ))}
                                                    </View>
                                                ))
                                            ) : (
                                                <Text style={styles.noTimes}>No check-ins</Text>
                                            )}
                                        </View>
                                    )}

                                    <TouchableOpacity onPress={() => toggleCheckOut(item.id)} style={styles.toggleHeader}>
                                        <Text style={styles.detailHeader}>Check-out Times</Text>
                                        <FontAwesomeIcon icon={isCheckOutOpen ? faChevronUp : faChevronDown} color="#e5e7eb" />
                                    </TouchableOpacity>
                                    {isCheckOutOpen && (
                                        <View style={styles.timeList}>
                                            {Array.isArray(item.check_out_time) && item.check_out_time.length > 0 ? (
                                                Object.entries(groupByDayWithDate(item.check_out_time)).map(([dayKey, times]) => (
                                                    <View key={dayKey} style={{ marginBottom: 6 }}>
                                                        <Text style={styles.dayKey}>{dayKey}</Text>
                                                        {times.map((time, idx) => (
                                                            <Text key={idx} style={styles.timeText}>• {time}</Text>
                                                        ))}
                                                    </View>
                                                ))
                                            ) : (
                                                <Text style={styles.noTimes}>No check-outs</Text>
                                            )}
                                        </View>
                                    )}
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Text style={styles.noUsersText}>No users are currently checked in.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1f2937",
        padding: 16,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1f2937",
    },
    heading: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#f9fafb",
        marginBottom: 4,
        textAlign: "center",
    },
    description: {
        fontSize: 14,
        color: "#9ca3af",
        marginBottom: 16,
        textAlign: "center",
    },
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#374151",
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 15,
        borderColor: "#22d3ee",
        borderWidth: 1,
    },
    userName: {
        color: "#f9fafb",
        fontSize: 16,
        fontWeight: "600",
    },
    detailBox: {
        backgroundColor: "#4b5563",
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        marginBottom: 10,
        marginTop: -5,
        marginLeft: 63,
    },
    toggleHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
        marginTop: 10,
    },
    detailHeader: {
        color: "#e5e7eb",
        fontSize: 15,
        fontWeight: "bold",
    },
    timeList: {
        marginLeft: 6,
        marginBottom: 6,
    },
    dayKey: {
        color: "#f3f4f6",
        fontWeight: "700",
        marginBottom: 2,
    },
    timeText: {
        color: "#d1d5db",
        marginLeft: 10,
    },
    noTimes: {
        color: "#9ca3af",
        fontStyle: "italic",
    },
    noUsersText: {
        color: "#d1d5db",
        fontSize: 16,
        fontStyle: "italic",
        marginTop: 30,
    },
});

export default CheckedInScreen;
