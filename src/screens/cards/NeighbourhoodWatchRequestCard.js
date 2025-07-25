import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NeighbourhoodWatchRequestCard = React.memo(({ item }) => {
  const renderDetail = (label, value) => (
    <Text style={styles.detailText}>
      <Text style={styles.detailLabel}>{label}: </Text>
      <Text style={styles.detailValue}>{value}</Text>
    </Text>
  );

  const renderStatus = (status) => {
    let statusStyle = styles.statusPending;
    if (status === 'accepted') {
      statusStyle = styles.statusAccepted;
    } else if (status === 'declined') {
      statusStyle = styles.statusDeclined;
    }
    return (
      <Text style={styles.detailText}>
        <Text style={styles.detailLabel}>Status: </Text>
        <Text style={statusStyle}>{status.toUpperCase()}</Text>
      </Text>
    );
  };

  return (
    <View style={styles.dataCard}>
      <Text style={styles.cardTitle}>Request to join {item.neighbourhoodWatchName}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Request Details</Text>
        {renderDetail('Request ID', item.id)}
        {renderDetail('Requester User ID', item.requesterId)}
        {renderDetail('Requester Name', item.requesterName || 'N/A')}
        {renderDetail('Requester Email', item.userEmail || 'N/A')}
        {renderDetail('Requested At', new Date(item.timestamp).toLocaleString())}
        {renderDetail('NW Creator ID', item.creatorId || 'N/A')}
        {renderStatus(item.status)}
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
  statusPending: {
    color: 'orange',
    fontWeight: 'bold',
  },
  statusAccepted: {
    color: 'green',
    fontWeight: 'bold',
  },
  statusDeclined: {
    color: 'red',
    fontWeight: 'bold',
  },
});

export default NeighbourhoodWatchRequestCard;