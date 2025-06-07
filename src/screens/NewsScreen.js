import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import FontAwesome from "react-native-vector-icons/FontAwesome";

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
      setNews(data.news);
    } else if (error) {
      console.error("Error fetching news:", error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNews();
    }, [groupId])
  );

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <ScrollView style={[styles.container, styles.scrollPadding]}>
      <View style={styles.headerRow}>
        <View style={styles.headingContainer}>
          <FontAwesome
            name="newspaper-o"
            size={28}
            color="#f9fafb"
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

      {news.length === 0 ? (
        <Text style={styles.noNewsText}>Currently no news stories.</Text>
      ) : (
        news.map((story, index) => {
          const isExpanded = expandedIndex === index;

          return (
            <View key={index} style={styles.card}>
              <TouchableOpacity onPress={() => toggleExpand(index)} activeOpacity={0.7}>
                <View style={styles.titleContainer}>
                  <View style={styles.titleWithIcon}>
                    <FontAwesome
                      name="newspaper-o"
                      size={18}
                      color="#d1d5db"
                      style={styles.storyIcon}
                    />
                    <Text style={styles.title}>{story.title}</Text>
                  </View>
                  <FontAwesome
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#9ca3af"
                  />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <>
                  {story.image && (
                    <Image
                      source={{ uri: story.image }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  )}
                  <Text style={styles.message}>{story.content || story.message}</Text>
                  {story.date && (
                    <Text style={styles.date}>
                      {new Date(story.date).toLocaleDateString()}
                    </Text>
                  )}
                </>
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
    backgroundColor: "#1f2937",
  },
  scrollPadding: {
    paddingTop: 40,
    paddingHorizontal: 20,
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
  },
  mainHeading: {
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
  noNewsText: {
    color: "#9ca3af",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  card: {
    backgroundColor: "#374151",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  storyIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f9fafb",
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    color: "#d1d5db",
  },
  image: {
    marginTop: 15,
    marginBottom: 15,
    borderRadius: 12,
    width: "100%",
    height: 200,
  },
  date: {
    marginTop: 6,
    fontSize: 12,
    color: "#9ca3af",
  },
});

export default NewsScreen;
