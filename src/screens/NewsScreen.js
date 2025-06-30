import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";




const NewsModal = ({ visible, onClose, story }) => {
    if (!story) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>X</Text>
                    </TouchableOpacity>
                    <ScrollView>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 24, marginRight: 10 }}>📰</Text>
                            <Text style={styles.modalTitle}>{story.title}</Text>
                        </View>
                        <View style={styles.modalHr} />
                        {story.image && (
                            <Image source={{ uri: story.image }} style={styles.modalImage} />
                        )}
                        <Text style={styles.modalMessage}>{story.content || story.message || "No content available."}</Text>
                        <View style={styles.row}>
                            <Text style={{ fontSize: 14, marginRight: 5 }}>⏱️</Text>
                            <Text style={styles.modalDate}>
                                {new Date(story.date).toLocaleDateString()}
                            </Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={{ fontSize: 14, marginRight: 5 }}>👁️</Text>
                            <Text style={styles.modalViews}>Views: {story.views || 0}</Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const NewsScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [news, setNews] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headingContainer}>
          <Text
            style={styles.headingIcon}
          >📰</Text>
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
          return (
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
              activeOpacity={0.8}
              style={styles.newsCard}
            >
              {story.image && (
                <Image source={{ uri: story.image }} style={styles.newsImage} />
              )}
              <View style={styles.newsTitleContainer}>
                <Text
                  style={{ fontSize: 18, marginRight: 8, color: "#fff" }}
                >📰</Text>
                <Text style={styles.newsCardTitle}>{story.title}</Text>
              </View>
            </TouchableOpacity>
          );
        })
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
    backgroundColor: "#22d3ee", // bright cyan background
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  buttonSecondaryText: {
    color: "#1f2937", // dark text for contrast
    fontWeight: "700",
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
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(31, 41, 55, 0.7)', // Semi-transparent dark background
    padding: 10,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    paddingTop: 40, // Make space for the absolute close button
    
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    zIndex: 1,
  },
  closeButtonText: {
    color: '#f9fafb',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#f9fafb',
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalMessage: {
    fontSize: 16,
    color: '#e5e7eb',
    marginBottom: 15,
    lineHeight: 22,
  },
  modalDate: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  modalViews: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 5,
  },
  modalHr: {
    height: 1,
    backgroundColor: '#4b5563',
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
});

export default NewsScreen;
