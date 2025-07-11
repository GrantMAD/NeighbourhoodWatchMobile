import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";

const NewsModal = ({ visible, onClose, story }) => {
  if (!story) return null;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={onClose} style={styles.closeIconWrapper}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalEmoji}>📰</Text>
              <Text style={styles.modalTitle}>{story.title}</Text>
            </View>

            <View style={styles.modalDivider} />

            {story.image && <Image source={{ uri: story.image }} style={styles.modalImage} />}

            <Text style={styles.modalMessage}>
              {story.content || story.message || "No content available."}
            </Text>

            <View style={styles.row}>
              <Text style={styles.icon}>⏱️</Text>
              <Text style={styles.modalDate}>
                {new Date(story.date).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.icon}>👁️</Text>
              <Text style={styles.modalViews}>Views: {story.views || 0}</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const LoadingState = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.scrollViewContent}>
    <View style={styles.headerRow}>
      <View style={styles.headingContainer}>
        <Text style={styles.headingIcon}>📰</Text>
        <Text style={styles.mainHeading}>News</Text>
      </View>
      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={() => {}}
        disabled={true}
      >
        <Text style={styles.buttonSecondaryText}>Add Story</Text>
      </TouchableOpacity>
    </View>
    <Text style={styles.description}>
      Stay updated with the latest news stories from your group.
    </Text>
    {[...Array(3)].map((_, i) => (
      <View key={i} style={styles.loadingNewsCard} />
    ))}
  </ScrollView>
);

const NewsScreen = ({ route, navigation }) => {
  const { groupId, selectedStory: initialSelectedStory } = route.params;
  const [news, setNews] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingStoryId, setLoadingStoryId] = useState(null);

  useEffect(() => {
    if (initialSelectedStory) {
      setSelectedStory(initialSelectedStory);
    }
  }, [initialSelectedStory]);

  const fetchNews = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNews();
    setRefreshing(false);
  }, [groupId]);

  useFocusEffect(
    useCallback(() => {
      fetchNews();
    }, [groupId])
  );

  const incrementStoryViews = async (storyId) => {
    setLoadingStoryId(storyId);
    try {
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
    } finally {
      setLoadingStoryId(null);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollViewContent}
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.headerRow}>
        <View style={styles.headingContainer}>
          <Text style={styles.headingIcon}>📰</Text>
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
        news.map((story, index) => (
          <TouchableOpacity
            key={story.id || index}
            onPress={async () => {
              const updatedViews = await incrementStoryViews(story.id);
              if (updatedViews !== null) {
                const updatedStory = { ...story, views: updatedViews };
                setSelectedStory(updatedStory);
              } else {
                setSelectedStory(story);
              }
            }}
            activeOpacity={0.85}
            style={[styles.newsCard, loadingStoryId === story.id && styles.newsCardLoading]}
            disabled={loadingStoryId === story.id}
          >
            {loadingStoryId === story.id ? (
              <View style={styles.newsCardLoadingOverlay}>
                <ActivityIndicator size="large" color="#22d3ee" />
              </View>
            ) : null}
            <View style={styles.newsImageContainer}>
              {story.image ? (
                <Image source={{ uri: story.image }} style={styles.newsImage} />
              ) : (
                <View style={styles.newsEmojiPlaceholder}>
                  <Text style={styles.newsEmoji}>📰</Text>
                </View>
              )}
            </View>

            <View style={styles.newsContent}>
              <Text style={styles.newsCardTitle}>{story.title}</Text>
              <Text style={styles.newsDescription} numberOfLines={3}>{story.content}</Text>
              <View style={styles.newsFooter}>
                <Text style={styles.newsDateText}>🗓️ {new Date(story.date).toLocaleDateString()}</Text>
                <Text style={styles.newsViewsText}>👁️ {story.views || 0} views</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
      <NewsModal
        visible={!!selectedStory}
        onClose={() => setSelectedStory(null)}
        story={selectedStory}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headingIcon: {
    marginRight: 8,
    fontSize: 24,
  },
  mainHeading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  buttonSecondary: {
    backgroundColor: "#22d3ee",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  buttonSecondaryText: {
    color: "#1f2937",
    fontWeight: "700",
    fontSize: 16,
  },
  description: {
    color: "#6b7280",
    fontSize: 14,
    marginBottom: 20,
    fontWeight: "500",
    textAlign: "center",
  },
  noNewsText: {
    color: "#6b7280",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  newsCard: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newsImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  newsImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  newsEmojiPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  newsEmoji: {
    fontSize: 80,
  },
  newsContent: {
    padding: 16,
  },
  newsCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
  },
  newsDescription: {
    fontSize: 14,
    color: "#e5e7eb",
    marginBottom: 12,
    lineHeight: 20,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#374151', 
    paddingTop: 12,
  },
  newsDateText: {
    fontSize: 12,
    color: "#d1d5db",
    flex: 1,
  },
  newsViewsText: {
    fontSize: 12,
    color: "#d1d5db",
    textAlign: "right",
  },
  newsCardLoading: {
    opacity: 0.7,
  },
  newsCardLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#fefefe",
    borderRadius: 16,
    padding: 24,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    position: "relative",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  closeIconWrapper: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#2563eb",
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOpacity: 0.8,
    shadowRadius: 8,
    zIndex: 10,
  },
  closeIcon: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  modalEmoji: {
    fontSize: 30,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    flexShrink: 1,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#d1d5db",
    marginBottom: 20,
  },
  modalImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: "#1f2937",
    marginBottom: 20,
    lineHeight: 24,
  },
  modalDate: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
  },
  modalViews: {
    fontSize: 14,
    color: "#6b7280",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  icon: {
    fontSize: 18,
    marginRight: 6,
  },
  loadingNewsCard: {
    width: '100%',
    height: 130,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 16,
  },
});

export default NewsScreen;
