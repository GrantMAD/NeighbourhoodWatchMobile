// Redesigned HomeScreen with modern look, improved cards, and better visual structure
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";

export default function HomeScreen({ route, navigation }) {
  const groupId = route.params?.groupId;
  const [groupData, setGroupData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [news, setNews] = useState([]);
  const [userRole, setUserRole] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const fetchGroupData = async () => {
        if (!groupId) return;
        setIsLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (!error) setUserRole(profile.role);
        }

        const { data, error } = await supabase
          .from("groups")
          .select("welcome_text, main_image, events, news, name")
          .eq("id", groupId)
          .single();

        if (!error) {
          setGroupData(data);
          setEvents(data.events || []);
          setNews(data.news || []);
        }

        setIsLoading(false);
      };

      fetchGroupData();
    }, [groupId])
  );

  if (isLoading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color="#4338ca" /></View>
    );
  }

  if (!groupId || !groupData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No group data available. Please rejoin or create a group.</Text>
      </View>
    );
  }

  const formatTimeRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `🕒 ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollPadding}>
      {/* Header Section */}
      {groupData.main_image && (
        <Image source={{ uri: groupData.main_image }} style={styles.headerImage} />
      )}

      {/* Welcome Section */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>👋 Welcome to {groupData.name}</Text>
        <Text style={styles.welcomeText}>{groupData.welcome_text || "Update your welcome text in settings."}</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("ContactScreen")}
        >
          <Text style={styles.primaryButtonText}>Contact Us</Text>
        </TouchableOpacity>
      </View>

      {/* Events Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🗓️ Upcoming Events</Text>
          {userRole === 'Admin' && (
            <TouchableOpacity
              onPress={() => navigation.navigate("AddEventScreen", { groupId })}
            >
              <Text style={styles.link}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={events}
          keyExtractor={(item, index) => item.id || index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("Events", { groupId, selectedEvent: item })}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.cardImage} />
              ) : (
                <View style={styles.emojiIconContainer}><Text style={styles.emojiIcon}>🗓️</Text></View>
              )}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSub}>{formatTimeRange(item.startDate, item.endDate)}</Text>
                <Text numberOfLines={2} style={styles.cardDescription}>{item.message}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* News Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📰 Community News</Text>
          {userRole === 'Admin' && (
            <TouchableOpacity
              onPress={() => navigation.navigate("AddNewsScreen", { groupId })}
            >
              <Text style={styles.link}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>
        {news.map((story, index) => (
          <TouchableOpacity
            key={story.id || index}
            style={styles.newsCard}
            onPress={() => navigation.navigate("NewsScreen", { groupId, selectedStory: story })}
          >
            <Text style={styles.newsTitle}>{story.title}</Text>
            <Text style={styles.newsContent} numberOfLines={3}>{story.content}</Text>
            <View style={styles.newsFooter}>
              <Text style={styles.newsMeta}>👁️ {story.views || 0} views</Text>
              <Text style={styles.newsMeta}>🗓️ {new Date(story.date).toLocaleDateString('en-US')}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollPadding: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
  },
  headerImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  welcomeCard: {
    backgroundColor: '#1f2937',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#d1d5db',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  link: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 120,
  },
  emojiIconContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
  },
  emojiIcon: {
    fontSize: 50,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    color: '#111827',
  },
  cardSub: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#374151',
  },
  newsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 1,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  newsContent: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  newsMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
});