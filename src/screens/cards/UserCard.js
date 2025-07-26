import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const UserCard = React.memo(({ item }) => {
  const [expanded, setExpanded] = useState(false);

  const renderDetail = (label, value, icon) => (
    <View style={styles.gridItem}>
      <View style={styles.labelWithIcon}>
        <FontAwesome5 name={icon} size={14} color="#6B7280" style={styles.labelIcon} />
        <Text style={styles.gridLabel}>{label}</Text>
      </View>
      <Text style={styles.gridValue}>{value}</Text>
    </View>
  );

  const renderBooleanStatus = (label, isTrue, icon) => (
    <View style={styles.gridItem}>
      <View style={styles.labelWithIcon}>
        <FontAwesome5 name={icon} size={14} color="#6B7280" style={styles.labelIcon} />
        <Text style={styles.gridLabel}>{label}</Text>
      </View>
      <Text style={isTrue ? styles.statusTrue : styles.statusFalse}>
        {isTrue ? 'Yes' : 'No'}
      </Text>
    </View>
  );

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <FontAwesome5 name="user" size={20} color="#1F2937" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>{item.name || item.email}</Text>
        </View>
        <FontAwesome5 name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.cardContent}>
          <Text style={styles.sectionHeading}>Basic Information</Text>
          <View style={styles.grid}>
            {renderDetail('Role', item.role, 'user-tag')}
            {renderDetail('Created At', new Date(item.created_at).toLocaleDateString(), 'calendar-alt')}
          </View>

          <Text style={styles.sectionHeading}>Check-in Status</Text>
          <View style={styles.grid}>
            {renderBooleanStatus('Checked In', item.checked_in, 'check-circle')}
            {renderDetail('Total Check-ins', item.check_in_time ? item.check_in_time.length : 0, 'sign-in-alt')}
            {renderDetail('Total Check-outs', item.check_out_time ? item.check_out_time.length : 0, 'sign-out-alt')}
          </View>

          <Text style={styles.sectionHeading}>Contact Information</Text>
          <View style={styles.grid}>
            {renderDetail('Contact Number', item.number || 'N/A', 'phone')}
            {renderDetail('Street', item.street || 'N/A', 'road')}
            {renderDetail('Emergency Contact', item.emergency_contact || 'N/A', 'heartbeat')}
            {renderDetail('Vehicle Info', item.vehicle_info || 'N/A', 'car')}
          </View>

          <Text style={styles.sectionHeading}>Notification Preferences</Text>
          <View style={styles.grid}>
            {renderBooleanStatus('Notifications (Check)', item.receive_check_notifications, 'bell')}
            {renderBooleanStatus('Notifications (Event)', item.receive_event_notifications, 'calendar-day')}
            {renderBooleanStatus('Notifications (News)', item.receive_news_notifications, 'newspaper')}
          </View>

          <Text style={styles.sectionHeading}>Neighbourhood Watch</Text>
          <View style={styles.grid}>
            {renderDetail('Name', item.neighbourhoodwatch && item.neighbourhoodwatch.length > 0 ? item.neighbourhoodwatch[0].name : 'N/A', 'eye')}
            {renderDetail('Pending NW Requests', item.Requests ? item.Requests.filter(req => req.type === 'Neighbourhood watch request' && req.status === 'pending').length : 0, 'handshake')}
          </View>
          <View style={styles.singleLineItemContainer}>
            <View style={styles.labelWithIcon}>
              <FontAwesome5 name="at" size={14} color="#6B7280" style={styles.labelIcon} />
              <Text style={styles.gridLabel}>Email</Text>
            </View>
            <Text style={styles.gridValue}>{item.email}</Text>
          </View>
          <View style={styles.singleLineItemContainer}>
            <View style={styles.labelWithIcon}>
              <FontAwesome5 name="fingerprint" size={14} color="#6B7280" style={styles.labelIcon} />
              <Text style={styles.gridLabel}>User ID</Text>
            </View>
            <Text style={styles.smallGridValue}>{item.id}</Text>
          </View>
          <View style={styles.singleLineItemContainer}>
            <View style={styles.labelWithIcon}>
              <FontAwesome5 name="layer-group" size={14} color="#6B7280" style={styles.labelIcon} />
              <Text style={styles.gridLabel}>Group ID</Text>
            </View>
            <Text style={styles.smallGridValue}>{item.group_id || 'N/A'}</Text>
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardContent: {
    marginTop: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: 15,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelIcon: {
    marginRight: 5,
  },
  gridLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  gridValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusTrue: {
    color: 'green',
    fontWeight: 'bold',
  },
  statusFalse: {
    color: 'red',
    fontWeight: 'bold',
  },
  singleLineItemContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  smallGridValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 15,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
});

export default UserCard;
