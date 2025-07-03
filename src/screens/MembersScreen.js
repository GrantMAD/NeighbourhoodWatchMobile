import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
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
import { useFocusEffect } from '@react-navigation/native';

import { supabase } from '../../lib/supabase';


if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const defaultAvatar = require('../../assets/Images/user.png');

const MembersScreen = ({ route }) => {
  const { groupId } = route.params;
  const [groupedMembers, setGroupedMembers] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [groupAnimations, setGroupAnimations] = useState({});
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
      setGroupedMembers({});
      setLoading(false);
      return;
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url, number, street, emergency_contact, check_in_time, check_out_time, is_group_creator, vehicle_info, neighbourhoodwatch, checked_in')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      setLoading(false);
      return;
    }

    const grouped = profiles.reduce((acc, user) => {
      if (user.neighbourhoodwatch && Array.isArray(user.neighbourhoodwatch)) {
        user.neighbourhoodwatch.forEach(watch => {
          const groupName = watch.name;
          if (!acc[groupName]) {
            acc[groupName] = [];
          }
          acc[groupName].push(user);
        });
      }
      return acc;
    }, {});

    setGroupedMembers(grouped);
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchGroupMembers();
    }, [groupId])
  );

  useEffect(() => {
    const initialAnimations = {};
    Object.keys(groupedMembers).forEach(groupName => {
      initialAnimations[groupName] = new Animated.Value(0);
    });
    setGroupAnimations(initialAnimations);
  }, [groupedMembers]);

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

  const toggleGroupExpansion = (groupName) => {
    setExpandedGroups(prevState => {
      const isExpanded = !prevState[groupName];
      if (!groupAnimations[groupName]) {
        setGroupAnimations(prev => ({ ...prev, [groupName]: new Animated.Value(isExpanded ? 1 : 0) }));
      }
      Animated.timing(groupAnimations[groupName], {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
      return {
        ...prevState,
        [groupName]: isExpanded
      };
    });
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
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name || 'No Name'}</Text>
            <Text style={styles.cardEmail}>{item.email || 'No Email'}</Text>
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
              <View style={styles.modalTitleContainer}>
                <Image
                  source={selectedMember.avatar_url ? { uri: selectedMember.avatar_url } : defaultAvatar}
                  style={styles.modalAvatar}
                />
                <View>
                  <Text style={styles.modalTitle}>{selectedMember.name || 'No Name'}</Text>
                  <Text style={styles.modalEmail}>{selectedMember.email || 'No Email'}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.icon}>📞</Text>
                <Text style={styles.detailLabel}>Contact Number:</Text>
                <Text style={styles.detailText}>{selectedMember.number || '-'}</Text>
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
              <View style={styles.detailRow}>
                <Text style={styles.icon}>⭐</Text>
                <Text style={styles.detailLabel}>Role:</Text>
                <Text style={styles.detailText}>
                  {selectedMember.is_group_creator ? 'Group Creator' : 'Member'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.icon}>🚗</Text>
                <Text style={styles.detailLabel}>Vehicle Info:</Text>
                <Text style={styles.detailText}>{selectedMember.vehicle_info || '-'}</Text>
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
      <Text style={styles.description}>Here you can see all the members, grouped by their neighbourhood watch.</Text>

      <ScrollView style={{ flex: 1 }}>
        {Object.keys(groupedMembers).length > 0 ? (
          Object.entries(groupedMembers).map(([groupName, membersInGroup]) => (
            <View key={groupName} style={styles.groupContainer}>
              <TouchableOpacity
                onPress={() => toggleGroupExpansion(groupName)}
                style={styles.groupHeader}
              >
                <Text style={styles.groupTitle}>🏠 {groupName} <Text style={styles.memberCountText}>({membersInGroup.length} Members, {membersInGroup.filter(m => m.checked_in).length} Checked In)</Text></Text>
                <Text style={styles.groupToggleIcon}>
                  {expandedGroups[groupName] ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
              <Animated.View
                style={[
                  styles.groupContent,
                  {
                    maxHeight: groupAnimations[groupName]
                      ? groupAnimations[groupName].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1000], // Large enough value
                        })
                      : 0,
                    opacity: groupAnimations[groupName]
                      ? groupAnimations[groupName].interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, 0.5, 1],
                        })
                      : 0,
                  },
                ]}
              >
                {membersInGroup.map((item) => (
                  <View key={item.id}>
                    {renderItem({ item })}
                  </View>
                ))}
              </Animated.View>
            </View>
          ))
        ) : (
          <Text style={styles.noMembersText}>No members found for this group.</Text>
        )}
      </ScrollView>
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
    borderWidth: 2,
    borderColor: '#22d3ee',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cardEmail: {
    fontSize: 12,
    color: '#d1d5db',
    marginTop: 2,
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
    color: '#f9fafb',
    lineHeight: 22, // Explicitly set line height to match font size for precise vertical centering
  },
  modalEmail: {
    fontSize: 14,
    color: '#fff',
    marginTop: 2,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#22d3ee',
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
  groupContainer: {
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1f2937',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2d3748',
    borderBottomWidth: 1,
    borderBottomColor: '#4a5568',
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#cccccc',
  },
  groupToggleIcon: {
    fontSize: 18,
    color: '#cccccc',
  },
  memberCountText: {
    fontSize: 14,
    color: '#999999',
    fontWeight: 'normal',
  },
  groupContent: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  noMembersText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#555',
  },
});

export default MembersScreen;