import React, { useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

const NewsScreen = ({ route }) => {
  const { groupId } = route.params;
  const [news, setNews] = useState([]);

  const fetchNews = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('news')
      .eq('id', groupId)
      .single();

    if (data?.news) {
      setNews(data.news);
    } else if (error) {
      console.error('Error fetching news:', error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNews();
    }, [groupId])
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.mainHeading}>News</Text>
      <Text style={styles.description}>
        Stay informed with the latest updates, announcements, and stories in your group.
      </Text>

      <Text style={styles.header}>Latest Stories</Text>
      {news.length === 0 ? (
        <Text>No news stories found.</Text>
      ) : (
        news.map((story, index) => {
          console.log('Raw story.image:', story.image);

          return (
            <View key={index} style={styles.card}>
              <Text style={styles.title}>{story.title}</Text>
              <Text style={styles.message}>{story.content}</Text>

              {story.image && (
                <>
                  {console.log('Using image URL:', story.image)}
                  <Image
                    source={{ uri: story.image }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </>
              )}

              {story.date && (
                <Text style={styles.date}>
                  {new Date(story.date).toLocaleDateString()}
                </Text>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  mainHeading: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#222',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  card: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  title: { fontSize: 16, fontWeight: 'bold' },
  message: { marginTop: 4 },
  image: { height: 200, width: '100%', marginTop: 8, borderRadius: 8 },
  date: { color: 'gray', marginTop: 4 },
});

export default NewsScreen;
