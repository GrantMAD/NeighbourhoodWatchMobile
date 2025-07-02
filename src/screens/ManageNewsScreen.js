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

    const fetchNews = async () => {
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
                news.map((story, index) => {
                    return (
                        <View key={index} style={styles.newsCard}>
                            {story.image && (
                                <Image source={{ uri: story.image }} style={styles.newsImage} />
                            )}
                            <View style={styles.newsTitleContainer}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <Text style={{ fontSize: 18, marginRight: 8 }}>📰</Text>
                                    <Text style={styles.newsCardTitle}>{story.title}</Text>
                                </View>
                                <Text style={styles.newsDateText}>
                                    {new Date(story.date).toLocaleDateString()}
                                </Text>
                            </View>
                            <View style={styles.buttonContainer}>
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
                    );
                })
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        paddingTop: 40,
        paddingHorizontal: 20,
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingBottom: 80,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headingIcon: {
        marginRight: 8,
    },
    mainHeading: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
    },
    description: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        marginBottom: 16,
    },
    noNewsText: {
        color: '#6b7280',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
    },
    newsCard: {
        borderRadius: 8,
        marginVertical: 6,
        backgroundColor: '#333',
        overflow: 'hidden',
        position: 'relative',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    newsImage: {
        width: '100%',
        height: 180,
        borderRadius: 8,
    },
    newsCardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        padding: 10,
    },
    newsTitleContainer: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(31, 41, 55, 0.7)',
        padding: 10,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    newsDateText: {
        fontSize: 12,
        color: '#d1d5db',
        fontStyle: 'italic',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 10,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    editButton: {
        backgroundColor: '#2563eb',
    },
    deleteButton: {
        backgroundColor: '#dc2626',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default ManageNewsScreen;
