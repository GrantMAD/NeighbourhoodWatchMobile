import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const IncidentCard = React.memo(({ item, userMetrics, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to permanently delete the incident report "${item.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(item.id, item.groupId),
        },
      ]
    );
  };

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
          <FontAwesome5 name="exclamation-triangle" size={18} color="#1F2937" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <FontAwesome5 name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.cardContent}>
          <Text style={styles.sectionHeading}>Incident Details</Text>
          <View style={styles.grid}>
            {renderDetail('Severity', item.severity_tag, 'exclamation-circle')}
            {renderDetail('Location', item.location_of_incident, 'map-marker-alt')}
            {renderDetail('Date of Incident', new Date(item.date_of_incident).toLocaleDateString(), 'calendar-alt')}
            {renderDetail('Time of Incident', item.time_of_incident, 'clock')}
            {renderDetail('Police Reference', item.police_reference || 'N/A', 'clipboard')}
            {renderBooleanStatus('Description', item.description ? true : false, 'align-left')}
          </View>

          <Text style={styles.sectionHeading}>Reporting Information</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <View style={styles.labelWithIcon}>
                <FontAwesome5 name="fingerprint" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.gridLabel}>Report ID</Text>
              </View>
              <Text style={styles.gridValue}>{item.id}</Text>
            </View>
            <View style={[styles.gridItem, { paddingBottom: 5 }]}>
              <View style={styles.labelWithIcon}>
                <FontAwesome5 name="user" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.gridLabel}>Reported By</Text>
              </View>
              <Text style={styles.gridValue}>{(userMetrics || []).find(user => user.id === item.reported_by)?.name || item.reported_by}</Text>
            </View>
          </View>

          <View style={styles.reportedAtContainer}>
            <View style={styles.labelWithIcon}>
              <FontAwesome5 name="calendar-check" size={14} color="#6B7280" style={styles.labelIcon} />
              <Text style={styles.gridLabel}>Reported At</Text>
            </View>
            <Text style={styles.gridValue}>{new Date(item.reported_at).toLocaleString()}</Text>
          </View>

          <View style={{ paddingBottom: 10 }} />

          <View style={styles.singleLineItemContainer}>
            <View style={styles.labelWithIcon}>
              <FontAwesome5 name="layer-group" size={14} color="#6B7280" style={styles.labelIcon} />
              <Text style={styles.gridLabel}>Group ID</Text>
            </View>
            <Text style={styles.smallGridValue}>{item.groupId}</Text>
          </View>
          <View style={styles.singleLineItemContainer}>
            <View style={styles.labelWithIcon}>
              <FontAwesome5 name="user" size={14} color="#6B7280" style={styles.labelIcon} />
              <Text style={styles.gridLabel}>Created By</Text>
            </View>
            <Text style={styles.smallGridValue}>{item.groupCreatorId}</Text>
          </View>

          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <FontAwesome5 name="trash-alt" size={16} color="#FFF" />
            <Text style={styles.deleteButtonText}>Delete Report</Text>
          </TouchableOpacity>
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
    alignItems: 'flex-start',
  },
  reportedAtContainer: {
    alignItems: 'flex-start',
  },
  smallGridValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 15,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default IncidentCard;