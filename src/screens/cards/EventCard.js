import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const EventCard = ({ item, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete the event "${item.title}"? This will move it to a previous events archive but will not remove it from users' attended history.`,
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

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <FontAwesome5 name="calendar-alt" size={18} color="#1F2937" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <FontAwesome5 name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.cardContent}>
          <Text style={styles.sectionHeading}>Event Details</Text>
          <View style={styles.grid}>
            {renderDetail('Description', item.description || 'N/A', 'align-left')}
            {renderDetail('Location', item.location || 'N/A', 'map-marker-alt')}
            {renderDetail('Date', new Date(item.date).toLocaleDateString(), 'calendar')}
            {renderDetail('Time', item.time || 'N/A', 'clock')}
            {renderDetail('Created By', item.created_by || 'N/A', 'user')}
            {renderDetail('Group Name', item.groupName || 'N/A', 'layer-group')}
          </View>
          <View style={styles.singleLineItemContainer}>
            <View style={styles.labelWithIcon}>
              <FontAwesome5 name="fingerprint" size={14} color="#6B7280" style={styles.labelIcon} />
              <Text style={styles.gridLabel}>Group ID</Text>
            </View>
            <Text style={styles.smallGridValue}>{item.groupId || 'N/A'}</Text>
          </View>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <FontAwesome5 name="trash-alt" size={16} color="#FFF" />
            <Text style={styles.deleteButtonText}>Delete Event</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

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
  sectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 15,
    marginBottom: 10,
    alignSelf: 'flex-start',
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

export default EventCard;
