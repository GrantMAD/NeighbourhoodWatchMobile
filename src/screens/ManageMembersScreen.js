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
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
    faChevronDown,
    faChevronUp,
    faPhone,
    faMapMarkerAlt,
    faUser,
    faEnvelope,
    faIdCard,
    faClock,
    faTrash,
} from '@fortawesome/free-solid-svg-icons';
import Toast from 'react-native-simple-toast';

const defaultAvatar = require('../../assets/Images/user.png');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ManageMembersScreen() {
    const [members, setMembers] = useState([]);
    const [expandedMemberIds, setExpandedMemberIds] = useState([]);
    const [groupId, setGroupId] = useState(null);
    const [checkInAnimations, setCheckInAnimations] = useState({});
    const [checkOutAnimations, setCheckOutAnimations] = useState({});

    const fetchGroupAndMembers = async () => {
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) return;

        const currentUserId = user.id;

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('group_id')
            .eq('id', currentUserId)
            .single();

        if (profileError || !profile?.group_id) return;

        setGroupId(profile.group_id);

        const { data: group, error: groupError } = await supabase
            .from('groups')
            .select('users')
            .eq('id', profile.group_id)
            .single();

        if (groupError || !group?.users) return;

        const { data: memberProfiles, error: membersError } = await supabase
            .from('profiles')
            .select('id, group_id, name, email, avatar_url, number, street, emergency_contact, check_in_time, check_out_time')
            .in('id', group.users);

        if (membersError) {
            console.error('Failed to fetch members:', membersError);
            return;
        }

        // FILTER OUT current user
        const filteredMembers = memberProfiles.filter(m => m.id !== currentUserId);

        setMembers(filteredMembers);

        const newCheckIn = {};
        const newCheckOut = {};
        filteredMembers.forEach(m => {
            newCheckIn[m.id] = new Animated.Value(0);
            newCheckOut[m.id] = new Animated.Value(0);
        });
        setCheckInAnimations(newCheckIn);
        setCheckOutAnimations(newCheckOut);
    };

    useEffect(() => {
        fetchGroupAndMembers();
    }, []);

    const toggleDropdown = (id) => {
        setExpandedMemberIds((prev) => {
            const newExpanded = prev.includes(id)
                ? prev.filter((i) => i !== id)
                : [...prev, id];
            console.log('toggleDropdown called:', id, newExpanded);
            return newExpanded;
        });
    };

    const toggleCheckIn = (id) => {
        Animated.timing(checkInAnimations[id], {
            toValue: checkInAnimations[id]._value === 0 ? 1 : 0,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
        }).start();
    };

    const toggleCheckOut = (id) => {
        Animated.timing(checkOutAnimations[id], {
            toValue: checkOutAnimations[id]._value === 0 ? 1 : 0,
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
            const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (!acc[key]) acc[key] = [];
            acc[key].push(time);
            return acc;
        }, {});
    };

    const handleRemoveMember = async (member) => {
        const userId = member?.id;
        const groupId = member?.group_id;

        if (!userId || !groupId) {
            Alert.alert("Error", "User or group information missing.");
            return;
        }

        try {
            // Step 1: Remove group_id from the user's profile
            const { error: profileUpdateError } = await supabase
                .from("profiles")
                .update({ group_id: null })
                .eq("id", userId);

            if (profileUpdateError) {
                console.error("Failed to update user profile:", profileUpdateError);
                Alert.alert("Error", "Failed to update user profile.");
                return;
            }

            // Step 2: Fetch current group users
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

            // Step 3: Remove user from group's users array
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

            // Show success toast
            Toast.show('User has been removed');

            // Step 4: Refresh list
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

    const renderItem = ({ item }) => {
        const isExpanded = expandedMemberIds.includes(item.id);

        return (
            <TouchableOpacity
                onPress={() => toggleDropdown(item.id)}
                activeOpacity={0.9}
                style={styles.memberCard}
            >
                <View style={styles.mainRow}>
                    <Image source={item.avatar_url ? { uri: item.avatar_url } : defaultAvatar} style={styles.avatar} />
                    <View style={{ flex: 1, flexDirection: 'row' }}>
                        <FontAwesomeIcon icon={faUser} size={16} color="#fff" style={{ marginRight: 6, marginTop: 2 }} />
                        <Text style={styles.name}>{item.name || 'No Name'}</Text>
                    </View>
                    <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} size={18} color="#fff" />
                </View>

                {isExpanded && (
                    <View style={styles.dropdown}>
                        <Text style={styles.dropdownHeading}>User Information</Text>

                        <View style={styles.detailRow}>
                            <FontAwesomeIcon icon={faPhone} size={16} style={styles.icon} />
                            <Text style={styles.detailLabel}>Contact:</Text>
                            <Text style={styles.detailText}>{item.number || '-'}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <FontAwesomeIcon icon={faEnvelope} size={16} style={styles.icon} />
                            <Text style={styles.detailLabel}>Email:</Text>
                            <Text style={styles.detailText}>{item.email || '-'}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <FontAwesomeIcon icon={faIdCard} size={16} style={styles.icon} />
                            <Text style={styles.detailLabel}>Emergency Contact:</Text>
                            <Text style={styles.detailText}>{item.emergency_contact || '-'}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <FontAwesomeIcon icon={faMapMarkerAlt} size={16} style={styles.icon} />
                            <Text style={styles.detailLabel}>Street:</Text>
                            <Text style={styles.detailText}>{item.street || '-'}</Text>
                        </View>

                        {/* Check-in */}
                        <TouchableOpacity onPress={() => toggleCheckIn(item.id)} style={styles.toggleHeader}>
                            <View style={styles.iconTextRow}>
                                <FontAwesomeIcon icon={faClock} size={16} style={styles.icon} />
                                <Text style={styles.dropdownSubHeading}>Check-in Times</Text>
                            </View>
                            <FontAwesomeIcon
                                icon={checkInAnimations[item.id]?._value === 1 ? faChevronUp : faChevronDown}
                            />
                        </TouchableOpacity>

                        <Animated.View
                            style={{
                                overflow: 'hidden',
                                height: checkInAnimations[item.id]?.interpolate({ inputRange: [0, 1], outputRange: [0, 150] }),
                                opacity: checkInAnimations[item.id]?.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
                                marginLeft: 10,
                                marginBottom: 10,
                            }}
                        >
                            {(Array.isArray(item.check_in_time) && item.check_in_time.length > 0) ? (
                                Object.entries(groupByDayWithDate(item.check_in_time)).map(([day, times]) => (
                                    <View key={day} style={{ marginBottom: 6 }}>
                                        <Text style={{ fontWeight: '700', color: '#555' }}>{day}</Text>
                                        {times.map((t, i) => (
                                            <Text key={i} style={{ color: '#666', marginLeft: 10 }}>• {t}</Text>
                                        ))}
                                    </View>
                                ))
                            ) : (
                                <Text style={{ color: '#999' }}>No check-ins</Text>
                            )}
                        </Animated.View>

                        {/* Check-out */}
                        <TouchableOpacity onPress={() => toggleCheckOut(item.id)} style={styles.toggleHeader}>
                            <View style={styles.iconTextRow}>
                                <FontAwesomeIcon icon={faClock} size={16} style={styles.icon} />
                                <Text style={styles.dropdownSubHeading}>Check-out Times</Text>
                            </View>
                            <FontAwesomeIcon
                                icon={checkOutAnimations[item.id]?._value === 1 ? faChevronUp : faChevronDown}
                            />
                        </TouchableOpacity>

                        <Animated.View
                            style={{
                                overflow: 'hidden',
                                height: checkOutAnimations[item.id]?.interpolate({ inputRange: [0, 1], outputRange: [0, 150] }),
                                opacity: checkOutAnimations[item.id]?.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
                                marginLeft: 10,
                                marginBottom: 10,
                            }}
                        >
                            {(Array.isArray(item.check_out_time) && item.check_out_time.length > 0) ? (
                                Object.entries(groupByDayWithDate(item.check_out_time)).map(([day, times]) => (
                                    <View key={day} style={{ marginBottom: 6 }}>
                                        <Text style={{ fontWeight: '700', color: '#555' }}>{day}</Text>
                                        {times.map((t, i) => (
                                            <Text key={i} style={{ color: '#666', marginLeft: 10 }}>• {t}</Text>
                                        ))}
                                    </View>
                                ))
                            ) : (
                                <Text style={{ color: '#999' }}>No check-outs</Text>
                            )}
                        </Animated.View>

                        <TouchableOpacity
                            onPress={() => confirmRemoveMember(item)}
                            style={styles.removeButton}
                        >
                            <Text style={styles.removeButtonText}>Remove from Group</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Manage Members</Text>
            <Text style={styles.description}>Tap a member to view details and remove them from the group.</Text>

            <FlatList
                data={members}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 16 }}
            />
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
    dropdown: {
        backgroundColor: '#f9f9f9',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
    },
    dropdownHeading: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
        color: '#333',
        textDecorationLine: 'underline',
    },
    dropdownSubHeading: {
        fontSize: 16,
        fontWeight: '600',
        color: '#444',
        marginRight: 6,
    },
    toggleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 6,
        paddingVertical: 4,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    icon: {
        marginRight: 8,
        width: 20,
        textAlign: 'center',
        color: '#555',
    },
    detailLabel: {
        fontWeight: '600',
        marginRight: 6,
        color: '#333',
        width: 120,
    },
    detailText: {
        flex: 1,
        fontSize: 14,
        color: '#666',
    },
    iconTextRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    removeButton: {
        marginTop: 10,
        backgroundColor: '#ef4444',
        paddingVertical: 10,
        borderRadius: 6,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});
