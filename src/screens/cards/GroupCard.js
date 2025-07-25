import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GroupCard = React.memo(({ item }) => {
  const profileCompleteness = [
    item.welcome_text,
    item.vision,
    item.mission,
    item.objectives,
    item.values,
    item.contact_email,
    item.main_image,
  ].filter(Boolean).length;
  const totalProfileFields = 7; // welcome_text, vision, mission, objectives, values, contact_email, main_image
  const completenessPercentage = ((profileCompleteness / totalProfileFields) * 100).toFixed(0);

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
      <Text style={styles.cardTitle}>{item.name}</Text>
      <View style={styles.section}>
        {renderDetail('Group ID', item.id)}
        {renderDetail('Created By', item.created_by)}
        {renderDetail('Created At', new Date(item.created_at).toLocaleDateString())}
        {renderDetail('Contact Email', item.contact_email || 'N/A')}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Metrics</Text>
        {renderDetail('Members', item.users ? item.users.length : 0)}
        {renderDetail('Events', item.events ? item.events.length : 0)}
        {renderDetail('News', item.news ? item.news.length : 0)}
        {renderDetail('Reports', item.reports ? item.reports.length : 0)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Completeness: {completenessPercentage}%</Text>
        {renderBooleanStatus('Welcome Text', item.welcome_text)}
        {renderBooleanStatus('Vision', item.vision)}
        {renderBooleanStatus('Mission', item.mission)}
        {renderBooleanStatus('Objectives', item.objectives)}
        {renderBooleanStatus('Values', item.values)}
        {renderBooleanStatus('Main Image', item.main_image)}
        {renderBooleanStatus('Password Set', item.group_password)}
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

export default GroupCard;