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

    return data || [];
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
                    <Text style={styles.checkInTimeText}>Checked in at {latestCheckIn}</Text>
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
  },
  modalContent: {
    width: "90%",
    maxHeight: "85%",
    backgroundColor: "#1f2937",
    borderRadius: 10,
    padding: 20,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
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
