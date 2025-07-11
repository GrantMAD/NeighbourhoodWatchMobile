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

const ManageNewsScreen = ({ route, navigation }) => {
    const { groupId } = route.params;
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

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
            console.error("Error fetching news:", error.message);
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
                            Alert.alert("Error", "Failed to fetch news for deletion.");
                            return;
                        }

                        const updatedNews = data.news.filter(story => story.id !== storyId);

                        const { error: updateError } = await supabase
                            .from('groups')
                            .update({ news: updatedNews })
                            .eq('id', groupId);

                        if (updateError) {
                            Alert.alert("Error", "Failed to delete news story.");
                        } else {
                            setNews(updatedNews);
                            Alert.alert("Success", "News story deleted successfully.");
                        }
                    }
                }
            ]
        );
    };

    // Skeleton card styled like ManageEventsScreen / MembersScreen loading placeholders
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
                    <View key={story.id ?? index.toString()} style={styles.card}>
                        {story.image && story.image !== '📰' ? (
                            <Image source={{ uri: story.image }} style={styles.cardImage} />
                        ) : (
                            <View style={[styles.cardImage, styles.noImage, styles.emojiContainer]}>
                                <Text style={styles.emoji}>📰</Text>
                            </View>
                        )}

                        <View style={styles.overlay} />

                        <View style={styles.cardContent}>
                            <Text style={styles.newsTitle} numberOfLines={2}>
                                {story.title}
                            </Text>

                            <View style={styles.dateRow}>
                                <Text style={styles.dateIcon}>📅</Text>
                                <Text style={styles.dateText}>
                                    {new Date(story.date).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </Text>
                            </View>

                            <View style={styles.buttonsRow}>
                                <TouchableOpacity
                                    style={[styles.button, styles.editButton]}
                                    onPress={() => navigation.navigate('AddNewsScreen', { groupId, storyToEdit: story })}
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
                    </View>
                ))
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
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

    // Card styles matching ManageEventsScreen
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 10,
    },
    cardImage: {
        width: '100%',
        height: 160,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    noImage: {
        backgroundColor: '#475569',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emojiContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    emoji: {
        fontSize: 64,
        color: '#94a3b8',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    cardContent: {
        padding: 16,
        backgroundColor: 'rgba(31, 41, 55, 0.9)',
    },
    newsTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#e0e7ff',
        marginBottom: 8,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    dateIcon: {
        fontSize: 18,
        color: '#60a5fa',
        marginRight: 6,
    },
    dateText: {
        fontSize: 15,
        color: '#cbd5e1',
        fontWeight: '500',
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
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

    // Skeleton styles matching ManageEventsScreen
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
