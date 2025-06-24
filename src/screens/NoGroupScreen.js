import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import { supabase } from '../../lib/supabase';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTrash, faBell } from '@fortawesome/free-solid-svg-icons';

export default function NoGroupScreen({ navigation }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pendingGroupName, setPendingGroupName] = useState(null);

    useEffect(() => {
        async function fetchUserStatus() {
            try {
                const userResponse = await supabase.auth.getUser();
                const user = userResponse.data?.user || null;

                if (!user) {
                    setNotifications([]);
                    setLoading(false);
                    setPendingGroupName(null);
                    return;
                }

                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('notifications, requestedgroupid')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    console.error('Error fetching profile:', profileError);
                    setNotifications([]);
                    setLoading(false);
                    setPendingGroupName(null);
                    return;
                }

                setNotifications(profileData?.notifications || []);

                if (profileData?.requestedgroupid) {
                    const { data: groupData, error: groupError } = await supabase
                        .from('groups')
                        .select('name')
                        .eq('id', profileData.requestedgroupid)
                        .single();

                    if (!groupError && groupData) {
                        setPendingGroupName(groupData.name);
                    } else {
                        setPendingGroupName('');
                    }
                } else {
                    setPendingGroupName(null);
                }

                setLoading(false);
            } catch (err) {
                console.error('Error in fetchUserStatus:', err);
                setNotifications([]);
                setLoading(false);
                setPendingGroupName(null);
            }
        }

        fetchUserStatus();
    }, []);

    const handleDeleteNotification = async (notifId) => {
        try {
            const userResponse = await supabase.auth.getUser();
            const user = userResponse.data?.user || null;
            if (!user) return;

            // Remove notification locally
            const newNotifications = notifications.filter((n) => n.id !== notifId);
            setNotifications(newNotifications);

            // Update notifications array in profile in Supabase
            const { error } = await supabase
                .from('profiles')
                .update({ notifications: newNotifications })
                .eq('id', user.id);

            if (error) {
                Alert.alert('Error', 'Failed to delete notification.');
                // Optionally revert state on failure:
                setNotifications(notifications);
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            Alert.alert('Error', 'Failed to delete notification.');
        }
    };

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            navigation.reset({
                index: 0,
                routes: [{ name: 'SignIn' }],
            });
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const hasDeclinedRequest = notifications.some(
        (notif) => notif.type === 'declined_request'
    );


    return (
        <View style={styles.container}>
            <Text style={styles.title}>You're not part of a group yet.</Text>

            {!pendingGroupName && (
                <>
                    <Text style={styles.description}>
                        To get started, you can either join an existing group or create your
                        own.
                    </Text>

                    {/* Notification area below the "To get started" text */}
                    {!loading && notifications.length > 0 && (
                        <View style={styles.notificationsSection}>
                            <Text style={styles.notificationsHeading}>You have a notification</Text>
                            <ScrollView style={styles.notificationsContainer}>
                                {notifications.map((notif) => (
                                    <View key={notif.id} style={styles.notificationCard}>
                                        <View style={styles.notificationContent}>
                                            <FontAwesomeIcon
                                                icon={faBell}
                                                size={18}
                                                color="#14b8a6"
                                                style={styles.notificationIcon}
                                            />
                                            <Text
                                                style={[
                                                    styles.notificationText,
                                                    !notif.read && styles.unreadNotificationText,
                                                ]}
                                            >
                                                {notif.message}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => handleDeleteNotification(notif.id)}
                                                style={styles.deleteIcon}
                                            >
                                                <FontAwesomeIcon icon={faTrash} size={20} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.notificationDate}>
                                            {new Date(notif.createdAt).toLocaleString()}
                                        </Text>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {hasDeclinedRequest && (
                        <Text style={styles.declinedMessage}>
                            If you'd like to request to join another group, press Continue.
                        </Text>
                    )}

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate('GroupAccess')}
                    >
                        <Text style={styles.buttonText}>Continue</Text>
                    </TouchableOpacity>
                </>
            )}

            {pendingGroupName && (
                <Text style={styles.pendingText}>
                    Your request to join "{pendingGroupName}" is pending approval.
                </Text>
            )}

            {!hasDeclinedRequest && (
                <TouchableOpacity
                    style={styles.statusButton}
                    onPress={() => navigation.navigate('WaitingStatusScreen')}
                >
                    <Text style={styles.statusButtonText}>View Join Request Status</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#1f2937',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: 'white',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: 'white',
    },

    notificationsSection: {
        marginBottom: 20,
    },
    notificationsHeading: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 10,
        color: 'white',
        textAlign: 'center',
    },
    notificationsContainer: {
        maxHeight: 200,
    },
    notificationCard: {
        backgroundColor: '#fefefe',
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
    },
    notificationContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    notificationIcon: {
        marginRight: 10,
    },
    notificationText: {
        fontSize: 15,
        color: '#333',
        flex: 1,
        paddingRight: 10,
    },
    unreadNotificationText: {
        fontWeight: 'bold',
    },
    notificationDate: {
        fontSize: 12,
        color: '#666',
        marginTop: 6,
        fontStyle: 'italic',
    },
    deleteIcon: {
        padding: 4,
    },
    button: {
        backgroundColor: '#14b8a6',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
    },
    pendingText: {
        fontSize: 16,
        color: 'white',
        fontWeight: '500',
        marginBottom: 20,
        textAlign: 'center',
    },
    signOutButton: {
        marginTop: 30,
        paddingVertical: 12,
        backgroundColor: '#ef4444',
        borderRadius: 8,
        alignItems: 'center',
    },
    signOutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    statusButton: {
        marginTop: 20,
        paddingVertical: 12,
        backgroundColor: '#14b8a6',
        borderRadius: 8,
        alignItems: 'center',
    },
    statusButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    declinedMessage: {
        marginBottom: 12,
        fontSize: 16,
        color: 'white',
        textAlign: 'center',
    },
});
