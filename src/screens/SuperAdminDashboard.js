import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView, TouchableOpacity, Animated, PanResponder, Alert, TextInput, Dimensions } from 'react-native';
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
import Toast from '../components/Toast';



const screenWidth = Dimensions.get('window').width;

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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [userEngagementMetrics, setUserEngagementMetrics] = useState({
    profileCompleteness: 0,
    checkInNotifications: 0,
    eventNotifications: 0,
    newsNotifications: 0,
  });
  const [roleMetrics, setRoleMetrics] = useState({
    admins: 0,
    members: 0,
  });

  const handleShowToast = (message, type) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleHideToast = () => {
    setShowToast(false);
    setToastMessage('');
  };

  const fetchCheckedInCount = async () => {
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('checked_in', true);

    if (error) {
      console.error('Error fetching checked-in count:', error.message);
    } else {
      setCheckedInCount(count || 0);
    }
  };

  const fetchUserEngagementMetrics = async () => {
    const { data, error } = await supabase.from('profiles').select('number, street, emergency_contact, vehicle_info, receive_check_notifications, receive_event_notifications, receive_news_notifications');

    if (error) {
      console.error('Error fetching user engagement metrics:', error.message);
    } else {
      const totalUsers = data.length;
      const profileCompleteness = data.filter(user => user.number && user.street && user.emergency_contact && user.vehicle_info).length / totalUsers * 100;
      const checkInNotifications = data.filter(user => user.receive_check_notifications).length / totalUsers * 100;
      const eventNotifications = data.filter(user => user.receive_event_notifications).length / totalUsers * 100;
      const newsNotifications = data.filter(user => user.receive_news_notifications).length / totalUsers * 100;

      setUserEngagementMetrics({
        profileCompleteness: profileCompleteness.toFixed(2),
        checkInNotifications: checkInNotifications.toFixed(2),
        eventNotifications: eventNotifications.toFixed(2),
        newsNotifications: newsNotifications.toFixed(2),
      });
    }
  };

  const fetchRoleMetrics = async () => {
    const { data, error } = await supabase.from('profiles').select('role');

    if (error) {
      console.error('Error fetching role metrics:', error.message);
    } else {
      const admins = data.filter(user => user.role === 'Admin').length;
      const members = data.filter(user => user.role === 'Member').length;

      setRoleMetrics({
        admins,
        members,
      });
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Confirm Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Sign Out",
          onPress: async () => {
            const { data: { session }, error: getSessionError } = await supabase.auth.getSession();

            if (getSessionError) {
              console.error('Error getting session:', getSessionError.message);
              Alert.alert('Error', `Failed to get session: ${getSessionError.message}`);
              return;
            }

            if (!session) {
              console.warn('No active session found, navigating to SignIn.');
              navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
              return;
            }

            const { error } = await supabase.auth.signOut();
            if (error) {
              console.error('Sign out error:', error.message);
              Alert.alert('Error', `Failed to sign out: ${error.message}`);
            } else {
              navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
            }
          },
          style: "destructive"
        }
      ],
      { cancelable: false }
    );
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
    fetchDataForCategory(activeCategory);
    if (activeCategory === 'overall') {
      fetchCheckedInCount();
      fetchUserEngagementMetrics();
    }
    if (activeCategory === 'users') {
      fetchRoleMetrics();
    }
  }, [activeCategory]);

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

  const fetchDataForCategory = async (category) => {
    setLoading(true);
    try {
      switch (category) {
        case 'overall':
          const { count: totalUsers, error: usersError } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
          const { count: totalGroups, error: groupsError } = await supabase.from('groups').select('id', { count: 'exact', head: true });
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
          break;
        case 'groups':
          const { data: groupsData, error: groupsDataError } = await supabase.from('groups').select('id, name, created_by, users, events, news, reports, contact_email, welcome_text, vision, mission, objectives, values, group_password, created_at');
          if (groupsDataError) console.error("Error fetching group data:", groupsDataError.message);
          setGroupMetrics(groupsData || []);
          break;
        case 'users':
          const { data: usersData, error: usersDataError } = await supabase.from('profiles').select('id, name, email, role, group_id, neighbourhoodwatch, checked_in, check_in_time, check_out_time, number, street, emergency_contact, vehicle_info, receive_check_notifications, receive_event_notifications, receive_news_notifications, Requests, created_at');
          if (usersDataError) console.error("Error fetching user data:", usersDataError.message);
          setUserMetrics(usersData || []);
          break;
        case 'events':
          const { data: eventsGroupsData, error: eventsGroupsDataError } = await supabase.from('groups').select('id, name, created_by, events');
          if (eventsGroupsDataError) console.error("Error fetching group data for events:", eventsGroupsDataError.message);
          const allEvents = eventsGroupsData ? eventsGroupsData.flatMap(group => (group.events ?? []).filter(event => event != null).map(event => ({ ...event, groupId: group.id, groupName: group.name, groupCreatorId: group.created_by }))) : [];
          setEventMetrics(allEvents);
          break;
        case 'news':
          const { data: newsGroupsData, error: newsGroupsDataError } = await supabase.from('groups').select('id, name, created_by, news');
          if (newsGroupsDataError) console.error("Error fetching group data for news:", newsGroupsDataError.message);
          const allNews = newsGroupsData ? newsGroupsData.flatMap(group => (group.news ?? []).map(story => ({ ...story, groupId: group.id, groupName: group.name, groupCreatorId: group.created_by }))) : [];
          setNewsMetrics(allNews);
          break;
        case 'incidents':
          const { data: incidentsGroupsData, error: incidentsGroupsDataError } = await supabase.from('groups').select('id, name, created_by, reports');
          if (incidentsGroupsDataError) console.error("Error fetching group data for incidents:", incidentsGroupsDataError.message);
          const allIncidents = incidentsGroupsData ? incidentsGroupsData.flatMap(group => (group.reports ?? []).map(report => ({ ...report, groupId: group.id, groupName: group.name, groupCreatorId: group.created_by }))) : [];
          setIncidentMetrics(allIncidents);
          break;
        case 'requests':
          const { data: usersRequestsData, error: usersRequestsDataError } = await supabase.from('profiles').select('id, name, email, Requests');
          if (usersRequestsDataError) console.error("Error fetching user data for requests:", usersRequestsDataError.message);
          const { data: groupsRequestsData, error: groupsRequestsDataError } = await supabase.from('groups').select('id, name, created_by, requests');
          if (groupsRequestsDataError) console.error("Error fetching group data for requests:", groupsRequestsDataError.message);

          const allUserRequests = usersRequestsData ? usersRequestsData.flatMap(user => (user.Requests ?? []).map(req => ({ ...req, userId: user.id, userName: user.name, userEmail: user.email }))) : [];
          const allGroupRequests = groupsRequestsData ? groupsRequestsData.flatMap(group => (group.requests ?? []).map(req => ({ ...req, groupId: group.id, groupName: group.name, creatorId: group.created_by }))) : [];
          setRequestMetrics({ userRequests: allUserRequests, groupRequests: allGroupRequests });
          break;
      }
    } catch (error) {
      console.error(`Error fetching data for ${category}:`, error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId, groupId) => {
    try {
      // Step 1: Fetch the group to get the current events and previous_events arrays
      const { data: group, error: fetchError } = await supabase
        .from('groups')
        .select('events, previous_events')
        .eq('id', groupId)
        .single();

      if (fetchError) throw new Error(`Failed to fetch group: ${fetchError.message}`);

      const eventToDelete = group.events.find(event => event.id === eventId);
      if (!eventToDelete) throw new Error("Event not found in the group.");

      // Step 2: Remove the event from the 'events' array
      const updatedEvents = group.events.filter(event => event.id !== eventId);

      // Step 3: Add the event to the 'previous_events' array
      const updatedPreviousEvents = [...(group.previous_events || []), eventToDelete];

      // Step 4: Update the group with the modified arrays
      const { error: updateError } = await supabase
        .from('groups')
        .update({ events: updatedEvents, previous_events: updatedPreviousEvents })
        .eq('id', groupId);

      if (updateError) throw new Error(`Failed to delete event: ${updateError.message}`);

      handleShowToast("Event successfully deleted and archived.", "success");
      fetchDataForCategory(activeCategory);
    } catch (error) {
      console.error("Event deletion error:", error.message);
      handleShowToast(error.message, "error");
    }
  };

  const handleDeleteNews = async (newsId, groupId) => {
    try {
      // Step 1: Fetch the group to get the current news array
      const { data: group, error: fetchError } = await supabase
        .from('groups')
        .select('news')
        .eq('id', groupId)
        .single();

      if (fetchError) throw new Error(`Failed to fetch group: ${fetchError.message}`);

      // Step 2: Remove the news story from the 'news' array
      const updatedNews = group.news.filter(story => story.id !== newsId);

      // Step 3: Update the group with the modified array
      const { error: updateError } = await supabase
        .from('groups')
        .update({ news: updatedNews })
        .eq('id', groupId);

      if (updateError) throw new Error(`Failed to delete news story: ${updateError.message}`);

      handleShowToast("News story successfully deleted.", "success");
      fetchDataForCategory(activeCategory);
    } catch (error) {
      console.error("News deletion error:", error.message);
      handleShowToast(error.message, "error");
    }
  };

  const handleDeleteIncident = async (incidentId, groupId) => {
    try {
      // Step 1: Fetch the group to get the current reports array
      const { data: group, error: fetchError } = await supabase
        .from('groups')
        .select('reports')
        .eq('id', groupId)
        .single();

      if (fetchError) throw new Error(`Failed to fetch group: ${fetchError.message}`);

      // Step 2: Remove the incident report from the 'reports' array
      const updatedReports = group.reports.filter(report => report.id !== incidentId);

      // Step 3: Update the group with the modified array
      const { error: updateError } = await supabase
        .from('groups')
        .update({ reports: updatedReports })
        .eq('id', groupId);

      if (updateError) throw new Error(`Failed to delete incident report: ${updateError.message}`);

      handleShowToast("Incident report successfully deleted.", "success");
      fetchDataForCategory(activeCategory);
    } catch (error) {
      console.error("Incident deletion error:", error.message);
      handleShowToast(error.message, "error");
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
          { title: 'Total Users', value: overallMetrics.totalUsers, icon: 'users', targetCategory: 'users' },
          { title: 'Total Groups', value: overallMetrics.totalGroups, icon: 'layer-group', targetCategory: 'groups' },
          { title: 'Total Events', value: overallMetrics.totalEvents, icon: 'calendar-check', targetCategory: 'events' },
          { title: 'Total News', value: overallMetrics.totalNews, icon: 'newspaper', targetCategory: 'news' },
          { title: 'Total Incidents', value: overallMetrics.totalIncidents, icon: 'exclamation-triangle', targetCategory: 'incidents' },
          { title: 'Checked-In Users', value: checkedInCount, icon: 'user-check', targetCategory: 'users' },
        ];
        return (
          <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.contentTitle}>Overall Application Metrics</Text>
            <Text style={styles.contentDescription}>A high-level overview of key metrics across the application.</Text>
            <View style={styles.metricsGrid}>
              {overallMetricsData.map((metric, index) => (
                <TouchableOpacity key={index} style={styles.metricCard} onPress={() => setActiveCategory(metric.targetCategory)}>
                  <FontAwesome5 name={metric.icon} size={24} color="#4A5568" style={styles.metricIcon} />
                  <Text style={styles.metricValue}>{metric.value}</Text>
                  <Text style={styles.metricCardTitle}>{metric.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.subContentTitleContainer}>
              <FontAwesome5 name="user-clock" size={20} color="#374151" style={styles.subContentTitleIcon} />
              <Text style={styles.subContentTitle}>User Engagement</Text>
            </View>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <FontAwesome5 name="id-card" size={24} color="#4A5568" style={styles.metricIcon} />
                <Text style={styles.engagementMetricValue}>{userEngagementMetrics.profileCompleteness}%</Text>
                <Text style={styles.metricCardTitle}>Profile Completeness</Text>
              </View>
              <View style={styles.metricCard}>
                <FontAwesome5 name="bell" size={24} color="#4A5568" style={styles.metricIcon} />
                <Text style={styles.engagementMetricValue}>{userEngagementMetrics.checkInNotifications}%</Text>
                <Text style={styles.metricCardTitle}>Check-in Notifications</Text>
              </View>
              <View style={styles.metricCard}>
                <FontAwesome5 name="calendar-alt" size={24} color="#4A5568" style={styles.metricIcon} />
                <Text style={styles.engagementMetricValue}>{userEngagementMetrics.eventNotifications}%</Text>
                <Text style={styles.metricCardTitle}>Event Notifications</Text>
              </View>
              <View style={styles.metricCard}>
                <FontAwesome5 name="newspaper" size={24} color="#4A5568" style={styles.metricIcon} />
                <Text style={styles.engagementMetricValue}>{userEngagementMetrics.newsNotifications}%</Text>
                <Text style={styles.metricCardTitle}>News Notifications</Text>
              </View>
            </View>

            

            
          </ScrollView>
        );
      case 'groups':
        return (
          <View style={[styles.contentContainer, { paddingBottom: 40 }]}>
            <Text style={styles.contentTitle}>Group Metrics</Text>
            <Text style={styles.contentDescription}>Click on a group to view detailed metrics and member information.</Text>
            <FlatList
              data={groupMetrics}
              keyExtractor={(item, index) => (item && item.id ? item.id.toString() : index.toString())}
              renderItem={({ item }) => <GroupMetricsCard item={item} userMetrics={userMetrics} onDelete={(message, type) => {
                handleShowToast(message, type);
                fetchDataForCategory(activeCategory);
              }} />}
            />
          </View>
        );
      case 'users':
        return (
          <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.contentTitle}>User Metrics</Text>
            <Text style={styles.contentDescription}>Overview of all registered users and their associated details.</Text>
            <Text style={styles.metricText}>Total Users: {overallMetrics.totalUsers}</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <FontAwesome5 name="user-shield" size={24} color="#4A5568" style={styles.metricIcon} />
                <Text style={styles.metricValue}>{roleMetrics.admins}</Text>
                <Text style={styles.metricCardTitle}>Admins</Text>
              </View>
              <View style={styles.metricCard}>
                <FontAwesome5 name="user" size={24} color="#4A5568" style={styles.metricIcon} />
                <Text style={styles.metricValue}>{roleMetrics.members}</Text>
                <Text style={styles.metricCardTitle}>Members</Text>
              </View>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name..."
              onChangeText={setSearchQuery}
              value={searchQuery}
            />
            <FlatList
              data={userMetrics.filter(user => user.name.toLowerCase().includes(searchQuery.toLowerCase()))}
              keyExtractor={(item, index) => (item && item.id ? item.id.toString() : index.toString())}
              renderItem={({ item }) => <UserCard item={item} onDelete={(message, type) => {
                handleShowToast(message, type);
                fetchDataForCategory('users');
              }} />}
              scrollEnabled={false}
            />
          </ScrollView>
        );
      case 'events':
        return (
          <View style={[styles.contentContainer, { paddingBottom: 40 }]}>
            <Text style={styles.contentTitle}>Event Metrics</Text>
            <Text style={styles.contentDescription}>Detailed overview of all events across the platform.</Text>
            <FlatList
              data={eventMetrics}
              keyExtractor={(item, index) => (item && item.id ? item.id.toString() : index.toString())}
              renderItem={({ item }) => <EventCard item={item} onDelete={handleDeleteEvent} />}
              initialNumToRender={5}
              windowSize={10}
            />
          </View>
        );
      case 'news':
        return (
          <View style={[styles.contentContainer, { paddingBottom: 40 }]}>
            <Text style={styles.contentTitle}>News Metrics</Text>
            <Text style={styles.contentDescription}>Overview of news stories published across all groups.</Text>
            <FlatList
              data={newsMetrics}
              keyExtractor={(item, index) => (item && item.id ? item.id.toString() : index.toString())}
              renderItem={({ item }) => <NewsCard item={item} userMetrics={userMetrics} onDelete={handleDeleteNews} />}
              initialNumToRender={5}
              windowSize={10}
            />
          </View>
        );
      case 'incidents':
        return (
          <View style={[styles.contentContainer, { paddingBottom: 40 }]}>
            <Text style={styles.contentTitle}>Incident Reports</Text>
            <Text style={styles.contentDescription}>Overview of all reported incidents across all groups.</Text>
            <FlatList
              data={incidentMetrics}
              keyExtractor={(item, index) => (item && item.id ? item.id.toString() : index.toString())}
              renderItem={({ item }) => <IncidentCard item={item} userMetrics={userMetrics} onDelete={handleDeleteIncident} />}
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
          <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: 40 }}>
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
          </ScrollView>
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
      <Toast visible={showToast} message={toastMessage} type={toastType} onHide={handleHideToast} />
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
    paddingVertical: 15,
    paddingLeft: 16, // Match other icons
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 20,
    marginTop: 20,
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
  engagementMetricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  metricCardTitle: {
    fontSize: 14,
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
  searchInput: {
    height: 40,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  chartContainer: {
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1F2937',
    textAlign: 'center',
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  filterContainer: {
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  filterButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  filterButtonText: {
    fontWeight: 'bold',
    color: '#4B5563',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sortLabel: {
    marginRight: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  sortButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginRight: 10,
  },
  sortButtonText: {
    fontWeight: 'bold',
    color: '#4B5563',
  },
});

export default SuperAdminDashboard;