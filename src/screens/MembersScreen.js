import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  UIManager
} from 'react-native';

import { supabase } from '../../lib/supabase';


if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const defaultAvatar = require('../../assets/Images/user.png');

const MembersScreen = ({ route }) => {
  const { groupId } = route.params;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMemberIds, setExpandedMemberIds] = useState([]);
  const [checkInAnimations, setCheckInAnimations] = useState({});
  const [checkOutAnimations, setCheckOutAnimations] = useState({});

  const fetchGroupMembers = async () => {
    setLoading(true);

    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('users')
      .eq('id', groupId)
      .single();

    if (groupError) {
      console.error('Error fetching group:', groupError);
      setLoading(false);
      return;
    }

    const userIds = groupData?.users || [];

    if (userIds.length === 0) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url, number, street, emergency_contact, check_in_time, check_out_time')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      setLoading(false);
      return;
    }

    setMembers(profiles);
    const newCheckInAnims = {};
    const newCheckOutAnims = {};
    profiles.forEach(profile => {
      newCheckInAnims[profile.id] = new Animated.Value(0);
      newCheckOutAnims[profile.id] = new Animated.Value(0);
    });
    setCheckInAnimations(newCheckInAnims);
    setCheckOutAnimations(newCheckOutAnims);
    setLoading(false);
  };

  useEffect(() => {
    fetchGroupMembers();
  }, [groupId]);

  const toggleDropdown = (id) => {
    setExpandedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleCheckIn = (id) => {
    const anim = checkInAnimations[id];
    const toValue = anim._value === 0 ? 1 : 0;

    Animated.timing(anim, {
      toValue,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // must be false for height animation
    }).start();
  };

  const toggleCheckOut = (id) => {
    const anim = checkOutAnimations[id];
    const toValue = anim._value === 0 ? 1 : 0;

    Animated.timing(anim, {
      toValue,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const groupByDayWithDate = (timestamps) => {
    if (!Array.isArray(timestamps)) return {};

    return timestamps.reduce((acc, ts) => {
      const date = new Date(ts);
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });
      const fullDate = date.toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const key = `${day} - ${fullDate}`;
      const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (!acc[key]) acc[key] = [];
      acc[key].push(formattedTime);
      return acc;
    }, {});
  };

  const renderItem = ({ item }) => {
    const isExpanded = expandedMemberIds.includes(item.id);

    return (
      <TouchableOpacity
        onPress={() => toggleDropdown(item.id)}
        activeOpacity={0.8}
        style={styles.memberCard}
      >
        <View style={styles.mainRow}>
          <Image
            source={item.avatar_url ? { uri: item.avatar_url } : defaultAvatar}
            style={styles.avatar}
          />
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <Text style={{ marginRight: 6, marginTop: 2, fontSize: 16, color: "#fff" }}>👤</Text>
            <Text style={styles.name}>{item.name || 'No Name'}</Text>
          </View>
          <Text
            style={{ fontSize: 18, color: "#fff" }}
          >{isExpanded ? '▲' : '▼'}</Text>
        </View>

        {isExpanded && (
          <View style={styles.dropdown}>
            <Text style={styles.dropdownHeading}>User Information</Text>
            <View style={styles.detailRow}>
              <Text style={styles.icon}>📞</Text>
              <Text style={styles.detailLabel}>Contact Number:</Text>
              <Text style={styles.detailText}>{item.number || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.icon}>✉️</Text>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.email}>{item.email || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.icon}>💳</Text>
              <Text style={styles.detailLabel}>Emergency Contact:</Text>
              <Text style={styles.detailText}>{item.emergency_contact || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.icon}>📍</Text>
              <Text style={styles.detailLabel}>Street:</Text>
              <Text style={styles.detailText}>{item.street || '-'}</Text>
            </View>

            <TouchableOpacity onPress={() => toggleCheckIn(item.id)} style={styles.toggleHeader}>
              <View style={styles.iconTextRow}>
                <Text style={styles.icon}>⏱️</Text>
                <Text style={styles.dropdownSubHeading}>Check-in Times</Text>
              </View>
              <Text
                style={{ fontSize: 16 }}
              >{checkInAnimations[item.id]?._value === 1 ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            <Animated.View
              style={{
                overflow: 'hidden',
                height: checkInAnimations[item.id]?.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 150], // Adjust 150 based on how much content you expect
                }),
                opacity: checkInAnimations[item.id]?.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
                marginLeft: 10,
                marginBottom: 10,
              }}
            >
              {(Array.isArray(item.check_in_time) && item.check_in_time.length > 0) ? (
                Object.entries(groupByDayWithDate(item.check_in_time)).map(([dayKey, times]) => (
                  <View key={dayKey} style={{ marginBottom: 6 }}>
                    <Text style={{ fontWeight: '700', color: '#555' }}>{dayKey}</Text>
                    {times.map((time, idx) => (
                      <Text key={idx} style={{ color: '#666', marginLeft: 10 }}>
                        • {time}
                      </Text>
                    ))}
                  </View>
                ))
              ) : (
                <Text style={{ color: '#999' }}>No check-ins</Text>
              )}
            </Animated.View>

            <TouchableOpacity onPress={() => toggleCheckOut(item.id)} style={styles.toggleHeader}>
              <View style={styles.iconTextRow}>
                <Text style={styles.icon}>⏱️</Text>
                <Text style={styles.dropdownSubHeading}>Check-out Times</Text>
              </View>
              <Text
                style={{ fontSize: 16 }}
              >{checkOutAnimations[item.id]?._value === 1 ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            <Animated.View
              style={{
                overflow: 'hidden',
                height: checkOutAnimations[item.id]?.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 150], // adjust this value based on your expected content height
                }),
                opacity: checkOutAnimations[item.id]?.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
                marginLeft: 10,
                marginBottom: 10,
              }}
            >
              {(Array.isArray(item.check_out_time) && item.check_out_time.length > 0) ? (
                Object.entries(groupByDayWithDate(item.check_out_time)).map(([dayKey, times]) => (
                  <View key={dayKey} style={{ marginBottom: 6 }}>
                    <Text style={{ fontWeight: '700', color: '#555' }}>{dayKey}</Text>
                    {times.map((time, idx) => (
                      <Text key={idx} style={{ color: '#666', marginLeft: 10 }}>
                        • {time}
                      </Text>
                    ))}
                  </View>
                ))
              ) : (
                <Text style={{ color: '#999' }}>No check-outs</Text>
              )}
            </Animated.View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Members</Text>
      <Text style={styles.description}>Here you can see all the members of this group.</Text>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 16,
  },
  memberCard: {
    borderRadius: 8,
    marginVertical: 6,
    backgroundColor: '#333',
    overflow: 'hidden',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1f2937',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#666',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  email: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  dropdown: {
    backgroundColor: '#f9f9f9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  dropdownHeading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
    textDecorationLine: 'underline',
  },
  dropdownSubHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginRight: 6,
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 6,
    paddingVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    marginRight: 8,
    width: 20,
    textAlign: 'center',
  },
  detailLabel: {
    fontWeight: '600',
    marginRight: 6,
    color: '#333',
    width: 120,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default MembersScreen;