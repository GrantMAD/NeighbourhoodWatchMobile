import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

// Static sample events data
const events = [
  {
    id: '1',
    eventTitle: 'Neighbourhood Safety Meeting',
    eventStartDate: '2025-05-01',
    eventEndDate: '2025-05-01',
    image: 'https://placekitten.com/300/200',
    contents: 'Join us for a meeting on community safety tips and initiatives.'
  },
  {
    id: '2',
    eventTitle: 'Community BBQ',
    eventStartDate: '2025-06-15',
    eventEndDate: '2025-06-15',
    image: 'https://placekitten.com/301/200',
    contents: 'Fun BBQ event with food, games, and meet your neighbours.'
  }
];

export default function EventsScreen() {
  const [expandedEventId, setExpandedEventId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedEventId(expandedEventId === id ? null : id);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.mainHeading}>Events</Text>
      <Text style={styles.descriptionText}>
        Stay updated with all the upcoming events in your neighbourhood. Tap on each event to see more details.
      </Text>

      {events.map(event => (
        <View key={event.id} style={styles.eventContainer}>
          <TouchableOpacity onPress={() => toggleExpand(event.id)} style={styles.header}>
            <Text style={styles.title}>{event.eventTitle}</Text>
            <View style={styles.dateRow}>
              <FontAwesome5 name="calendar-day" size={16} color="#3b82f6" />
              <Text style={styles.dateText}>
                {formatDate(event.eventStartDate)} - {formatDate(event.eventEndDate)}
              </Text>
            </View>
          </TouchableOpacity>

          {expandedEventId === event.id && (
            <View style={styles.content}>
              <Image source={{ uri: event.image }} style={styles.image} />
              <Text style={styles.description}>{event.contents}</Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  mainHeading: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2f95dc',  // nice blue
    marginBottom: 8,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 16,
    color: '#9ca3af', // lighter gray
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  eventContainer: {
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#1f2937', // dark background
    padding: 12,
  },
  header: {
    borderBottomColor: '#374151',
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e0e7ff',
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: '#93c5fd',
    marginLeft: 6,
  },
  content: {
    marginTop: 12,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
  },
  description: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
});
