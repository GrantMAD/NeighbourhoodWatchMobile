import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
        <ActivityIndicator size="large" color="#2563eb" />
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
      <View style={styles.innerWrapper}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>About Us</Text>
          <Text style={styles.bannerSubText}>
            Learn more about this group’s vision, mission, objectives, values, and leadership team.
          </Text>
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>🌟 Vision</Text>
          <Text style={styles.sectionText}>{vision || "Vision not provided."}</Text>
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>🎯 Mission</Text>
          <Text style={styles.sectionText}>{mission || "Mission not provided."}</Text>
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>📈 Objectives</Text>
          <Text style={styles.sectionText}>{objectives || "Objectives not provided."}</Text>
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>💖 Values</Text>
          <Text style={styles.sectionText}>{values || "Values not provided."}</Text>
        </View>

        <Text style={styles.execTitle}>👥 Executive Committee</Text>
        {executives.length > 0 ? (
          executives.map((exec, index) => (
            <View key={index} style={styles.execCard}>
              {exec.image ? (
                <Image source={{ uri: exec.image }} style={styles.execImage} />
              ) : (
                <View style={[styles.execImage, styles.execPlaceholder]}>
                  <Text style={{ fontSize: 28 }}>👤</Text>
                </View>
              )}
              <View style={styles.execDetails}>
                <Text style={styles.execName}>{exec.name || "Name not provided"}</Text>
                <Text style={styles.execRole}>{exec.role || "Title not provided"}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.sectionText}>No executives data available.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  innerWrapper: {
    padding: 20,
  },
  banner: {
    backgroundColor: "#1e40af",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  bannerText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#f9fafb",
    marginBottom: 6,
  },
  bannerSubText: {
    fontSize: 14,
    color: "#dbeafe",
    textAlign: "center",
    lineHeight: 20,
  },
  aboutSection: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1e3a8a",
  },
  sectionText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  execTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginTop: 24,
    marginBottom: 10,
  },
  execCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#1f2937",
    borderRadius: 10,
    marginBottom: 10,
  },
  execImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    borderColor: "#3b82f6",
    borderWidth: 2,
  },
  execPlaceholder: {
    backgroundColor: "#cbd5e1",
    justifyContent: "center",
    alignItems: "center",
  },
  execDetails: {
    flex: 1,
  },
  execName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f9fafb",
  },
  execRole: {
    fontSize: 14,
    color: "#d1d5db",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 20,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 16,
    textAlign: "center",
  },
});

export default AboutScreen;