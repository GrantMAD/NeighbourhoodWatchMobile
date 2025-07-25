import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EventCard = React.memo(({ item }) => {
  const renderDetail = (label, value) => (
    <Text style={styles.detailText}>
      <Text style={styles.detailLabel}>{label}: </Text>
      <Text style={styles.detailValue}>{value}</Text>
    </Text>
  );

  const renderBooleanStatus = (label, isTrue) => (
    <Text style={styles.detailText}>
      <Text style={styles.detailLabel}>{label}: </Text>
      <Text style={isTrue ? styles.statusTrue : styles.statusFalse}>
        {isTrue ? 'Yes' : 'No'}
      </Text>
    </Text>
  );

  return (
    <View style={styles.dataCard}>
      <Text style={styles.cardTitle}>{item.title}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Event Details</Text>
        {renderDetail('Event ID', item.id)}
        {renderDetail('Group', `${item.groupName} (ID: ${item.groupId})`)}
        {renderDetail('Created By Group Creator ID', item.groupCreatorId)}
        {renderDetail('Start Date', new Date(item.startDate).toLocaleString())}
        {renderDetail('End Date', new Date(item.endDate).toLocaleString())}
        {renderDetail('Location', item.location || 'N/A')}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance & Media</Text>
        {renderDetail('Views', item.views || 0)}
        {renderDetail('Attendees', item.attending_count || 0)}
        {renderBooleanStatus('Image', item.image)}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  dataCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1f2937',
    textAlign: 'center',
  },
  section: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
  },
  detailText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#4b5563',
  },
  detailLabel: {
    fontWeight: '600',
    color: '#1f2937',
  },
  detailValue: {
    color: '#4b5563',
  },
  statusTrue: {
    color: 'green',
    fontWeight: 'bold',
  },
  statusFalse: {
    color: 'red',
    fontWeight: 'bold',
  },
});

export default EventCard;