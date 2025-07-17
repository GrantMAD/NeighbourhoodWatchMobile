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
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import Toast from "../components/Toast";

const LoadingState = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.scrollPadding}>
    <View style={styles.loadingHeaderImage} />
    <View style={styles.loadingWelcomeCard} />
    <View style={styles.section}>
      <View style={styles.loadingSectionHeader} />
      <View style={{ flexDirection: 'row' }}>
        <View style={styles.loadingCard} />
        <View style={styles.loadingCard} />
      </View>
    </View>
    <View style={styles.section}>
      <View style={styles.loadingSectionHeader} />
      <View style={styles.loadingNewsCard} />
      <View style={styles.loadingNewsCard} />
    </View>
  </ScrollView>
);

const formatTime = (date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDate = (date) =>
  date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export default function HomeScreen({ route, navigation }) {
  const groupId = route.params?.groupId;
  const [groupData, setGroupData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [news, setNews] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const fetchGroupData = async () => {
    if (!groupId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('id', user.id)
        .single();
      if (!error) {
        setUserRole(profile.role);
        setUserName(profile.name);
      }
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
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGroupData();
    setRefreshing(false);
  }, [groupId]);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.toastMessage) {
        setToast({ visible: true, message: route.params.toastMessage, type: "success" });
        // Clear the param after showing the toast
        navigation.setParams({ toastMessage: null }); 
      }
      setIsLoading(true);
      fetchGroupData().finally(() => setIsLoading(false));
    }, [groupId, route.params?.toastMessage])
  );

  if (isLoading) {
    return <LoadingState />;
  }

  if (!groupId || !groupData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No group data available. Please rejoin or create a group.</Text>
      </View>
    );
  }

  return (
    <>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prevToast => ({ ...prevToast, visible: false }))}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollPadding}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {/* Header Section */}
      {groupData.main_image && (
        <Image source={{ uri: groupData.main_image }} style={styles.headerImage} />
      )}

      {/* Welcome Section */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>👋 Welcome, {userName}</Text>
        <View style={styles.groupNameHighlight}>
          <Text style={styles.groupNameText}>🏡 {groupData.name}</Text>
        </View>
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
              onPress={() => navigation.navigate("AddEventScreen", {
                groupId,
                returnTo: { tab: 'Home' }
              })}
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
                <Text style={styles.cardDateLabel}>🕒 Start:</Text>
                <View style={styles.cardDateRow}>
                  <Text style={styles.cardDateText}>{formatDate(new Date(item.startDate))}, {formatTime(new Date(item.startDate))}</Text>
                </View>
                <Text style={styles.cardDateLabel}>🕒 End:</Text>
                <View style={styles.cardDateRow2}>
                  <Text style={styles.cardDateText}>{formatDate(new Date(item.endDate))}, {formatTime(new Date(item.endDate))}</Text>
                </View>
                <Text numberOfLines={2} style={styles.cardDescription}>{item.message}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <Text style={styles.noDataText}>No upcoming events.</Text>
          )}
        />
      </View>

      {/* News Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📰 Community News</Text>
          {userRole === 'Admin' && (
            <TouchableOpacity
              onPress={() => navigation.navigate("AddNewsScreen", {
                groupId,
                returnTo: { tab: 'News' }
              })}
            >
              <Text style={styles.link}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>
        {news.length > 0 ? (
          news.map((story, index) => (
            <TouchableOpacity
              key={story.id || index}
              style={styles.newsCard}
              onPress={() => navigation.navigate("NewsScreen", { groupId, selectedStory: story })}
            >
              {story.image ? (
                <Image source={{ uri: story.image }} style={styles.newsImage} />
              ) : (
                <View style={styles.newsEmojiContainer}><Text style={styles.newsEmoji}>📰</Text></View>
              )}
              <View style={styles.newsContent}>
                <Text style={styles.newsTitle}>{story.title}</Text>
                <Text style={styles.newsDescription} numberOfLines={3}>{story.content}</Text>
                <View style={styles.newsFooter}>
                  <Text style={styles.newsMeta}>👁️ {story.views || 0} views</Text>
                  <Text style={styles.newsMeta}>🗓️ {new Date(story.date).toLocaleDateString('en-US')}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noDataText}>No news stories.</Text>
        )}
      </View>     
      </ScrollView>
    </>
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
  groupNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d1d5db',
  },
  groupNameHighlight: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginBottom: 16,
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
  cardDateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  cardDateLabel: {
    fontSize: 12,
    color: 'black',
    marginTop: 4,
    fontWeight: '600',
  },
  cardDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDateRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  newsCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 1,
    overflow: 'hidden',
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: 6,
  },
  newsContent: {
    padding: 16,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  newsMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  newsImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  newsEmojiContainer: {
    width: '100%',
    height: 150,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  newsEmoji: {
    fontSize: 60,
  },
  newsDescription: {
    paddingBottom: 8,
    fontSize: 14,
    color: '#d1d5db',
  },
  noDataText: {
    textAlign: 'left',
    color: '#6b7280',
    marginTop: 20,
    fontSize: 16,
  },
  // Skeleton loader styles
  loadingHeaderImage: {
    height: 200,
    backgroundColor: "#e5e7eb",
    borderRadius: 12,
    marginBottom: 16,
  },
  loadingWelcomeCard: {
    backgroundColor: "#e5e7eb",
    height: 150,
    borderRadius: 12,
    marginBottom: 20,
  },
  loadingSectionHeader: {
    height: 20,
    width: "60%",
    backgroundColor: "#d1d5db",
    borderRadius: 8,
    marginBottom: 12,
  },
  loadingCard: {
    width: 180,
    height: 140,
    backgroundColor: "#d1d5db",
    borderRadius: 12,
    marginRight: 12,
  },
  loadingNewsCard: {
    height: 120,
    backgroundColor: "#d1d5db",
    borderRadius: 12,
    marginBottom: 12,
  },
});