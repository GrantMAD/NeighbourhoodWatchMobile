import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../../lib/supabase"; // Adjust this path as needed

const staticEvents = [
  {
    id: "1",
    title: "Community Safety Workshop",
    startDate: "2025-05-20",
    endDate: "2025-05-21",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "2",
    title: "Neighborhood Cleanup",
    startDate: "2025-05-25",
    endDate: "2025-05-25",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "3",
    title: "Block Watch Monthly Meeting",
    startDate: "2025-05-30",
    endDate: "2025-05-30",
    image:
      "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=800&q=60",
  },
];

const staticStories = [
  {
    id: "a",
    title: "New Patrol Routes Launched",
    content:
      "We have launched new patrol routes in Sector 5 to increase safety coverage in response to recent incidents...",
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "b",
    title: "Community Garden Project Success",
    content:
      "Thanks to all volunteers, the community garden project has blossomed bringing neighbors closer together...",
    image:
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "c",
    title: "Local Crime Stats Update",
    content:
      "Recent statistics show a decline in petty crime thanks to neighborhood watch efforts and police collaboration...",
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=60",
  },
];

export default function HomeScreen({ route, navigation }) {
  const groupId = route.params?.groupId;
  const [groupData, setGroupData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!groupId) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from("groups")
        .select("welcome_text, main_image")
        .eq("id", groupId)
        .single();

      if (error) {
        console.error("Error fetching group data:", error);
      } else {
        setGroupData(data);
      }

      setIsLoading(false);
    };

    fetchGroupData();
  }, [groupId]);

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
          <TouchableOpacity style={styles.buttonSecondary}>
            <Text style={styles.buttonSecondaryText}>Add Event</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.hr} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {staticEvents.map((event) => (
            <TouchableOpacity key={event.id} style={styles.card}>
              <Image source={{ uri: event.image }} style={styles.cardImage} />
              <Text style={styles.cardTitle}>{event.title}</Text>
              <Text style={styles.cardDate}>
                {event.startDate} - {event.endDate}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* News/Stories Section */}
      <View style={[styles.section, { marginBottom: 80 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>NEWS</Text>
          <TouchableOpacity style={styles.buttonSecondary}>
            <Text style={styles.buttonSecondaryText}>Add Story</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.hr} />
        {staticStories.map((story) => (
          <TouchableOpacity key={story.id} style={styles.storyContainer}>
            <Text style={styles.storyTitle}>{story.title}</Text>
            <View style={styles.storyContentContainer}>
              <Text style={styles.storyContent}>
                {story.content.length > 150
                  ? story.content.slice(0, 150) + "..."
                  : story.content}
              </Text>
              <Image source={{ uri: story.image }} style={styles.storyImage} />
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.buttonPrimary, { alignSelf: "center", marginTop: 20 }]}
        >
          <Text style={styles.buttonText}>View All Stories</Text>
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
    borderColor: "#4338ca",
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  buttonSecondaryText: {
    color: "#4338ca",
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
