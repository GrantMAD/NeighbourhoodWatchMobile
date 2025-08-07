import React, { useState, useCallback } from 'react';
import {
    Alert,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    View,
    Text,
    Image,
    StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import Toast from '../components/Toast';

const ManageNewsScreen = ({ route, navigation }) => {
    const { groupId } = route.params;
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
    const [editingStoryId, setEditingStoryId] = useState(null);
    const [deletingStoryId, setDeletingStoryId] = useState(null);

    const fetchNews = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('groups')
            .select('news')
            .eq('id', groupId)
            .single();

        if (data?.news) {
            const colors = [
                "#ffadad", "#ffd6a5", "#fdffb6", "#caffbf",
                "#9bf6ff", "#a0c4ff", "#bdb2ff", "#ffc6ff",
            ];
            const newsWithColors = data.news.map((story, index) => ({
                ...story,
                color: colors[index % colors.length],
            }));
            const sortedNews = [...newsWithColors].sort(
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
            if (route.params?.toastMessage) {
                setToast({ visible: true, message: route.params.toastMessage, type: "success" });
                navigation.setParams({ toastMessage: null });
            }
            fetchNews();
            setEditingStoryId(null); // Reset editing state when screen gains focus
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
                        setDeletingStoryId(storyId);
                        const { data, error } = await supabase
                            .from('groups')
                            .select('news')
                            .eq('id', groupId)
                            .single();

                        if (error) {
                            setToast({ visible: true, message: "Error: Failed to fetch news for deletion.", type: "error" });
                            setDeletingStoryId(null);
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
                        setDeletingStoryId(null);
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
                            style={styles.cardTouchable}
                            activeOpacity={0.9}
                        >
                            <View style={[styles.eventCard, { borderLeftColor: story.color || '#374151' }]}>
                                <View style={styles.eventImageContainer}>
                                    {story.image && (story.image.startsWith('http://') || story.image.startsWith('https://')) ? (
                                        <Image source={{ uri: story.image }} style={styles.eventImage} resizeMode="cover" />
                                    ) : (
                                        <Text style={styles.eventEmoji}>{story.image || '📰'}</Text>
                                    )}
                                </View>
                                <View style={styles.eventTextContainer}>
                                    <Text style={styles.eventTitle}>{story.title}</Text>
                                    <Text style={styles.eventTime}>📅 {new Date(story.date).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                    })}</Text>
                                    <Text style={styles.eventMessage} numberOfLines={2}>{story.content}</Text>
                                    <View style={styles.buttonsRow}>
                                        <TouchableOpacity
                                            style={[styles.button, styles.editButton]}
                                            onPress={() => {
                                                setEditingStoryId(story.id);
                                                navigation.navigate('AddNewsScreen', {
                                                    groupId,
                                                    storyToEdit: story,
                                                    returnTo: { screen: 'ManageNewsScreen' }
                                                });
                                            }}
                                        >
                                            {editingStoryId === story.id ? (
                                                <ActivityIndicator size="small" color="#F1F5F9" />
                                            ) : (
                                                <Text style={styles.buttonText}>Edit</Text>
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.button, styles.deleteButton]}
                                            onPress={() => handleDelete(story.id)}
                                        >
                                            {deletingStoryId === story.id ? (
                                                <ActivityIndicator size="small" color="#F1F5F9" />
                                            ) : (
                                                <Text style={styles.buttonText}>Delete</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
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

    cardTouchable: {
        marginHorizontal: 4,
    },
    eventCard: {
        flexDirection: 'row',
        backgroundColor: '#1f2937',
        borderRadius: 16,
        padding: 12,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 5,
    },
    eventImageContainer: {
        width: 52,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        backgroundColor: '#475569',
    },
    eventEmoji: {
        fontSize: 26,
    },
    eventImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    eventTextContainer: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 4,
    },
    eventTime: {
        fontSize: 14,
        color: '#ffffff',
        marginBottom: 6,
    },
    eventMessage: {
        fontSize: 14,
        color: '#ffffff',
        lineHeight: 20,
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16,
    },
    button: {
        paddingVertical: 6,
        paddingHorizontal: 18,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    editButton: {
        backgroundColor: '#2563EB',
    },
    deleteButton: {
        backgroundColor: '#DC2626',
    },
    buttonText: {
        fontWeight: '600',
        fontSize: 14,
        color: '#F1F5F9',
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
