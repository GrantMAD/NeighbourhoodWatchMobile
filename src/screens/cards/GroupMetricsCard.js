import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import UserCard from './UserCard';

const GroupMetricsCard = ({ item, userMetrics }) => {
  const [expanded, setExpanded] = useState(false);

  const profileCompleteness = [
    item.welcome_text,
    item.vision,
    item.mission,
    item.objectives,
    item.values,
    item.contact_email,
    item.main_image,
  ].filter(Boolean).length;
  const totalProfileFields = 7;
  const completenessPercentage = ((profileCompleteness / totalProfileFields) * 100).toFixed(0);

  const groupUsers = userMetrics.filter(user => user.group_id === item.id);

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <FontAwesome5 name="users" size={18} color="#6B7280" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>{item.name}</Text>
        </View>
        <FontAwesome5 name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.cardContent}>
          <Text style={styles.sectionHeading}>Basic Information</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <View style={styles.labelWithIcon}>
                <FontAwesome5 name="user" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.gridLabel}>Created By</Text>
              </View>
              <Text style={styles.gridValue}>
                {userMetrics.find(user => user.id === item.created_by)?.name || item.created_by}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.labelWithIcon}>
                <FontAwesome5 name="calendar-alt" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.gridLabel}>Created At</Text>
              </View>
              <Text style={styles.gridValue}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
          </View>

          <Text style={styles.sectionHeading}>Activity Metrics</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <View style={styles.labelWithIcon}>
                <FontAwesome5 name="users" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.gridLabel}>Members</Text>
              </View>
              <Text style={styles.gridValue}>{item.users ? item.users.length : 0}</Text>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.labelWithIcon}>
                <FontAwesome5 name="calendar-check" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.gridLabel}>Events</Text>
              </View>
              <Text style={styles.gridValue}>{item.events ? item.events.length : 0}</Text>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.labelWithIcon}>
                <FontAwesome5 name="newspaper" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.gridLabel}>News</Text>
              </View>
              <Text style={styles.gridValue}>{item.news ? item.news.length : 0}</Text>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.labelWithIcon}>
                <FontAwesome5 name="exclamation-triangle" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.gridLabel}>Reports</Text>
              </View>
              <Text style={styles.gridValue}>{item.reports ? item.reports.length : 0}</Text>
            </View>
          </View>

          <Text style={styles.sectionHeading}>Profile Details</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <View style={styles.labelWithIcon}>
                <FontAwesome5 name="book-open" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.gridLabel}>Welcome Text</Text>
              </View>
              <Text style={styles.gridValue}>{item.welcome_text ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.labelWithIcon}>
                <FontAwesome5 name="eye" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.gridLabel}>Vision</Text>
              </View>
              <Text style={styles.gridValue}>{item.vision ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.labelWithIcon}>
                <FontAwesome5 name="bullseye" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.gridLabel}>Mission</Text>
              </View>
              <Text style={styles.gridValue}>{item.mission ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.labelWithIcon}>
                <FontAwesome5 name="tasks" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.gridLabel}>Objectives</Text>
              </View>
              <Text style={styles.gridValue}>{item.objectives ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.labelWithIcon}>
                <FontAwesome5 name="hand-holding-heart" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.gridLabel}>Values</Text>
              </View>
              <Text style={styles.gridValue}>{item.values ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.labelWithIcon}>
                <FontAwesome5 name="image" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.gridLabel}>Main Image</Text>
              </View>
              <Text style={styles.gridValue}>{item.main_image ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.labelWithIcon}>
                <FontAwesome5 name="lock" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.gridLabel}>Password Set</Text>
              </View>
              <Text style={styles.gridValue}>{item.group_password ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.labelWithIcon}>
                <FontAwesome5 name="chart-pie" size={14} color="#6B7280" style={styles.labelIcon} />
                <Text style={styles.gridLabel}>Profile Completeness</Text>
              </View>
              <Text style={styles.gridValue}>{completenessPercentage}%</Text>
            </View>
          </View>
          <View style={styles.singleLineItemContainer}>
            <View style={styles.labelWithIcon}>
              <FontAwesome5 name="envelope" size={14} color="#6B7280" style={styles.labelIcon} />
              <Text style={styles.gridLabel}>Contact Email</Text>
            </View>
            <Text style={styles.gridValue}>{item.contact_email || 'N/A'}</Text>
          </View>
          <View style={styles.groupIdContainer}>
            <View style={styles.labelWithIcon}>
              <FontAwesome5 name="fingerprint" size={14} color="#1F2937" style={styles.labelIcon} />
              <Text style={[styles.gridLabel, { color: '#1F2937', fontWeight: '600' }]}>Group ID</Text>
            </View>
            <Text style={styles.groupIdValue}>{item.id}</Text>
          </View>
          <Text style={styles.membersTitle}>Members ({item.users ? item.users.length : 0})</Text>
          {groupUsers.map(user => (
            <UserCard key={user.id} item={user} />
          ))}
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
  gridLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelIcon: {
    marginRight: 5,
  },
  gridValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  groupIdContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  singleLineItemContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  groupIdValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#374151',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
});

export default GroupMetricsCard;