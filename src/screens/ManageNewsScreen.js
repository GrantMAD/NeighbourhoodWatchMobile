import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Image,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import Toast from '../components/Toast';

const ManageNewsScreen = ({ route, navigation }) => {
    const { groupId } = route.params;
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

    const fetchNews = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('groups')
            .select('news')
            .eq('id', groupId)
            .single();

        if (data?.news) {
            const sortedNews = [...data.news].sort(
                (a, b) => new Date(b.date) - new Date(a.date)
            );
            setNews(sortedNews);
        } else if (error) {
            setToast({ visible: true, message: "Error fetching news: " + error.message, type: "error" });
        }
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            fetchNews();
        }, [groupId])
    );

    const handleDelete = async (storyId) => {
        Alert.alert(
            "Delete Story",
            "Are you sure you want to delete this news story?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "OK", onPress: async () => {
                        const { data, error } = await supabase
                            .from('groups')
                            .select('news')
                            .eq('id', groupId)
                            .single();

                        if (error) {
                            setToast({ visible: true, message: "Error: Failed to fetch news for deletion.", type: "error" });
                            return;
                        }

                        const updatedNews = data.news.filter(story => story.id !== storyId);

                        const { error: updateError } = await supabase
                            .from('groups')
                            .update({ news: updatedNews })
                            .eq('id', groupId);

                        if (updateError) {
                            setToast({ visible: true, message: "Error: Failed to delete news story.", type: "error" });
                        } else {
                            setNews(updatedNews);
                            setToast({ visible: true, message: "News story deleted successfully.", type: "success" });
                        }
                    }
                }
            ]
        );
    };

    const SkeletonCard = () => (
        <View style={styles.skeletonCard}>
            <View style={styles.skeletonImage} />
            <View style={styles.skeletonContent}>
                <View style={styles.skeletonTitle} />
                <View style={styles.skeletonDateRow} />
                <View style={styles.skeletonButtonsRow}>
                    <View style={styles.skeletonButton} />
                    <View style={styles.skeletonButton} />
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <ScrollView contentContainerStyle={styles.scrollViewContent} style={styles.container}>
                <View style={styles.headerRow}>
                    <View style={styles.headingContainer}>
                        <Text style={styles.headingIcon}>📰</Text>
                        <Text style={styles.mainHeading}>Manage News</Text>
                    </View>
                </View>
                <Text style={styles.description}>Loading news stories...</Text>
                {[...Array(3)].map((_, idx) => (
                    <SkeletonCard key={idx} />
                ))}
            </ScrollView>
        );
    }

    return (
        <>
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast({ ...toast, visible: false })}
            />
            <ScrollView contentContainerStyle={styles.scrollViewContent} style={styles.container}>
                <View style={styles.headerRow}>
                    <View style={styles.headingContainer}>
                        <Text style={styles.headingIcon}>📰</Text>
                        <Text style={styles.mainHeading}>Manage News</Text>
                    </View>
                </View>

                <Text style={styles.description}>Here you can edit or delete the news stories for your group.</Text>

                {news.length === 0 ? (
                    <Text style={styles.noNewsText}>No news stories found.</Text>
                ) : (
                    news.map((story, index) => (
                        <TouchableOpacity
                            key={story.id ?? index.toString()}
                            style={styles.eventCard}
                            activeOpacity={0.85}
                        >
                            <View style={styles.eventCardLeft}>
                                {story.image && story.image !== '📰' ? (
                                    <Image source={{ uri: story.image }} style={styles.eventCardImage} />
                                ) : (
                                    <View style={styles.eventCardEmojiCircle}>
                                        <Text style={styles.eventCardEmoji}>📰</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.eventCardRight}>
                                <View style={{ marginBottom: 8 }}>
                                    <Text style={styles.eventTitle}>{story.title}</Text>
                                </View>
                                <View style={styles.eventMetaContainer}>
                                    <Text style={styles.eventIcon}>📅</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.eventDateText}>
                                            {new Date(story.date).toLocaleDateString("en-US", {
                                                weekday: "long",
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.buttonsRow}>
                                    <TouchableOpacity
                                        style={[styles.button, styles.editButton]}
                                        onPress={() => navigation.navigate('AddNewsScreen', {
                                            groupId,
                                            storyToEdit: story,
                                            onStoryUpdated: (message) => {
                                                setToast({ visible: true, message, type: "success" });
                                            }
                                        })}
                                    >
                                        <Text style={styles.buttonText}>Edit</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.button, styles.deleteButton]}
                                        onPress={() => handleDelete(story.id)}
                                    >
                                        <Text style={styles.buttonText}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', // White background
        paddingTop: 40,
        paddingHorizontal: 20,
    },
    scrollViewContent: {
        paddingBottom: 80,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    headingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headingIcon: {
        fontSize: 28,
        marginRight: 12,
    },
    mainHeading: {
        fontSize: 30,
        fontWeight: '700',
        color: '#000',
    },
    description: {
        fontSize: 16,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 24,
    },
    noNewsText: {
        color: '#64748b',
        fontSize: 18,
        textAlign: 'center',
        marginTop: 60,
    },

    eventCard: {
        flexDirection: "row",
        backgroundColor: "#1f2937", // Dark cards
        borderRadius: 16,
        marginBottom: 18,
        alignItems: "flex-start",
        height: 140,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    eventCardLeft: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 14,
        overflow: "hidden",
        backgroundColor: "#374151",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 6,
        borderWidth: 2,
        borderColor: "#17609bff",
    },
    eventCardImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        resizeMode: "cover",
    },
    eventCardEmojiCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#374151",
        justifyContent: "center",
        alignItems: "center",
    },
    eventCardEmoji: {
        fontSize: 24,
    },
    eventCardRight: {
        flex: 1,
        justifyContent: "space-between",
    },
    eventTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#fff",
    },
    eventMetaContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    eventIcon: {
        fontSize: 22,
        marginRight: 8,
        color: "#9ca3af",
    },
    eventDateText: {
        color: "#d1d5db",
        fontSize: 12,
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 8,
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 24,
        borderRadius: 30,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 6,
        marginRight: 12,
    },
    editButton: {
        borderColor: '#2563eb',
        backgroundColor: 'transparent',
    },
    deleteButton: {
        borderColor: '#dc2626',
        backgroundColor: 'transparent',
    },
    buttonText: {
        fontWeight: '600',
        fontSize: 16,
        color: '#e0e7ff',
    },

    skeletonCard: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        marginBottom: 20,
        overflow: 'hidden',
    },
    skeletonImage: {
        width: '100%',
        height: 160,
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
    },
    skeletonContent: {
        padding: 16,
        backgroundColor: '#f9f9f9',
    },
    skeletonTitle: {
        width: '70%',
        height: 24,
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
        marginBottom: 12,
    },
    skeletonDateRow: {
        width: '50%',
        height: 18,
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
        marginBottom: 16,
    },
    skeletonButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    skeletonButton: {
        width: 80,
        height: 32,
        backgroundColor: '#e0e0e0',
        borderRadius: 30,
        marginRight: 12,
    },
});

export default ManageNewsScreen;
