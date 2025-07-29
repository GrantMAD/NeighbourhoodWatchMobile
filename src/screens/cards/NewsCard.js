import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const NewsCard = React.memo(({ item, userMetrics, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to permanently delete the news story "${item.title}"?`,
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
          <FontAwesome5 name="newspaper" size={18} color="#1F2937" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <FontAwesome5 name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.cardContent}>
          <Text style={styles.sectionHeading}>News Details</Text>
          <View style={styles.grid}>
            {renderBooleanStatus('Content', item.content ? true : false, 'align-left')}
            {renderDetail('Created At', new Date(item.date).toLocaleDateString(), 'calendar-alt')}
            {renderDetail('Created By', userMetrics.find(user => user.id === item.groupCreatorId)?.name || item.groupCreatorId, 'user')}
            {renderDetail('Views', item.views || 0, 'eye')}
            {renderBooleanStatus('Image', item.image, 'image')}
          </View>
          <View style={styles.singleLineItemContainer}>
            <View style={styles.labelWithIcon}>
              <FontAwesome5 name="layer-group" size={14} color="#6B7280" style={styles.labelIcon} />
              <Text style={styles.gridLabel}>Group ID</Text>
            </View>
            <Text style={styles.smallGridValue}>{item.groupId}</Text>
          </View>
          <View style={styles.singleLineItemContainer}>
            <View style={styles.labelWithIcon}>
              <FontAwesome5 name="fingerprint" size={14} color="#6B7280" style={styles.labelIcon} />
              <Text style={styles.gridLabel}>News ID</Text>
            </View>
            <Text style={styles.smallGridValue}>{item.id}</Text>
          </View>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <FontAwesome5 name="trash-alt" size={16} color="#FFF" />
            <Text style={styles.deleteButtonText}>Delete Story</Text>
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

export default NewsCard;
