import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  UIManager,
  Animated,
  Easing
} from 'react-native';

import { supabase } from '../../lib/supabase';


if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const defaultAvatar = require('../../assets/Images/user.png');

const MembersScreen = ({ route }) => {
  const { groupId } = route.params;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [checkInAnimation, setCheckInAnimation] = useState(new Animated.Value(0));
  const [checkOutAnimation, setCheckOutAnimation] = useState(new Animated.Value(0));

  const fetchGroupMembers = async () => {
    setLoading(true);

    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('users')
      .eq('id', groupId)
      .single();

    if (groupError) {
      console.error('Error fetching group:', groupError);
      setLoading(false);
      return;
    }

    const userIds = groupData?.users || [];

    if (userIds.length === 0) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url, number, street, emergency_contact, check_in_time, check_out_time')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      setLoading(false);
      return;
    }

    setMembers(profiles);
    setLoading(false);
  };

  useEffect(() => {
    fetchGroupMembers();
  }, [groupId]);

  const openModal = (member) => {
    setSelectedMember(member);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedMember(null);
    setModalVisible(false);
    setCheckInAnimation(new Animated.Value(0));
    setCheckOutAnimation(new Animated.Value(0));
  };

  const toggleCheckIn = () => {
    const toValue = checkInAnimation._value === 0 ? 1 : 0;
    Animated.timing(checkInAnimation, {
      toValue,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const toggleCheckOut = () => {
    const toValue = checkOutAnimation._value === 0 ? 1 : 0;
    Animated.timing(checkOutAnimation, {
      toValue,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
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

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() => openModal(item)}
        activeOpacity={0.8}
        style={styles.memberCard}
      >
        <View style={styles.mainRow}>
          <Image
            source={item.avatar_url ? { uri: item.avatar_url } : defaultAvatar}
            style={styles.avatar}
          />
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <Text style={{ marginRight: 6, marginTop: 2, fontSize: 16, color: "#fff" }}>👤</Text>
            <Text style={styles.name}>{item.name || 'No Name'}</Text>
          </View>
          <Text
            style={{ fontSize: 24, color: "#fff", fontWeight: 'bold' }}
          >›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderModalContent = () => {
    if (!selectedMember) return null;

    const checkInsByDay = groupByDayWithDate(selectedMember.check_in_time);
    const checkOutsByDay = groupByDayWithDate(selectedMember.check_out_time);

    const checkInHeight = checkInAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1000] // Large enough value
    });

    const checkOutHeight = checkOutAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1000] // Large enough value
    });

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>👤 {selectedMember.name || 'No Name'}</Text>

              <View style={styles.detailRow}>
                <Text style={styles.icon}>📞</Text>
                <Text style={styles.detailLabel}>Contact Number:</Text>
                <Text style={styles.detailText}>{selectedMember.number || '-'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.icon}>✉️</Text>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailText}>{selectedMember.email || '-'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.icon}>❗</Text>
                <Text style={styles.detailLabel}>Emergency Contact:</Text>
                <Text style={styles.detailText}>{selectedMember.emergency_contact || '-'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.icon}>📍</Text>
                <Text style={styles.detailLabel}>Street:</Text>
                <Text style={styles.detailText}>{selectedMember.street || '-'}</Text>
              </View>

              <TouchableOpacity onPress={toggleCheckIn} style={styles.toggleHeader}>
                <Text style={styles.dropdownSubHeading}>⏱️ Check-in Times</Text>
                <Animated.View style={{ transform: [{ rotate: checkInAnimation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
                  <Text style={{color: '#fff'}}>▼</Text>
                </Animated.View>
              </TouchableOpacity>
              <Animated.View style={{ maxHeight: checkInHeight, overflow: 'hidden' }}>
                {Object.keys(checkInsByDay).length > 0 ? (
                  Object.entries(checkInsByDay).map(([dayKey, times]) => (
                    <View key={dayKey} style={styles.historySection}>
                      <Text style={styles.historyDay}>{dayKey}</Text>
                      {times.map((time, idx) => (
                        <Text key={idx} style={styles.historyTime}>• {time}</Text>
                      ))}
                    </View>
                  ))
                ) : (
                  <Text style={styles.noHistoryText}>No check-ins</Text>
                )}
              </Animated.View>

              <TouchableOpacity onPress={toggleCheckOut} style={styles.toggleHeader}>
                <Text style={styles.dropdownSubHeading}>⏱️ Check-out Times</Text>
                <Animated.View style={{ transform: [{ rotate: checkOutAnimation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
                  <Text style={{color: '#fff'}}>▼</Text>
                </Animated.View>
              </TouchableOpacity>
              <Animated.View style={{ maxHeight: checkOutHeight, overflow: 'hidden' }}>
                {Object.keys(checkOutsByDay).length > 0 ? (
                  Object.entries(checkOutsByDay).map(([dayKey, times]) => (
                    <View key={dayKey} style={styles.historySection}>
                      <Text style={styles.historyDay}>{dayKey}</Text>
                      {times.map((time, idx) => (
                        <Text key={idx} style={styles.historyTime}>• {time}</Text>
                      ))}
                    </View>
                  ))
                ) : (
                  <Text style={styles.noHistoryText}>No check-outs</Text>
                )}
              </Animated.View>
            </ScrollView>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };


  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Members</Text>
      <Text style={styles.description}>Here you can see all the members of this group.</Text>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
      {renderModalContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 16,
  },
  memberCard: {
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
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#666',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1f2937',
    borderRadius: 10,
    padding: 20,
    paddingTop: 40, // Make space for the absolute close button
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#f9fafb',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 10,
    width: 20,
    textAlign: 'center',
    color: '#f9fafb',
  },
  detailLabel: {
    fontWeight: 'bold',
    marginRight: 5,
    color: '#d1d5db',
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#e5e7eb',
  },
  dropdownSubHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f9fafb',
    marginTop: 10,
    marginBottom: 4,
    borderTopColor: '#4b5563',
    borderTopWidth: 1,
    paddingTop: 10
  },
  historySection: {
    marginBottom: 10,
    paddingLeft: 10,
  },
  historyDay: {
    fontWeight: 'bold',
    color: '#d1d5db',
  },
  historyTime: {
    color: '#e5e7eb',
    marginLeft: 10,
  },
  noHistoryText: {
    color: '#9ca3af',
    fontStyle: 'italic',
    marginLeft: 10,
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
});

export default MembersScreen;