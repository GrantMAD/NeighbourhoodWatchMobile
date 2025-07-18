import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Image,
    TouchableOpacity,
    Animated,
    Easing,
    Alert,
    Platform,
    UIManager,
    Modal,
    ScrollView,
    TextInput
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../lib/supabase';

import Toast from 'react-native-simple-toast';

const defaultAvatar = require('../../assets/Images/user.png');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Skeleton loader component for member cards while loading
const SkeletonMemberCard = () => (
    <View style={[styles.memberCard, { backgroundColor: '#e5e7eb' }]}>
        <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#cbd5e1', marginRight: 15 }} />
        <View style={{ flex: 1 }}>
            <View style={{ height: 16, backgroundColor: '#cbd5e1', marginBottom: 6, borderRadius: 4, width: '60%' }} />
            <View style={{ height: 12, backgroundColor: '#cbd5e1', borderRadius: 4, width: '40%' }} />
        </View>
        <View style={{ width: 70, height: 32, borderRadius: 16, backgroundColor: '#cbd5e1' }} />
    </View>
);

export default function ManageMembersScreen() {
    const [members, setMembers] = useState([]);
    const [groupId, setGroupId] = useState(null);
    const [checkInAnimation, setCheckInAnimation] = useState(new Animated.Value(0));
    const [checkOutAnimation, setCheckOutAnimation] = useState(new Animated.Value(0));
    const [memberRoles, setMemberRoles] = useState({});
    const [isGroupCreator, setIsGroupCreator] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true); // <-- Added loading state

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

    const fetchGroupAndMembers = async () => {
        setLoading(true); // <-- Start loading

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            setLoading(false);
            return;
        }

        const currentUserId = user.id;

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('group_id, is_group_creator')
            .eq('id', currentUserId)
            .single();

        if (profileError || !profile?.group_id) {
            setLoading(false);
            return;
        }

        setGroupId(profile.group_id);
        setIsGroupCreator(profile.is_group_creator);

        const { data: group, error: groupError } = await supabase
            .from('groups')
            .select('users')
            .eq('id', profile.group_id)
            .single();

        if (groupError || !group?.users) {
            setLoading(false);
            return;
        }

        const { data: memberProfiles, error: membersError } = await supabase
            .from('profiles')
            .select('id, group_id, name, email, avatar_url, number, street, emergency_contact, check_in_time, check_out_time, role')
            .in('id', group.users);

        if (membersError) {
            console.error('Failed to fetch members:', membersError);
            setLoading(false);
            return;
        }

        // FILTER OUT current user
        const filteredMembers = memberProfiles.filter(m => m.id !== currentUserId);

        setMembers(filteredMembers);

        // Setup animations and roles states for members
        const newCheckIn = {};
        const newCheckOut = {};
        const roles = {};
        filteredMembers.forEach(m => {
            newCheckIn[m.id] = new Animated.Value(0);
            newCheckOut[m.id] = new Animated.Value(0);
            roles[m.id] = m.role;
        });
        setCheckInAnimation(newCheckIn);
        setCheckOutAnimation(newCheckOut);
        setMemberRoles(roles);

        setLoading(false); // <-- Done loading
    };

    useEffect(() => {
        fetchGroupAndMembers();
    }, []);

    const openModal = (member) => {
        setSelectedMember(member);
        setModalVisible(true);
    };

    const closeModal = () => {
        setSelectedMember(null);
        setModalVisible(false);
    };

    const handleRemoveMember = async (member) => {
        const userId = member?.id;
        const groupId = member?.group_id;

        if (!userId || !groupId) {
            Alert.alert("Error", "User or group information missing.");
            return;
        }

        try {
            const { error: profileUpdateError } = await supabase
                .from("profiles")
                .update({ group_id: null })
                .eq("id", userId);

            if (profileUpdateError) {
                console.error("Failed to update user profile:", profileUpdateError);
                Alert.alert("Error", "Failed to update user profile.");
                return;
            }

            const { data: groupData, error: groupFetchError } = await supabase
                .from("groups")
                .select("users")
                .eq("id", groupId)
                .single();

            if (groupFetchError || !groupData?.users) {
                console.error("Failed to fetch group data:", groupFetchError);
                Alert.alert("Error", "Failed to fetch group data.");
                return;
            }

            const updatedUsers = groupData.users.filter((id) => id !== userId);

            const { error: groupUpdateError } = await supabase
                .from("groups")
                .update({ users: updatedUsers })
                .eq("id", groupId);

            if (groupUpdateError) {
                console.error("Failed to update group:", groupUpdateError);
                Alert.alert("Error", "Failed to update group users list.");
                return;
            }

            Toast.show('User has been removed');
            fetchGroupAndMembers();
        } catch (err) {
            console.error("Unexpected error removing member:", err);
            Alert.alert("Error", "Something went wrong while removing the member.");
        }
    };

    const confirmRemoveMember = (member) => {
        Alert.alert(
            "Remove Member",
            `Are you sure you want to remove ${member.name || "this member"} from the group?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => handleRemoveMember(member),
                },
            ]
        );
    };

    const handleRoleChange = async (memberId, role) => {
        setMemberRoles({ ...memberRoles, [memberId]: role });

        const { error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', memberId);

        if (error) {
            Toast.show('Failed to update role');
            fetchGroupAndMembers();
        } else {
            Toast.show('Role updated successfully');
        }
    };

    const renderItem = ({ item }) => {
        return (
            <View style={styles.memberCard}>
                <Image source={item.avatar_url ? { uri: item.avatar_url } : defaultAvatar} style={styles.avatar} />
                <View style={styles.memberInfo}>
                    <Text style={styles.name}>{item.name || 'No Name'}</Text>
                    <Text style={styles.role}>{item.role}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => openModal(item)}
                    style={styles.manageButton}
                >
                    <Text style={styles.manageButtonText}>Manage</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderModal = () => {
        if (!selectedMember) {
            return null;
        }

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
                                <Text style={styles.modalName}>{selectedMember.name || 'No Name'}</Text>
                                <Text style={styles.modalRole}>{selectedMember.role}</Text>
                            </View>
                        </View>

                        <ScrollView>
                            {/* Contact Info Card */}
                            <View style={styles.detailCard}>
                                <Text style={styles.cardHeader}>Contact Information</Text>
                                <View style={styles.detailRow}>
                                    <Text style={styles.icon}>✉️</Text>
                                    <Text style={styles.detailLabel}>Email:</Text>
                                    <Text style={styles.detailText}>{selectedMember.email || '-'}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.icon}>📞</Text>
                                    <Text style={styles.detailLabel}>Contact:</Text>
                                    <Text style={styles.detailText}>{selectedMember.number || '-'}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.icon}>❗</Text>
                                    <Text style={styles.detailLabel}>Emergency Contact:</Text>
                                    <Text style={styles.detailText}>{selectedMember.emergency_contact || '-'}</Text>
                                </View>
                            </View>

                            {/* Details Card */}
                            <View style={styles.detailCard}>
                                <Text style={styles.cardHeader}>Details</Text>
                                <View style={styles.detailRow}>
                                    <Text style={styles.icon}>📍</Text>
                                    <Text style={styles.detailLabel}>Street:</Text>
                                    <Text style={styles.detailText}>{selectedMember.street || '-'}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.icon}>👑</Text>
                                    <Text style={styles.detailLabel}>Role:</Text>
                                    {isGroupCreator ? (
                                        <View style={styles.pickerContainer}>
                                            <Picker
                                                selectedValue={memberRoles[selectedMember.id] || selectedMember.role}
                                                style={styles.picker}
                                                onValueChange={(itemValue) => handleRoleChange(selectedMember.id, itemValue)}
                                            >
                                                <Picker.Item label="Member" value="member" />
                                                <Picker.Item label="Admin" value="Admin" />
                                            </Picker>
                                        </View>
                                    ) : (
                                        <Text style={styles.detailText}>{selectedMember.role}</Text>
                                    )}
                                </View>
                            </View>

                            {/* Check-in/out Card */}
                            <View style={styles.detailCard}>
                                <Text style={styles.cardHeader}>Activity</Text>
                                <TouchableOpacity onPress={toggleCheckIn} style={styles.toggleHeader}>
                                    <Text style={styles.dropdownSubHeading}>Check-in Times</Text>
                                    <Animated.View style={{ transform: [{ rotate: checkInAnimation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
                                        <Text style={{ color: '#fff' }}>▼</Text>
                                    </Animated.View>
                                </TouchableOpacity>
                                <Animated.View style={{ maxHeight: checkInAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 1000] }), overflow: 'hidden' }}>
                                    {Object.keys(groupByDayWithDate(selectedMember.check_in_time)).length > 0 ? (
                                        Object.entries(groupByDayWithDate(selectedMember.check_in_time)).map(([dayKey, times]) => (
                                            <View key={dayKey} style={{ marginBottom: 10, paddingLeft: 10 }}>
                                                <Text style={{ fontWeight: 'bold', color: '#d1d5db' }}>{dayKey}</Text>
                                                {times.map((time, idx) => (
                                                    <Text key={idx} style={{ color: '#e5e7eb', marginLeft: 10 }}>• {time}</Text>
                                                ))}
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={{ color: '#9ca3af', fontStyle: 'italic', marginLeft: 10, marginBottom: 10 }}>No check-ins</Text>
                                    )}
                                </Animated.View>

                                <TouchableOpacity onPress={toggleCheckOut} style={styles.toggleHeader}>
                                    <Text style={styles.dropdownSubHeading}>Check-out Times</Text>
                                    <Animated.View style={{ transform: [{ rotate: checkOutAnimation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
                                        <Text style={{ color: '#fff' }}>▼</Text>
                                    </Animated.View>
                                </TouchableOpacity>
                                <Animated.View style={{ maxHeight: checkOutAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 1000] }), overflow: 'hidden' }}>
                                    {Object.keys(groupByDayWithDate(selectedMember.check_out_time)).length > 0 ? (
                                        Object.entries(groupByDayWithDate(selectedMember.check_out_time)).map(([dayKey, times]) => (
                                            <View key={dayKey} style={{ marginBottom: 10, paddingLeft: 10 }}>
                                                <Text style={{ fontWeight: 'bold', color: '#d1d5db' }}>{dayKey}</Text>
                                                {times.map((time, idx) => (
                                                    <Text key={idx} style={{ color: '#e5e7eb', marginLeft: 10 }}>• {time}</Text>
                                                ))}
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={{ color: '#9ca3af', fontStyle: 'italic', marginLeft: 10, marginBottom: 10 }}>No check-outs</Text>
                                    )}
                                </Animated.View>
                            </View>

                            <TouchableOpacity
                                onPress={() => confirmRemoveMember(selectedMember)}
                                style={styles.removeButton}
                            >
                                <Text style={styles.removeButtonText}>Remove from Group</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        );
    };

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Manage Members</Text>
            <Text style={styles.description}>Tap a member to view details and remove them from the group.</Text>

            <TextInput
                style={styles.searchInput}
                placeholder="Search members by name..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonMemberCard key={i} />)
            ) : (
                <FlatList
                    data={filteredMembers}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 16 }}
                />
            )}
            {renderModal()}
        </View>
    );
}

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
    searchInput: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 16,
        color: '#333',
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1f2937',
        borderRadius: 10,
        padding: 15,
        marginVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    memberInfo: {
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f9fafb',
    },
    role: {
        fontSize: 14,
        color: '#d1d5db',
        marginTop: 2,
    },
    manageButton: {
        backgroundColor: '#007bff',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 15,
    },
    manageButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        padding: 16,
    },
    modalContent: {
        backgroundColor: '#374151',
        borderRadius: 15,
        padding: 20,
        maxHeight: '90%',
    },
    closeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        padding: 6,
    },
    closeButtonText: {
        fontSize: 20,
        color: '#f9fafb',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalAvatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginRight: 15,
    },
    modalName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#f9fafb',
    },
    modalRole: {
        fontSize: 16,
        color: '#9ca3af',
        marginTop: 4,
    },
    detailCard: {
        backgroundColor: '#4b5563',
        borderRadius: 12,
        padding: 15,
        marginBottom: 16,
    },
    cardHeader: {
        fontSize: 18,
        fontWeight: '600',
        color: '#f3f4f6',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#9ca3af',
        paddingBottom: 6,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    icon: {
        fontSize: 16,
        marginRight: 6,
        color: '#d1d5db',
    },
    detailLabel: {
        fontWeight: '600',
        color: '#f3f4f6',
        marginRight: 8,
        minWidth: 130,
    },
    detailText: {
        color: '#e5e7eb',
        flexShrink: 1,
    },
    pickerContainer: {
        flex: 1,
        backgroundColor: '#6b7280',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    picker: {
        height: 35,
        color: '#f9fafb',
    },
    toggleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#9ca3af',
        paddingBottom: 6,
    },
    dropdownSubHeading: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f9fafb',
    },
    removeButton: {
        backgroundColor: '#dc2626',
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 20,
        alignItems: 'center',
    },
    removeButtonText: {
        color: '#f9fafb',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
