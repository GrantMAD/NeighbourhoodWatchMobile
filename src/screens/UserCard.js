import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const UserCard = React.memo(({ item }) => {
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
      <Text style={styles.cardTitle}>{item.name || item.email}</Text>

      <View style={styles.section}>
        {renderDetail('User ID', item.id)}
        {renderDetail('Email', item.email)}
        {renderDetail('Role', item.role)}
        {renderDetail('Group ID', item.group_id || 'N/A')}
        {renderDetail('Created At', new Date(item.created_at).toLocaleDateString())}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Check-in Status</Text>
        {renderBooleanStatus('Checked In', item.checked_in)}
        {renderDetail('Total Check-ins', item.check_in_time ? item.check_in_time.length : 0)}
        {renderDetail('Total Check-outs', item.check_out_time ? item.check_out_time.length : 0)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        {renderDetail('Contact Number', item.number || 'N/A')}
        {renderDetail('Street', item.street || 'N/A')}
        {renderDetail('Emergency Contact', item.emergency_contact || 'N/A')}
        {renderDetail('Vehicle Info', item.vehicle_info || 'N/A')}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        {renderBooleanStatus('Notifications (Check)', item.receive_check_notifications)}
        {renderBooleanStatus('Notifications (Event)', item.receive_event_notifications)}
        {renderBooleanStatus('Notifications (News)', item.receive_news_notifications)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Neighbourhood Watch</Text>
        {renderDetail('Neighbourhood Watch', item.neighbourhoodwatch && item.neighbourhoodwatch.length > 0 ? item.neighbourhoodwatch[0].name : 'N/A')}
        {renderDetail('Pending NW Requests', item.Requests ? item.Requests.filter(req => req.type === 'Neighbourhood watch request' && req.status === 'pending').length : 0)}
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

export default UserCard;
