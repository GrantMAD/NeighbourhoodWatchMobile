import { GOOGLE_API_KEY } from "@env";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import { supabase } from "../../lib/supabase";

const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
    );
    const data = await response.json();
    if (data.status === "OK" && data.results.length > 0) {
      return data.results[0].formatted_address;
    } else {
      console.warn("No address found for coordinates:", latitude, longitude);
      console.log("Google Geocoding API Response:", JSON.stringify(data, null, 2)); // Log the full response
      return "Unknown Location";
    }
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return "Unknown Location";
  }
};

const CheckedInScreen = () => {
  const [checkedInUsers, setCheckedInUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // For pulsing animation of the green dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const fetchCheckedInUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, name, email, avatar_url, number, street, emergency_contact, check_in_time, is_group_creator, vehicle_info"
      )
      .eq("checked_in", true);

    if (error) {
      console.error("Error fetching profiles:", error);
      return [];
    }

    // For each user, fetch latest location and resolve address
    const usersWithLocations = await Promise.all(
      (data || []).map(async (user) => {
        const { data: locationData, error: locError } = await supabase
          .from("user_locations")
          .select("current_latitude, current_longitude")
          .eq("user_id", user.id)
          .single();

        if (locError) {
          console.error("Error fetching location for user:", user.id, locError);
        }

        let address = null;
        if (locationData && locationData.current_latitude) {
          address = await reverseGeocode(locationData.current_latitude, locationData.current_longitude);
        }

        return {
          ...user,
          latestLocation: locationData || null,
          latestAddress: address || null,
        };
      })
    );

    return usersWithLocations;
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

  const openModal = (user) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedUser(null);
  };

  // Extract the latest check-in time as a formatted string (time only)
  const getLatestCheckInTime = (checkInTimes) => {
    if (!Array.isArray(checkInTimes) || checkInTimes.length === 0) return null;
    const latestTimestamp = checkInTimes.reduce((latest, current) =>
      new Date(current) > new Date(latest) ? current : latest
    );
    const date = new Date(latestTimestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Calculate relative time from now (e.g., "10 mins ago")
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return null;
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    if (diffMs < 0) return null;

    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return `${seconds} sec${seconds !== 1 ? "s" : ""} ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${minutes !== 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Checked-In Members</Text>
      <Text style={styles.description}>
        The following members are currently checked in. Tap a user to view their details.
      </Text>

      <FlatList
        data={checkedInUsers}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#22d3ee"
            colors={["#22d3ee"]}
          />
        }
        renderItem={({ item }) => {
          const latestCheckIn = getLatestCheckInTime(item.check_in_time);
          const latestCheckInRelative =
            item.check_in_time && item.check_in_time.length > 0
              ? getRelativeTime(
                  item.check_in_time.reduce((latest, current) =>
                    new Date(current) > new Date(latest) ? current : latest
                  )
                )
              : null;

          return (
            <TouchableOpacity onPress={() => openModal(item)}>
              <View style={styles.userRow}>
                <Image
                  source={{
                    uri: item.avatar_url || "https://www.gravatar.com/avatar/?d=mp&s=64",
                  }}
                  style={styles.avatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{item.name || "Unnamed User"}</Text>
                  {latestCheckIn && (
                    <Text style={styles.checkInTimeText}>
                      Checked in at {latestCheckIn}{" "}
                      {latestCheckInRelative ? `(${latestCheckInRelative})` : ""}
                    </Text>
                  )}
                  {item.latestAddress && (
                    <Text style={[styles.checkInTimeText, { marginTop: 4 }]}>
                       📍 Current Location: {item.latestAddress}
                    </Text>
                  )}
                </View>
                <Animated.View
                  style={[
                    styles.pulsingDot,
                    {
                      transform: [{ scale: pulseAnim }],
                      shadowColor: "#22c55e",
                      shadowRadius: 8,
                      shadowOpacity: 0.9,
                      shadowOffset: { width: 0, height: 0 },
                      elevation: 10,
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.noUsersText}>No users are currently checked in.</Text>
          </View>
        }
      />

      {selectedUser && (
        <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <View style={styles.modalTitleContainer}>
                  <Image
                    source={{
                      uri: selectedUser.avatar_url || "https://www.gravatar.com/avatar/?d=mp&s=64",
                    }}
                    style={styles.modalAvatar}
                  />
                  <View>
                    <Text style={styles.modalTitle}>{selectedUser.name}</Text>
                    <Text style={styles.modalEmail}>{selectedUser.email || "-"}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.icon}>📞</Text>
                  <Text style={styles.detailLabel}>Contact Number:</Text>
                  <Text style={styles.detailText}>{selectedUser.number || "-"}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.icon}>❗</Text>
                  <Text style={styles.detailLabel}>Emergency Contact:</Text>
                  <Text style={styles.detailText}>{selectedUser.emergency_contact || "-"}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.icon}>📍</Text>
                  <Text style={styles.detailLabel}>Street:</Text>
                  <Text style={styles.detailText}>{selectedUser.street || "-"}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.icon}>⭐</Text>
                  <Text style={styles.detailLabel}>Role:</Text>
                  <Text style={styles.detailText}>
                    {selectedUser.is_group_creator ? "Group Creator" : "Member"}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.icon}>🚗</Text>
                  <Text style={styles.detailLabel}>Vehicle Info:</Text>
                  <Text style={styles.detailText}>{selectedUser.vehicle_info || "-"}</Text>
                </View>
              </ScrollView>

              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1f2937", padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  heading: { fontSize: 24, fontWeight: "bold", color: "#f9fafb", textAlign: "center" },
  description: { fontSize: 14, color: "#9ca3af", marginBottom: 16, textAlign: "center" },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#374151",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 15,
    borderColor: "#22d3ee",
    borderWidth: 1,
  },
  userName: { color: "#f9fafb", fontSize: 16, fontWeight: "600" },
  checkInTimeText: { color: "#9ca3af", fontSize: 12, marginTop: 2 },

  pulsingDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22c55e",
    marginLeft: 10,
  },

  noUsersText: { color: "#d1d5db", fontSize: 16, fontStyle: "italic", marginTop: 30 },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    width: "100%",
    maxHeight: "85%",
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 20,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  modalAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#22d3ee",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#f9fafb" },
  modalEmail: { fontSize: 14, color: "#e5e7eb", marginTop: 2 },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  icon: {
    marginRight: 10,
    width: 20,
    textAlign: "center",
    color: "#f9fafb",
  },
  detailLabel: {
    fontWeight: "bold",
    marginRight: 5,
    color: "#d1d5db",
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: "#e5e7eb",
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default CheckedInScreen;