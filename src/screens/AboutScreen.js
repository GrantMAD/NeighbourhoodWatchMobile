import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { supabase } from "../../lib/supabase";

import { useSafeAreaInsets } from "react-native-safe-area-context";

const screenHeight = Dimensions.get("window").height;

const AboutScreen = ({ route }) => {
  const { groupId } = route.params;
  const insets = useSafeAreaInsets();

  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      async function fetchGroup() {
        setLoading(true);
        setError(null);

        try {
          const { data, error } = await supabase
            .from("groups")
            .select("*")
            .eq("id", groupId)
            .single();

          if (error) {
            setError(error.message);
            setLoading(false);
            return;
          }

          let parsedExecutives = [];
          if (data.executives) {
            if (typeof data.executives === "string") {
              try {
                parsedExecutives = JSON.parse(data.executives);
              } catch {
                parsedExecutives = [];
              }
            } else if (Array.isArray(data.executives)) {
              parsedExecutives = data.executives;
            }
          }

          setGroupData({
            ...data,
            executives: parsedExecutives,
          });
        } catch (err) {
          setError("Unexpected error: " + err.message);
        } finally {
          setLoading(false);
        }
      }

      fetchGroup();
    }, [groupId])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4338ca" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading group data: {error}</Text>
      </View>
    );
  }

  if (!groupData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No group data found.</Text>
      </View>
    );
  }

  const { vision, mission, objectives, values, executives = [] } = groupData;

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.innerWrapper, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.aboutBox}>
          <Text style={styles.aboutHeading}>About Us</Text>
          <Text style={styles.aboutExplanation}>
            Learn more about this group’s vision, mission, objectives, values, and leadership team.
          </Text>

          <Text style={styles.sectionTitle}>🌟 Vision</Text>
          <Text style={styles.text}>{vision || "Vision not provided."}</Text>

          <Text style={styles.sectionTitle}>🎯 Mission</Text>
          <Text style={styles.text}>{mission || "Mission not provided."}</Text>

          <Text style={styles.sectionTitle}>📈 Objectives</Text>
          <Text style={styles.text}>{objectives || "Objectives not provided."}</Text>

          <Text style={styles.sectionTitle}>💖 Values</Text>
          <Text style={styles.text}>{values || "Values not provided."}</Text>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>👥 Executives</Text>
          <Text style={styles.execStaticTitle}>🏛️ Executive Committee</Text>

          {Array.isArray(executives) && executives.length > 0 ? (
            executives.map((exec, index) => (
              <View key={index} style={styles.execContainer}>
                {exec.image ? (
                  <Image source={{ uri: exec.image }} style={styles.execImage} />
                ) : (
                  <View style={[styles.execImage, styles.execImagePlaceholder]}>
                    <Text style={{ fontSize: 30, color: '#e2e8f0' }}>👤</Text>
                  </View>
                )}
                <View style={styles.execTextContainer}>
                  <Text style={styles.execName}>{exec.name || "Name not provided"}</Text>
                  <Text style={styles.execTitle}>{exec.role || "Title not provided"}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.text}>No executives data available.</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a202c", 
  },
  innerWrapper: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  aboutBox: {
    backgroundColor: "#2d3748", // Slightly lighter dark shade
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  aboutHeading: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#e2e8f0", // Light gray for headings
    marginBottom: 10,
    textAlign: "center",
  },
  aboutExplanation: {
    fontSize: 15,
    color: "#a0aec0", // Muted gray for description
    marginBottom: 25,
    textAlign: "center",
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#63b3ed", // A shade of blue for section titles
    marginTop: 15,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#4a5568",
    paddingBottom: 5,
  },
  text: {
    fontSize: 16,
    color: "#cbd5e1", // Light text color
    marginBottom: 15,
    lineHeight: 24,
  },
  execStaticTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#63b3ed",
    marginTop: 20,
    marginBottom: 15,
  },
  execContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#4a5568", // Darker card background
    padding: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  execImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#63b3ed",
  },
  execImagePlaceholder: {
    backgroundColor: "#718096",
    justifyContent: "center",
    alignItems: "center",
  },
  execTextContainer: {
    flex: 1,
  },
  execName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#e2e8f0",
  },
  execTitle: {
    fontSize: 14,
    color: "#a0aec0",
    marginTop: 2,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a202c",
  },
  errorText: {
    color: "#fc8181", // Light red for errors
    fontSize: 16,
    paddingHorizontal: 20,
    textAlign: "center",
  },
});

export default AboutScreen;
