import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const IncidentCard = React.memo(({ item }) => {
  const renderDetail = (label, value) => (
    <Text style={styles.detailText}>
      <Text style={styles.detailLabel}>{label}: </Text>
      <Text style={styles.detailValue}>{value}</Text>
    </Text>
  );

  return (
    <View style={styles.dataCard}>
      <Text style={styles.cardTitle}>{item.title}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Incident Details</Text>
        {renderDetail('Report ID', item.id)}
        {renderDetail('Group', `${item.groupName} (ID: ${item.groupId})`)}
        {renderDetail('Created By Group Creator ID', item.groupCreatorId)}
        {renderDetail('Severity', item.severity_tag)}
        {renderDetail('Location', item.location_of_incident)}
        {renderDetail('Date of Incident', new Date(item.date_of_incident).toLocaleDateString())}
        {renderDetail('Time of Incident', item.time_of_incident)}
        {renderDetail('Police Reference', item.police_reference || 'N/A')}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reporting Information</Text>
        {renderDetail('Reported By User ID', item.reported_by)}
        {renderDetail('Reported At', new Date(item.reported_at).toLocaleString())}
        {renderDetail('Description', item.description ? item.description.substring(0, 100) + (item.description.length > 100 ? '...' : '') : 'N/A')}
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
});

export default IncidentCard;