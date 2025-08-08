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
                        <View key={story.id ?? index.toString()} style={[styles.newsCard, { borderLeftColor: story.color || '#374151' }]}>
                            {story.image && (story.image.startsWith('http://') || story.image.startsWith('https://')) ? (
                                <Image source={{ uri: story.image }} style={styles.newsImage} resizeMode="cover" />
                            ) : (
                                <View style={styles.placeholderImage}>
                                    <Text style={styles.placeholderEmoji}>📰</Text>
                                </View>
                            )}
                            <View style={styles.newsContent}>
                                <Text style={styles.newsTitle}>{story.title}</Text>
                                <Text style={styles.newsDate}>📅 {new Date(story.date).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                })}</Text>
                                <Text style={styles.newsStory} numberOfLines={3}>{story.content}</Text>
                                <View style={styles.buttonsRow}>
                                    <TouchableOpacity
                                        style={styles.iconButton}
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
                                            <ActivityIndicator size="small" color="#2563EB" />
                                        ) : (
                                            <>
                                                <Text style={styles.editIcon}>✏️</Text>
                                                <Text style={[styles.buttonText, { color: '#2563EB' }]}>Edit</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.iconButton}
                                        onPress={() => handleDelete(story.id)}
                                    >
                                        {deletingStoryId === story.id ? (
                                            <ActivityIndicator size="small" color="#DC2626" />
                                        ) : (
                                            <>
                                                <Text style={styles.deleteIcon}>🗑️</Text>
                                                <Text style={[styles.buttonText, { color: '#DC2626' }]}>Delete</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollViewContent: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingBottom: 80,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
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
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 24,
    },
    noNewsText: {
        color: '#64748b',
        fontSize: 18,
        textAlign: 'center',
        marginTop: 60,
    },
    newsCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        marginVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        borderLeftWidth: 4,
        overflow: 'hidden',
    },
    newsImage: {
        width: '100%',
        height: 180,
    },
    placeholderImage: {
        width: '100%',
        height: 180,
        backgroundColor: '#1f2937',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderEmoji: {
        fontSize: 60,
    },
    newsContent: {
        padding: 16,
    },
    newsTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 8,
    },
    newsDate: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 12,
    },
    newsStory: {
        fontSize: 16,
        color: '#495057',
        lineHeight: 24,
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
        paddingTop: 12,
    },
    iconButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 20,
    },
    editIcon: {
        fontSize: 18,
        marginRight: 6,
    },
    deleteIcon: {
        fontSize: 18,
        marginRight: 6,
    },
    buttonText: {
        fontWeight: '600',
        fontSize: 16,
    },
    skeletonCard: {
        backgroundColor: '#f0f0f0',
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
    },
    skeletonImage: {
        width: '100%',
        height: 180,
        backgroundColor: '#e0e0e0',
    },
    skeletonContent: {
        padding: 16,
    },
    skeletonTitle: {
        width: '80%',
        height: 28,
        backgroundColor: '#d0d0d0',
        borderRadius: 8,
        marginBottom: 12,
    },
    skeletonDateRow: {
        width: '60%',
        height: 20,
        backgroundColor: '#d0d0d0',
        borderRadius: 6,
        marginBottom: 16,
    },
    skeletonButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 12,
    },
    skeletonButton: {
        width: 90,
        height: 36,
        backgroundColor: '#d0d0d0',
        borderRadius: 8,
        marginLeft: 12,
    },
});

export default ManageNewsScreen;
