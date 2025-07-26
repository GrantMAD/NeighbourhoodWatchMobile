import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView, TouchableOpacity, Animated, PanResponder } from 'react-native';
import { supabase } from '../../lib/supabase';
import { FontAwesome5 } from '@expo/vector-icons';
import GroupCard from './cards/GroupCard';
import UserCard from './cards/UserCard';
import EventCard from './cards/EventCard';
import NewsCard from './cards/NewsCard';
import IncidentCard from './cards/IncidentCard';
import GroupRequestCard from './cards/GroupRequestCard';
import NeighbourhoodWatchRequestCard from './cards/NeighbourhoodWatchRequestCard';
import GroupMetricsCard from './cards/GroupMetricsCard';
import { useNavigation } from '@react-navigation/native';

const SuperAdminDashboard = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('overall'); // Default active category
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false); // New state for sidebar expansion
  const sidebarWidthAnim = useRef(new Animated.Value(70)).current; // Initial width
  const mainContentMarginLeftAnim = useRef(new Animated.Value(8)).current; // Initial left margin for main content
  const _initialSidebarWidth = useRef(200); // Store initial width for dragging

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        _initialSidebarWidth.current = sidebarWidthAnim._value;
      },
      onPanResponderMove: (event, gestureState) => {
        const newWidth = Math.max(70, Math.min(200, _initialSidebarWidth.current + gestureState.dx)); // Min 70, Max 200
        sidebarWidthAnim.setValue(newWidth);
        mainContentMarginLeftAnim.setValue(newWidth); // Update main content position
        setIsSidebarExpanded(newWidth > 100); // Adjust threshold as needed
      },
      onPanResponderRelease: () => {
        // Optional: Snap to expanded/collapsed state after release
        const currentWidth = sidebarWidthAnim._value;
        if (currentWidth < 135) { // If less than half, snap to collapsed
          Animated.parallel([
            Animated.timing(sidebarWidthAnim, {
              toValue: 70,
              duration: 150,
              useNativeDriver: false,
            }),
            Animated.timing(mainContentMarginLeftAnim, {
              toValue: 8,
              duration: 150,
              useNativeDriver: false,
            }),
          ]).start(() => setIsSidebarExpanded(false));
        } else { // Snap to expanded
          Animated.parallel([
            Animated.timing(sidebarWidthAnim, {
              toValue: 200,
              duration: 150,
              useNativeDriver: false,
            }),
            Animated.timing(mainContentMarginLeftAnim, {
              toValue: 0,
              duration: 150,
              useNativeDriver: false,
            }),
          ]).start(() => setIsSidebarExpanded(true));
        }
      },
    })
  ).current;
  const [overallMetrics, setOverallMetrics] = useState({});
  const [groupMetrics, setGroupMetrics] = useState([]);
  const [userMetrics, setUserMetrics] = useState([]);
  const [eventMetrics, setEventMetrics] = useState([]);
  const [newsMetrics, setNewsMetrics] = useState([]);
  const [incidentMetrics, setIncidentMetrics] = useState([]);
  const [requestMetrics, setRequestMetrics] = useState({ userRequests: [], groupRequests: [] });
  const [expandedGroup, setExpandedGroup] = useState(null);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', 'Failed to sign out');
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
    }
  };

  const categories = [
    { key: 'overall', title: 'Overall Metrics', icon: 'chart-pie' },
    { key: 'groups', title: 'Group Metrics', icon: 'users' },
    { key: 'users', title: 'User Metrics', icon: 'user' },
    { key: 'events', title: 'Event Metrics', icon: 'calendar-alt' },
    { key: 'news', title: 'News Metrics', icon: 'newspaper' },
    { key: 'incidents', title: 'Incident Reports', icon: 'exclamation-triangle' },
    { key: 'requests', title: 'Requests', icon: 'handshake' },
    { key: 'signOut', title: 'Sign Out', icon: 'sign-out-alt' },
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  const toggleSidebar = () => {
    const newExpandedState = !isSidebarExpanded;
    setIsSidebarExpanded(newExpandedState);
    Animated.parallel([
      Animated.timing(sidebarWidthAnim, {
        toValue: newExpandedState ? 200 : 70, // Expanded: 200, Collapsed: 70 (just enough for icon + padding)
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(mainContentMarginLeftAnim, {
        toValue: newExpandedState ? 0 : 8, // Main content shifts left when sidebar expands
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch Overall Metrics
      const { count: totalUsers, error: usersError } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
      const { count: totalGroups, error: groupsError } = await supabase.from('groups').select('id', { count: 'exact', head: true });

      // Fetch all groups to get aggregated counts for events, news, reports
      const { data: allGroupsData, error: allGroupsError } = await supabase.from('groups').select('events, news, reports');
      if (allGroupsError) console.error("Error fetching all groups for counts:", allGroupsError.message);

      let totalEvents = 0;
      let totalNews = 0;
      let totalIncidents = 0;
      if (allGroupsData) {
        allGroupsData.forEach(group => {
          totalEvents += group.events ? group.events.length : 0;
          totalNews += group.news ? group.news.length : 0;
          totalIncidents += group.reports ? group.reports.length : 0;
        });
      }

      setOverallMetrics({
        totalUsers: totalUsers || 0,
        totalGroups: totalGroups || 0,
        totalEvents: totalEvents,
        totalNews: totalNews,
        totalIncidents: totalIncidents,
      });

      // Fetch Group Metrics
      const { data: groupsData, error: groupsDataError } = await supabase.from('groups').select('id, name, created_by, users, events, news, reports, contact_email, welcome_text, vision, mission, objectives, values, group_password, created_at'); // Added created_at
      if (groupsDataError) console.error("Error fetching group data:", groupsDataError.message);
      setGroupMetrics(groupsData || []);

      // Fetch User Metrics (basic)
      const { data: usersData, error: usersDataError } = await supabase.from('profiles').select('id, name, email, role, group_id, neighbourhoodwatch, checked_in, check_in_time, check_out_time, number, street, emergency_contact, vehicle_info, receive_check_notifications, receive_event_notifications, receive_news_notifications, Requests, created_at'); // Added created_at
      if (usersDataError) console.error("Error fetching user data:", usersDataError.message);
      setUserMetrics(usersData || []);

      // Event Metrics (will be derived from groupMetrics.events)
      const allEvents = groupsData ? groupsData.flatMap(group => (group.events ?? []).filter(event => event != null).map(event => ({ ...event, groupId: group.id, groupName: group.name, groupCreatorId: group.created_by }))) : [];
      setEventMetrics(allEvents);

      // News Metrics (will be derived from groupMetrics.news)
      const allNews = groupsData ? groupsData.flatMap(group => (group.news ?? []).map(story => ({ ...story, groupId: group.id, groupName: group.name, groupCreatorId: group.created_by }))) : [];
      setNewsMetrics(allNews);

      // Incident Metrics (will be derived from groupMetrics.reports)
      const allIncidents = groupsData ? groupsData.flatMap(group => (group.reports ?? []).map(report => ({ ...report, groupId: group.id, groupName: group.name, groupCreatorId: group.created_by }))) : [];
      setIncidentMetrics(allIncidents);

      // Request Metrics (will be derived from userMetrics.Requests and groupMetrics.requests)
      const allUserRequests = usersData ? usersData.flatMap(user => (user.Requests ?? []).map(req => ({ ...req, userId: user.id, userName: user.name, userEmail: user.email }))) : [];
      const allGroupRequests = groupsData ? groupsData.flatMap(group => (group.requests ?? []).map(req => ({ ...req, groupId: group.id, groupName: group.name, creatorId: group.created_by }))) : [];
      setRequestMetrics({ userRequests: allUserRequests, groupRequests: allGroupRequests });

    } catch (error) {
      console.error("Error fetching all dashboard data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.contentContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading dashboard data...</Text>
        </View>
      );
    }

    switch (activeCategory) {
      case 'overall':
        const overallMetricsData = [
          { title: 'Total Users', value: overallMetrics.totalUsers, icon: 'users' },
          { title: 'Total Groups', value: overallMetrics.totalGroups, icon: 'layer-group' },
          { title: 'Total Events', value: overallMetrics.totalEvents, icon: 'calendar-check' },
          { title: 'Total News', value: overallMetrics.totalNews, icon: 'newspaper' },
          { title: 'Total Incidents', value: overallMetrics.totalIncidents, icon: 'exclamation-triangle' },
        ];
        return (
          <ScrollView style={styles.contentContainer} contentContainerStyle={{paddingBottom: 20}}>
            <Text style={styles.contentTitle}>Overall Application Metrics</Text>
            <Text style={styles.contentDescription}>A high-level overview of key metrics across the application.</Text>
            <View style={styles.metricsGrid}>
              {overallMetricsData.map((metric, index) => (
                <View key={index} style={styles.metricCard}>
                  <FontAwesome5 name={metric.icon} size={24} color="#4A5568" style={styles.metricIcon} />
                  <Text style={styles.metricValue}>{metric.value}</Text>
                  <Text style={styles.metricCardTitle}>{metric.title}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        );
      case 'groups':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Group Metrics</Text>
            <Text style={styles.contentDescription}>Click on a group to view detailed metrics and member information.</Text>
            <FlatList
              data={groupMetrics}
              keyExtractor={(item, index) => (item && item.id ? item.id.toString() : index.toString())}
              renderItem={({ item }) => <GroupMetricsCard item={item} userMetrics={userMetrics} />}
            />
          </View>
        );
      case 'users':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>User Metrics</Text>
            <FlatList
              data={userMetrics}
              keyExtractor={(item, index) => (item && item.id ? item.id.toString() : index.toString())}
              renderItem={({ item }) => <UserCard item={item} />}
              initialNumToRender={5}
              windowSize={10}
            />
          </View>
        );
      case 'events':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Event Metrics</Text>
            <Text style={styles.contentDescription}>Detailed overview of all events across the platform.</Text>
            <FlatList
              data={eventMetrics}
              keyExtractor={(item, index) => (item && item.id ? item.id.toString() : index.toString())}
              renderItem={({ item }) => <EventCard item={item} />}
              initialNumToRender={5}
              windowSize={10}
            />
          </View>
        );
      case 'news':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>News Metrics</Text>
            <Text style={styles.contentDescription}>Overview of news stories published across all groups.</Text>
            <FlatList
              data={newsMetrics}
              keyExtractor={(item, index) => (item && item.id ? item.id.toString() : index.toString())}
              renderItem={({ item }) => <NewsCard item={item} userMetrics={userMetrics} />}
              initialNumToRender={5}
              windowSize={10}
            />
          </View>
        );
      case 'incidents':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Incident Reports</Text>
            <FlatList
              data={incidentMetrics}
              keyExtractor={(item, index) => (item && item.id ? item.id.toString() : index.toString())}
              renderItem={({ item }) => <IncidentCard item={item} />}
              initialNumToRender={5}
              windowSize={10}
            />
          </View>
        );
      case 'requests':
        const totalGroupRequests = requestMetrics.groupRequests.length;
        const acceptedGroupRequests = requestMetrics.groupRequests.filter(req => req.status === 'accepted').length;
        const declinedGroupRequests = requestMetrics.groupRequests.filter(req => req.status === 'declined').length;
        const pendingGroupRequests = requestMetrics.groupRequests.filter(req => req.status === 'pending').length;

        const totalNWRequests = requestMetrics.userRequests.filter(req => req.type === 'Neighbourhood watch request').length;
        const acceptedNWRequests = requestMetrics.userRequests.filter(req => req.type === 'Neighbourhood watch request' && req.status === 'accepted').length;
        const declinedNWRequests = requestMetrics.userRequests.filter(req => req.type === 'Neighbourhood watch request' && req.status === 'declined').length;
        const pendingNWRequests = requestMetrics.userRequests.filter(req => req.type === 'Neighbourhood watch request' && req.status === 'pending').length;

        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Requests</Text>
            <Text style={styles.contentDescription}>Manage group join requests and Neighbourhood Watch join requests.</Text>

            <View style={styles.subContentTitleContainer}>
              <FontAwesome5 name="users" size={20} color="#374151" style={styles.subContentTitleIcon} />
              <Text style={styles.subContentTitle}>Group Requests</Text>
            </View>
            <Text style={styles.metricText}>Total: {totalGroupRequests}</Text>
            <Text style={styles.metricText}>Accepted: {acceptedGroupRequests}</Text>
            <Text style={styles.metricText}>Declined: {declinedGroupRequests}</Text>
            <Text style={styles.metricText}>Pending: {pendingGroupRequests}</Text>
            <Text style={styles.listHeading}>Pending Group Requests</Text>
            {requestMetrics.groupRequests.length > 0 ? (
              <FlatList
                data={requestMetrics.groupRequests}
                keyExtractor={(item, index) => (item && item.id ? item.id.toString() : index.toString())}
                renderItem={({ item }) => <GroupRequestCard item={item} userMetrics={userMetrics} />}
                initialNumToRender={5}
                windowSize={10}
              />
            ) : (
              <Text style={styles.noRequestsText}>No pending group requests.</Text>
            )}

            <View style={styles.subContentTitleContainer}>
              <FontAwesome5 name="eye" size={20} color="#374151" style={styles.subContentTitleIcon} />
              <Text style={styles.subContentTitle}>Neighbourhood Requests</Text>
            </View>
            <Text style={styles.metricText}>Total: {totalNWRequests}</Text>
            <Text style={styles.metricText}>Accepted: {acceptedNWRequests}</Text>
            <Text style={styles.metricText}>Declined: {declinedNWRequests}</Text>
            <Text style={styles.metricText}>Pending: {pendingNWRequests}</Text>
            <Text style={styles.listHeading}>Pending Neighbourhood Requests</Text>
            {requestMetrics.userRequests.filter(req => req.type === 'Neighbourhood watch request').length > 0 ? (
              <FlatList
                data={requestMetrics.userRequests.filter(req => req.type === 'Neighbourhood watch request')}
                keyExtractor={(item, index) => (item && item.id ? item.id.toString() : index.toString())}
                renderItem={({ item }) => <NeighbourhoodWatchRequestCard item={item} userMetrics={userMetrics} />}
                initialNumToRender={5}
                windowSize={10}
              />
            ) : (
              <Text style={styles.noRequestsText}>No pending Neighbourhood requests.</Text>
            )}
          </View>
        );
      default:
        return <Text>Select a category</Text>;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.sidebar, { width: sidebarWidthAnim }, isSidebarExpanded && styles.sidebarOverlay]}>
        <View style={styles.sidebarHeader}>
          {isSidebarExpanded && <Text style={styles.sidebarTitle}>Dashboard</Text>}
          <TouchableOpacity onPress={toggleSidebar} style={styles.sidebarToggle}>
            <FontAwesome5
              name={isSidebarExpanded ? 'chevron-left' : 'chevron-right'}
              size={18}
              color="#f9fafb"
            />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.sidebarContent}>
          {categories.filter(category => category.key !== 'signOut').map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.sidebarButton,
                activeCategory === category.key && styles.sidebarButtonActive,
              ]}
              onPress={() => setActiveCategory(category.key)}
            >
              <View style={styles.sidebarIconContainer}>
                <FontAwesome5 name={category.icon} size={18} color="#a0aec0" />
              </View>
              {isSidebarExpanded && <Text style={styles.sidebarButtonText}>{category.title}</Text>}
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          key="signOut"
          style={[
            styles.sidebarButton,
            styles.sidebarButtonSignOut,
          ]}
          onPress={handleSignOut}
        >
          <View style={styles.sidebarIconContainer}>
            <FontAwesome5 name="sign-out-alt" size={18} color="#a0aec0" />
          </View>
          {isSidebarExpanded && <Text style={styles.sidebarButtonText}>Sign Out</Text>}
        </TouchableOpacity>
        <View style={styles.sidebarHandle} {...panResponder.panHandlers} />
      </Animated.View>
      <Animated.View style={[styles.mainContent, { marginLeft: mainContentMarginLeftAnim }]}>{renderContent()}</Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  sidebar: {
    backgroundColor: '#1f2937',
    padding: 16,
    paddingTop: 40,
    justifyContent: 'space-between', // Distributes content and pushes sign-out to bottom
    opacity: 0.95,
  },
  sidebarOverlay: {
    position: 'absolute',
    zIndex: 10,
    height: '100%',
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sidebarToggle: {
    padding: 5,
  },
  sidebarTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f9fafb',
  },
  sidebarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  sidebarButtonActive: {
    backgroundColor: '#2e4053',
  },
  sidebarButtonSignOut: {
    marginTop: 'auto', // Pushes the sign-out button to the bottom
    backgroundColor: '#dc3545', // A distinct color for sign-out
  },
  sidebarButtonText: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '600',
  },
  sidebarIcon: {
    marginRight: 10,
  },
  sidebarIconContainer: {
    width: 24, // Fixed width for the icon container
    alignItems: 'center',
    marginRight: 10, // Space between icon and text
  },
  sidebarContent: {
    flex: 1, // Allows the scroll view to take up available space
  },
  sidebarHandle: {
    width: 20,
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    cursor: 'ew-resize', // Indicates horizontal resizing
  },
  mainContent: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  contentDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  subContentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 10,
    color: '#374151',
  },
  subContentTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  subContentTitleIcon: {
    marginRight: 10,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
  },
  metricText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#374151',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1f2937',
    textAlign: 'center',
  },
  modalDetailText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#4b5563',
  },
  modalDetailLabel: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalCloseButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: 'center',
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  metricCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    width: '48%', // Two cards per row with a small gap
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricIcon: {
    marginBottom: 15,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  metricCardTitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 5,
  },
  listHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 10,
  },
  noRequestsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
});

export default SuperAdminDashboard;