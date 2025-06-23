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

const screenHeight = Dimensions.get("window").height;

const AboutScreen = ({ route }) => {
  const { groupId } = route.params;

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
      <View style={styles.innerWrapper}>
        <View style={styles.aboutBox}>
          <Text style={styles.aboutHeading}>About Us</Text>
          <Text style={styles.aboutExplanation}>
            Learn more about this group’s vision, mission, objectives, values, and leadership team.
          </Text>

          <Text style={styles.sectionTitle}>Vision</Text>
          <Text style={styles.text}>{vision || "Vision not provided."}</Text>

          <Text style={styles.sectionTitle}>Mission</Text>
          <Text style={styles.text}>{mission || "Mission not provided."}</Text>

          <Text style={styles.sectionTitle}>Objectives</Text>
          <Text style={styles.text}>{objectives || "Objectives not provided."}</Text>

          <Text style={styles.sectionTitle}>Values</Text>
          <Text style={styles.text}>{values || "Values not provided."}</Text>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Executives</Text>
          <Text style={styles.execStaticTitle}>Executive Committee</Text>

          {Array.isArray(executives) && executives.length > 0 ? (
            executives.map((exec, index) => (
              <View key={index} style={styles.execContainer}>
                {exec.image ? (
                  <Image source={{ uri: exec.image }} style={styles.execImage} />
                ) : (
                  <View style={[styles.execImage, styles.execImagePlaceholder]} />
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
    backgroundColor: "#e5e7eb", // light background
  },
  innerWrapper: {
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  aboutBox: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
    minHeight: screenHeight - 80,
  },
  aboutHeading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#f9fafb",
    marginBottom: 20,
    textAlign: "center",
  },
  aboutExplanation: {
    fontSize: 16,
    color: "#d1d5db",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#f9fafb",
    marginBottom: 6,
  },
  text: {
    fontSize: 16,
    color: "#e0e7ff",
    marginBottom: 14,
    lineHeight: 22,
  },
  execStaticTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#a5b4fc",
    marginBottom: 12,
  },
  execContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#374151",
    padding: 10,
    borderRadius: 8,
  },
  execImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 14,
    backgroundColor: "#4b5563",
  },
  execImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  execTextContainer: {
    flexShrink: 1,
  },
  execName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f3f4f6",
  },
  execTitle: {
    fontSize: 14,
    color: "#cbd5e1",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1f2937",
  },
  errorText: {
    color: "#f87171",
    fontSize: 16,
    paddingHorizontal: 20,
    textAlign: "center",
  },
});

export default AboutScreen;
