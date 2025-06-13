import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  UIManager,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import FontAwesome from "react-native-vector-icons/FontAwesome";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const NewsScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [news, setNews] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const fetchNews = async () => {
    const { data, error } = await supabase
      .from("groups")
      .select("news")
      .eq("id", groupId)
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

  // Increment views safely by fetching fresh news before update
  const incrementStoryViews = async (storyId) => {
    try {
      // Fetch latest news array fresh from DB
      const { data, error } = await supabase
        .from("groups")
        .select("news")
        .eq("id", groupId)
        .single();

      if (error) {
        console.error("Error fetching news before updating views:", error.message);
        return null;
      }

      if (!data?.news) return null;

      const newsCopy = [...data.news];
      const storyIndex = newsCopy.findIndex((s) => s.id === storyId);
      if (storyIndex === -1) return null;

      newsCopy[storyIndex].views = (newsCopy[storyIndex].views || 0) + 1;

      const { error: updateError } = await supabase
        .from("groups")
        .update({ news: newsCopy })
        .eq("id", groupId);

      if (updateError) {
        console.error("Error updating views:", updateError.message);
        return null;
      }

      return newsCopy[storyIndex].views;
    } catch (err) {
      console.error("Unexpected error updating views:", err);
      return null;
    }
  };

  const toggleExpand = async (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (expandedIndex === index) {
      // Collapse
      setExpandedIndex(null);
      return;
    }

    // Expand — optimistically increment views locally
    const updatedNews = [...news];
    const story = updatedNews[index];
    const storyId = story.id;

    updatedNews[index].views = (updatedNews[index].views || 0) + 1;
    setNews(updatedNews);
    setExpandedIndex(index);

    // Confirm with DB and revert if fails
    const updatedViews = await incrementStoryViews(storyId);
    if (updatedViews === null) {
      // revert views increment on error
      updatedNews[index].views -= 1;
      setNews(updatedNews);
    } else {
      // sync views from DB (in case of race updates)
      updatedNews[index].views = updatedViews;
      setNews(updatedNews);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headingContainer}>
          <FontAwesome
            name="newspaper-o"
            size={28}
            color="#111827"
            style={styles.headingIcon}
          />
          <Text style={styles.mainHeading}>News</Text>
        </View>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => navigation.navigate("AddNewsScreen", { groupId })}
        >
          <Text style={styles.buttonSecondaryText}>Add Story</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.description}>
        Stay updated with the latest news stories from your group.
      </Text>

      {news.length === 0 ? (
        <Text style={styles.noNewsText}>No news stories available.</Text>
      ) : (
        news.map((story, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <View key={story.id || index} style={styles.card}>
              <TouchableOpacity
                style={styles.titleRow}
                onPress={() => toggleExpand(index)}
                activeOpacity={0.8}
              >
                <Text style={styles.title}>{story.title || "Untitled"}</Text>
                <FontAwesome
                  name={isExpanded ? "caret-up" : "caret-down"}
                  size={18}
                  color="#f9fafb"
                  style={styles.arrowIcon}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.expandedContent}>
                  {story.image && (
                    <Image
                      source={{ uri: story.image }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  )}
                  <Text style={styles.message}>
                    {story.content || story.message || "No content available."}
                  </Text>

                  <View style={styles.footerRow}>
                    <Text style={styles.viewsText}>Views: {story.views || 0}</Text>
                    {story.date && (
                      <Text style={styles.date}>
                        {new Date(story.date).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              )}
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
    backgroundColor: "#ffffff",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headingIcon: {
    marginRight: 8,
  },
  mainHeading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  buttonSecondary: {
    borderColor: "#111827",
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  buttonSecondaryText: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 16,
  },
  description: {
    color: "#6b7280",
    fontSize: 14,
    marginBottom: 20,
    fontWeight: "500",
  },
  noNewsText: {
    color: "#6b7280",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f3f4f6",
    overflow: "hidden",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1f2937",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#f9fafb",
  },
  arrowIcon: {
    marginLeft: 10,
  },
  message: {
    fontSize: 14,
    color: "#374151",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    marginTop: 0,
  },
  expandedContent: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  viewsText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  date: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "right",
  },
});

export default NewsScreen;
