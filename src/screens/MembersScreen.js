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
  Easing,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const defaultAvatar = require('../../assets/Images/user.png');

const LoadingState = () => (
    <ScrollView style={styles.container}>
        <View style={styles.loadingHeading} />
        <View style={styles.loadingDescription} />
        {[...Array(3)].map((_, i) => (
            <View key={i} style={styles.loadingGroupContainer}>
                <View style={styles.loadingGroupHeader} />
                <View style={styles.loadingMemberCard} />
                <View style={styles.loadingMemberCard} />
            </View>
        ))}
    </ScrollView>
);

const MembersScreen = ({ route }) => {
  const { groupId } = route.params;
  const [groupedMembers, setGroupedMembers] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [groupAnimations, setGroupAnimations] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

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
      .select('id, name, email, avatar_url, number, street, emergency_contact, is_group_creator, vehicle_info, neighbourhoodwatch, checked_in, role')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      setLoading(false);
      return;
    }

    const grouped = profiles.reduce((acc, user) => {
      if (user.neighbourhoodwatch && Array.isArray(user.neighbourhoodwatch) && user.neighbourhoodwatch.length > 0) {
        user.neighbourhoodwatch.forEach(watch => {
          const groupName = watch.name;
          if (!acc[groupName]) {
            acc[groupName] = [];
          }
          acc[groupName].push(user);
        });
      } else {
        const noWatchGroupName = "No assigned neighbourhoodwatch";
        if (!acc[noWatchGroupName]) {
          acc[noWatchGroupName] = [];
        }
        acc[noWatchGroupName].push(user);
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
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ marginRight: 6, marginTop: 2, fontSize: 16, color: "#fff" }}>👤</Text>
              <Text style={styles.name}>{item.name || 'No Name'}</Text>
            </View>
            <Text style={styles.cardEmail}>{item.email || 'No Email'}</Text>
          </View>
          <Text style={{ fontSize: 24, color: "#fff", fontWeight: 'bold' }}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderModalContent = () => {
    if (!selectedMember) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <Image
                source={selectedMember.avatar_url ? { uri: selectedMember.avatar_url } : defaultAvatar}
                style={styles.modalAvatar}
              />
              <View>
                <Text style={styles.modalTitle}>{selectedMember.name || 'No Name'}</Text>
                <Text style={styles.modalRole}>{selectedMember.role}</Text>
              </View>
            </View>

            <ScrollView>
              {/* Contact Info Card */}
              <View style={styles.detailCard}>
                <Text style={styles.cardHeader}>Contact Information</Text>
                <TouchableOpacity style={styles.detailRow} onPress={() => Linking.openURL(`mailto:${selectedMember.email}`)}>
                  <Text style={styles.icon}>📧</Text>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailText}>{selectedMember.email || '-'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.detailRow} onPress={() => Linking.openURL(`tel:${selectedMember.number}`)}>
                  <Text style={styles.icon}>📞</Text>
                  <Text style={styles.detailLabel}>Contact Number:</Text>
                  <Text style={styles.detailText}>{selectedMember.number || '-'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.detailRow} onPress={() => Linking.openURL(`tel:${selectedMember.emergency_contact}`)}>
                  <Text style={styles.icon}>🆘</Text>
                  <Text style={styles.detailLabel}>Emergency Contact:</Text>
                  <Text style={styles.detailText}>{selectedMember.emergency_contact || '-'}</Text>
                </TouchableOpacity>
              </View>

              {/* Location & Vehicle Card */}
              <View style={styles.detailCard}>
                <Text style={styles.cardHeader}>Location & Vehicle</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.icon}>📍</Text>
                  <Text style={styles.detailLabel}>Street:</Text>
                  <Text style={styles.detailText}>{selectedMember.street || '-'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.icon}>🚗</Text>
                  <Text style={styles.detailLabel}>Vehicle Info:</Text>
                  <Text style={styles.detailText}>{selectedMember.vehicle_info || '-'}</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Members</Text>
      <Text style={styles.description}>Here you can see all the members, grouped by their neighbourhood watch.</Text>

      {loading ? (
        <LoadingState />
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {Object.keys(groupedMembers).length > 0 ? (
            Object.entries(groupedMembers).map(([groupName, membersInGroup]) => (
              <View key={groupName} style={styles.groupContainer}>
                <TouchableOpacity
                  onPress={() => toggleGroupExpansion(groupName)}
                  style={styles.groupHeader}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupTitle}>🏘️ {groupName}</Text>
                    <View style={styles.hr} />
                    <View style={styles.memberCountContainer}>
                      <Text style={styles.memberCountText}>
                        👥 {membersInGroup.length} Members
                      </Text>
                      <Text style={styles.memberCountText}>
                        ✅ {membersInGroup.filter(m => m.checked_in).length} Checked In
                      </Text>
                    </View>
                  </View>
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
                            outputRange: [0, 1000],
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
      )}
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
    paddingTop: 2,
  },
  cardEmail: {
    fontSize: 12,
    color: '#d1d5db',
    marginTop: 2,
  },
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
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#34495e',
    marginBottom: 15,
  },
  modalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#3498db',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ecf0f1',
  },
  modalRole: {
    fontSize: 16,
    color: '#95a5a6',
    marginTop: 2,
  },
  detailCard: {
    backgroundColor: '#2c3e50',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ecf0f1',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 12,
    fontSize: 20,
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#bdc3c7',
    marginRight: 5,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#ecf0f1',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#34495e',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ecf0f1',
    fontWeight: 'bold',
    fontSize: 16,
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
    padding: 16,
    backgroundColor: '#2c3e50', // Darker, richer blue
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ecf0f1', // Lighter text for contrast
  },
  groupToggleIcon: {
    fontSize: 22,
    color: '#ecf0f1',
  },
  memberCountContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  memberCountText: {
    fontSize: 14,
    color: '#bdc3c7', // Softer grey for secondary info
    marginRight: 16,
  },
  hr: {
    height: 1,
    backgroundColor: '#34495e',
    marginTop: 8,
    marginBottom: 8,
    width: '50%',
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
  loadingHeading: {
    width: '70%',
    height: 28,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginBottom: 4,
    alignSelf: 'center',
  },
  loadingDescription: {
    width: '90%',
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginBottom: 16,
    alignSelf: 'center',
  },
  loadingGroupContainer: {
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  loadingGroupHeader: {
    height: 80,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginBottom: 8,
  },
  loadingMemberCard: {
    height: 60,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginVertical: 6,
    marginHorizontal: 10,
  },
});

export default MembersScreen;
