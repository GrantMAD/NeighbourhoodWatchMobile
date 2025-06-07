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
          .select("welcome_text, main_image, events, news")
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
    <ScrollView style={[styles.container, styles.scrollPadding]}>
      {/* Header Image */}
      {groupData.main_image ? (
        <Image source={{ uri: groupData.main_image }} style={styles.headerImage} />
      ) : null}

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>WELCOME</Text>
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
          <Text style={styles.sectionTitle}>EVENTS</Text>
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={() => navigation.navigate("AddEventScreen", { groupId })}
          >
            <Text style={styles.buttonSecondaryText}>Add Event</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.hr} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {events.length > 0 ? (
            events.map((event, index) => (
              <TouchableOpacity key={event.id || index} style={styles.card}>
                {event.image ? (
                  <Image source={{ uri: event.image }} style={styles.cardImage} />
                ) : null}
                <Text style={styles.cardTitle}>{event.title}</Text>
                <Text style={styles.cardDate}>
                  {event.startDate} - {event.endDate}
                </Text>
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
      <View style={[styles.section, { marginBottom: 80 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>NEWS</Text>
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={() => navigation.navigate("AddNewsScreen", { groupId })}
          >
            <Text style={styles.buttonSecondaryText}>Add Story</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.hr} />
        {news.length > 0 ? (
          news.map((story, index) => (
            <TouchableOpacity key={story.id || index} style={styles.storyContainer}>
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    marginBottom: 40,
  },
  headerImage: {
    width: "100%",
    height: 200,
  },
  scrollPadding: {
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#1f2937",
    marginBottom: 20,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  welcomeTitle: {
    fontSize: 32,
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
});
