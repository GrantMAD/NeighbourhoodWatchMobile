import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function NoGroupScreen({ navigation }) {
    console.log('NoGroupScreen mounted');
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
                    setPendingGroupName(null); // Ensure it's cleared
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
                    setPendingGroupName(null); // Ensure it's cleared
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
                        setPendingGroupName(''); // Set to empty string if error
                    }
                } else {
                    setPendingGroupName(null); // Clear if no request
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

    return (
        <View style={styles.container}>
            <Text style={styles.title}>You're not part of a group yet.</Text>

            {/* Only show description and button if no pending request */}
            {!pendingGroupName && (
                <>
                    <Text style={styles.description}>
                        To get started, you can either join an existing group or create your own.
                    </Text>

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

            {!loading && (
                notifications.length === 0 ? (
                    <Text style={styles.noNotifications}>You currently have no notifications.</Text>
                ) : (
                    <ScrollView style={styles.notificationsContainer}>
                        {notifications.map((notif, index) => (
                            <View key={notif.id || index} style={styles.notification}>
                                <View style={styles.notificationHeader}>
                                    <Text
                                        style={[
                                            styles.notificationText,
                                            !notif.read && styles.unreadNotificationText,
                                        ]}
                                    >
                                        {notif.message}
                                    </Text>
                                    {!notif.read && <View style={styles.unreadDot} />}
                                </View>
                                <Text style={styles.notificationDate}>
                                    {new Date(notif.createdAt).toLocaleString()}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                )
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
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
        color: '#6b7280',
    },
    notificationsContainer: {
        maxHeight: 200,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 15,
        backgroundColor: '#fafafa',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    notification: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginBottom: 8,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    notificationText: {
        fontSize: 15,
        color: '#333',
        flex: 1,
    },
    unreadNotificationText: {
        fontWeight: 'bold',
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#007AFF',
        marginLeft: 8,
    },
    notificationDate: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
        fontStyle: 'italic',
    },
    noNotifications: {
        fontStyle: 'italic',
        color: '#999',
        marginBottom: 20,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#007AFF',
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
        color: '#d97706',
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
});
