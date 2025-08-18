import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

const UserCard = React.memo(({ item, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const handleDelete = async () => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete the user "${item.name || item.email}"? This action is irreversible.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Step 1: Check if the user is a creator of any groups
              const { data: ownedGroups, error: ownedGroupsError } = await supabase
                .from('groups')
                .select('id, name, users')
                .eq('created_by', item.id);

              if (ownedGroupsError) throw new Error(`Failed to check for group ownership: ${ownedGroupsError.message}`);

              if (ownedGroups && ownedGroups.length > 0) {
                // User is a group owner, handle with special logic
                handleGroupOwnerDeletion(ownedGroups);
              } else {
                // User is not a group owner, proceed with normal deletion
                await proceedWithDeletion(item.id);
              }
            } catch (error) {
              console.error("Deletion error:", error.message);
              onDelete(error.message, "error");
            }
          }
        }
      ]
    );
  };

  const handleGroupOwnerDeletion = (ownedGroups) => {
    const group = ownedGroups[0]; // Handling one group for simplicity
    const otherMembers = group.users.filter(uid => uid !== item.id);

    const deleteGroupAndUser = async () => {
      try {
        // Step 1: Disassociate all members from the group to prevent foreign key violation
        const { error: updateProfilesError } = await supabase
          .from('profiles')
          .update({ group_id: null })
          .in('id', group.users);

        if (updateProfilesError) throw new Error(`Failed to disassociate users: ${updateProfilesError.message}`);

        // Step 2: Now it's safe to delete the group
        const { error: deleteGroupError } = await supabase.from('groups').delete().eq('id', group.id);
        if (deleteGroupError) throw new Error(`Failed to delete group: ${deleteGroupError.message}`);

        // Step 3: Proceed with deleting the user
        await proceedWithDeletion(item.id, false); // 'false' because group is already handled
      } catch (error) {
        console.error("Deletion error:", error.message);
        onDelete(error.message, "error");
      }
    };

    if (otherMembers.length === 0) {
      // Owner is the only member
      Alert.alert(
        "Ownership Conflict",
        `This user is the sole owner and member of the group "${group.name}". To delete this user, the group must also be deleted.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete Group & User",
            style: "destructive",
            onPress: deleteGroupAndUser,
          },
        ]
      );
    } else {
      // Owner has other members in the group
      Alert.alert(
        "Ownership Conflict",
        `This user is the creator of the group "${group.name}". What would you like to do?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete Group & User",
            style: "destructive",
            onPress: deleteGroupAndUser,
          },
          {
            text: "Auto-Reassign & Delete",
            onPress: async () => {
              try {
                const newOwnerId = otherMembers[0]; // Assign to the first other member
                const { error: updateGroupError } = await supabase
                  .from('groups')
                  .update({ created_by: newOwnerId })
                  .eq('id', group.id);

                if (updateGroupError) throw new Error(`Failed to reassign ownership: ${updateGroupError.message}`);

                // Now delete the user
                await proceedWithDeletion(item.id);
              } catch (error) {
                console.error("Deletion error:", error.message);
                onDelete(error.message, "error");
              }
            },
          },
        ]
      );
    }
  };

  const proceedWithDeletion = async (userId, handleGroupMembership = true) => {
    // Step 1: Fetch the user's latest profile to ensure data is not stale
    const { data: userProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('group_id, neighbourhoodwatch')
      .eq('id', userId)
      .single();

    if (fetchError) throw new Error(`Failed to fetch user profile: ${fetchError.message}`);

    // Step 2: If user is in a group, remove them from the group's 'users' array
    if (handleGroupMembership && userProfile.group_id) {
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('users')
        .eq('id', userProfile.group_id)
        .single();

      if (groupError) throw new Error(`Failed to fetch group for update: ${groupError.message}`);

      if (groupData && groupData.users) {
        const updatedUsers = groupData.users.filter(uid => uid !== userId);
        const { error: updateGroupError } = await supabase
          .from('groups')
          .update({ users: updatedUsers })
          .eq('id', userProfile.group_id);

        if (updateGroupError) throw new Error(`Failed to update group members: ${updateGroupError.message}`);
      }
    }

    // Step 3: If user is in a Neighbourhood Watch, remove them
    if (userProfile.neighbourhoodwatch && userProfile.neighbourhoodwatch.length > 0) {
      const creatorId = userProfile.neighbourhoodwatch[0].creator_id;
      const { data: creatorData, error: creatorError } = await supabase
        .from('profiles')
        .select('neighbourhoodwatch')
        .eq('id', creatorId)
        .single();

      if (creatorError) throw new Error(`Failed to fetch NW creator: ${creatorError.message}`);

      if (creatorData && creatorData.neighbourhoodwatch) {
        const updatedNW = creatorData.neighbourhoodwatch.map(nw => {
          if (nw.members) {
            nw.members = nw.members.filter(memberId => memberId !== userId);
          }
          return nw;
        });

        const { error: updateCreatorError } = await supabase
          .from('profiles')
          .update({ neighbourhoodwatch: updatedNW })
          .eq('id', creatorId);

        if (updateCreatorError) throw new Error(`Failed to update NW creator: ${updateCreatorError.message}`);
      }
    }

    // Step 4: Delete the user's row from the 'profiles' table
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (deleteProfileError) throw new Error(`Failed to delete profile: ${deleteProfileError.message}`);

    // Step 5: Delete the user from auth
    const { error: deleteAuthUserError } = await supabase.rpc('delete_user_by_id', { user_id: userId });

    if (deleteAuthUserError) throw new Error(`Failed to delete auth user: ${deleteAuthUserError.message}`);

    onDelete("User successfully deleted.", "success");
  };

  const renderDetail = (label, value, icon, customStyle = {}) => (
    <View style={[styles.gridItem, customStyle]}>
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
          {/* ... existing content ... */}
          <Text style={styles.sectionHeading}>Basic Information</Text>
          <View style={styles.grid}>
            {renderDetail('Role', item.role, 'user-tag')}
            {renderDetail('Created At', new Date(item.created_at).toLocaleDateString(), 'calendar-alt')}
          </View>
          <View style={styles.singleLineItemContainer}>
            {renderDetail('Last Signed In', item.last_signed_in ? new Date(item.last_signed_in).toLocaleString('en-GB', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit', 
                          second: '2-digit' 
                        }) : 'Never', 'sign-in-alt', { width: '100%' })}
          </View>
          <View style={styles.singleLineItemContainer}>
            <View style={styles.labelWithIcon}>
              <FontAwesome5 name="at" size={14} color="#6B7280" style={styles.labelIcon} />
              <Text style={styles.gridLabel}>Email</Text>
            </View>
            <Text style={styles.gridValue}>{item.email}</Text>
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
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <FontAwesome5 name="trash-alt" size={16} color="#FFF" />
            <Text style={styles.deleteButtonText}>Delete User</Text>
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
    alignItems: 'flex-start',
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

export default UserCard;