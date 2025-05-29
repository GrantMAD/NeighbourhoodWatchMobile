import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { useGroup } from '../context/GroupContext';

const AboutScreen = () => {
  const { groupData } = useGroup();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>About Us</Text>

      <Text style={styles.sectionTitle}>Our Vision</Text>
      <Text style={styles.text}>{groupData?.vision || 'No vision set.'}</Text>

      <Text style={styles.sectionTitle}>Our Mission</Text>
      <Text style={styles.text}>{groupData?.mission || 'No mission set.'}</Text>

      <Text style={styles.sectionTitle}>Our Values</Text>
      <Text style={styles.text}>{groupData?.values || 'No values set.'}</Text>

      <Text style={styles.sectionTitle}>Objectives</Text>
      <Text style={styles.text}>{groupData?.objectives || 'No objectives set.'}</Text>

      <Text style={styles.executivesTitle}>{groupData?.executivesTitle || "Sector 2 Executive's"}</Text>

      <View style={styles.executiveContainer}>
        {(groupData?.executives && groupData.executives.length > 0) ? (
          groupData.executives.map((exec, index) => (
            <View key={index} style={styles.card}>
              {exec.image ? (
                <Image source={{ uri: exec.image }} style={styles.image} />
              ) : (
                <View style={[styles.image, { backgroundColor: '#ccc' }]} />
              )}
              <Text style={styles.name}>{exec.name}</Text>
              <Text style={styles.role}>{exec.role}</Text>
            </View>
          ))
        ) : (
          <Text style={{ color: '#999', textAlign: 'center', marginTop: 20 }}>
            No executives added yet.
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#f4f4f5', padding: 16 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    textDecorationLine: 'underline',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    textDecorationLine: 'underline',
    color: '#333',
  },
  text: {
    textAlign: 'center',
    marginVertical: 10,
    paddingHorizontal: 12,
    color: '#555',
  },
  executivesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    textDecorationLine: 'underline',
    color: '#333',
  },
  executiveContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    alignItems: 'center',
    margin: 10,
    width: 120,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  name: {
    marginTop: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  role: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 80,
  },
});

export default AboutScreen;