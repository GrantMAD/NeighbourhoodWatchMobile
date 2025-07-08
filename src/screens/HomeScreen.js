import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useFocusEffect } from "@react-navigation/native";




export default function HomeScreen({ route, navigation }) {
  const groupId = route.params?.groupId;
  const [groupData, setGroupData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [news, setNews] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const fetchGroupData = async () => {
        if (!groupId) return;
        setIsLoading(true);

        const { data, error } = await supabase
          .from("groups")
          .select("welcome_text, main_image, events, news, name")
          .eq("id", groupId)
          .single();

        if (error) {
          console.error("Error fetching group data:", error);
        } else {
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4338ca" />
      </View>
    );
  }

  if (!groupId || !groupData) {
    return (
      <View style={styles.centered}>
        <Text style={{ fontSize: 18, color: "#444" }}>
          No group data available. Please rejoin or create a group.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollPadding}>
      {/* Header Image */}
      {groupData.main_image ? (
        <Image source={{ uri: groupData.main_image }} style={styles.headerImage} />
      ) : null}

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome to {groupData.name} neighborhood watch.</Text>
        <View style={styles.hr} />
        <Text style={styles.welcomeText}>
          {groupData.welcome_text ||
            "Welcome to your neighborhood! Please update the welcome text in the group settings."}
        </Text>

        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => navigation.navigate("ContactScreen")}
        >
          <Text style={styles.buttonText}>Contact Us</Text>
        </TouchableOpacity>
      </View>

      {/* Events Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, marginRight: 10, color: "#f9fafb" }}>🗓️</Text>
            <Text style={styles.sectionTitle}>EVENTS</Text>
          </View>
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={() => navigation.navigate("AddEventScreen", { groupId })}
          >
            <Text style={styles.buttonSecondaryText}>Add Event</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionDescription}>
          Stay up-to-date with the latest events happening in your neighbourhood.
        </Text>
        <View style={styles.hr} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {events.length > 0 ? (
            events.map((event, index) => (
              <TouchableOpacity
                key={event.id || index}
                style={styles.card}
                onPress={() => navigation.navigate("Events", {
                  groupId,
                  selectedEvent: event
                })}
              >
                {event.image === '🗓️' ? (
                  <View style={styles.emojiIconContainer}>
                    <Text style={styles.emojiIcon}>🗓️</Text>
                  </View>
                ) : event.image ? (
                  <Image source={{ uri: event.image }} style={styles.cardImage} />
                ) : null}

                <Text style={styles.cardTitle}>{event.title}</Text>

                <View style={styles.cardLocationContainer}>
                  <Text style={{ marginRight: 5 }}>📍</Text>
                  <Text style={styles.cardLocation}>{event.location}</Text>
                </View>

                <Text style={styles.cardMessage} numberOfLines={2}>
                  {event.message}
                </Text>

                {/* Absolute-positioned date */}
                <View style={styles.cardDateContainer}>
                  <Text style={{ marginRight: 5, marginTop: 2 }}>⏱️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardDateText}>
                      {new Date(event.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    <Text style={styles.cardDateText}>
                      {new Date(event.endDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ color: "#9ca3af", marginTop: 10 }}>
              Currently no events.
            </Text>
          )}
        </ScrollView>
      </View>

      {/* News Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, marginRight: 10, color: "#f9fafb" }}>📰</Text>
            <Text style={styles.sectionTitle}>NEWS</Text>
          </View>
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={() => navigation.navigate("AddNewsScreen", { groupId })}
          >
            <Text style={styles.buttonSecondaryText}>Add Story</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionDescription}>
          Keep informed about the latest news and announcements in your community.
        </Text>
        <View style={styles.hr} />
        {news.length > 0 ? (
          news.map((story, index) => (
            <TouchableOpacity
              key={story.id || index}
              style={styles.storyContainer}
              onPress={() => navigation.navigate("NewsScreen", {
                groupId,
                selectedStory: story
              })}
            >
              <Text style={styles.storyTitle}>{story.title}</Text>
              <View style={styles.storyContentContainer}>
                <Text style={styles.storyContent}>
                  {story.content && story.content.length > 150
                    ? story.content.slice(0, 150) + "..."
                    : story.content || "No content available."}
                </Text>
                {story.image ? (
                  <Image source={{ uri: story.image }} style={styles.storyImage} />
                ) : null}
              </View>
              <View style={styles.storyInfoContainer}>
                <Text style={styles.storyInfoText}>👁️ {story.views || 0} views</Text>
                <Text style={styles.storyInfoText}>🗓️ {new Date(story.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={{ color: "#9ca3af", marginTop: 10 }}>
            Currently no news stories.
          </Text>
        )}
        <TouchableOpacity
          style={[styles.buttonPrimary, { alignSelf: "center", marginTop: 20 }]}
          onPress={() => navigation.navigate("NewsScreen", { groupId })}
        >
          <Text style={styles.buttonText}>View All News</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  emojiIconContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4b5563',
  },
  emojiIcon: {
    fontSize: 60,
  },
  container: {
    flex: 1,
    backgroundColor: "#e5e7eb",
  },
  headerImage: {
    width: "100%",
    height: 200,
  },
  scrollPadding: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  welcomeSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#1f2937",
    marginBottom: 20,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f9fafb",
    marginBottom: 6,
  },
  hr: {
    height: 1,
    backgroundColor: "#4b5563",
    marginVertical: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: "#d1d5db",
    lineHeight: 22,
    marginBottom: 20,
  },
  buttonPrimary: {
    backgroundColor: "#4338ca",
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 30,
    alignItems: "center",
  },
  buttonText: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#1f2937",
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#f9fafb",
  },
  sectionDescription: {
    fontSize: 16,
    color: "#d1d5db",
    marginTop: 4,
    marginBottom: 8,

  },
  buttonSecondary: {
    borderColor: "#ffffff",
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  buttonSecondaryText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  card: {
    width: 220,
    marginRight: 16,
    backgroundColor: "#374151",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    paddingBottom: 50,
    position: 'relative',
  },
  cardImage: {
    width: "100%",
    height: 120,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f9fafb",
    padding: 10,
  },
  cardDate: {
    fontSize: 14,
    color: "#9ca3af",
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  cardDateText: {
    fontSize: 14,
    color: "#ffffff",
  },
  cardDateContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  cardLocation: {
    fontSize: 14,
    color: "#d1d5db",
  },
  cardMessage: {
    fontSize: 14,
    color: "#d1d5db",
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  storyContainer: {
    marginTop: 16,
    backgroundColor: "#374151",
    borderRadius: 12,
    padding: 12,
  },
  storyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f9fafb",
    marginBottom: 6,
  },
  storyContentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  storyContent: {
    flex: 1,
    fontSize: 14,
    color: "#d1d5db",
    marginRight: 12,
  },
  storyImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  storyInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#4b5563',
  },
  storyInfoText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});