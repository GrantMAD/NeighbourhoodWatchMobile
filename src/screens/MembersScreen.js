import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const STATIC_MEMBERS = [
  {
    id: "1",
    name: "Alice Johnson",
    cpfSector: "North Sector",
    address: "123 Maple St",
    number: "555-1234",
    email: "alice@example.com",
    checkedIn: true,
  },
  {
    id: "2",
    name: "Bob Smith",
    cpfSector: "North Sector",
    address: "456 Oak St",
    number: "555-5678",
    email: "bob@example.com",
    checkedIn: false,
  },
  {
    id: "3",
    name: "Carol Williams",
    cpfSector: "South Sector",
    address: "789 Pine St",
    number: "555-8765",
    email: "carol@example.com",
    checkedIn: true,
  },
  {
    id: "4",
    name: "Dave Brown",
    cpfSector: "South Sector",
    address: "101 Elm St",
    number: "555-4321",
    email: "dave@example.com",
    checkedIn: false,
  },
  {
    id: "5",
    name: "Eve Davis",
    cpfSector: "Unassigned",
    address: "202 Birch St",
    number: "555-1111",
    email: "eve@example.com",
    checkedIn: true,
  },
];

export default function MembersScreen() {
  const [searchTerm, setSearchTerm] = useState("");
  const [groupVisibility, setGroupVisibility] = useState({});

  // Group members by sector
  const groupedMembers = STATIC_MEMBERS.reduce((groups, member) => {
    const sector = member.cpfSector || "Unassigned";
    if (!groups[sector]) groups[sector] = [];
    groups[sector].push(member);
    return groups;
  }, {});

  const checkedInCount = Object.fromEntries(
    Object.entries(groupedMembers).map(([sector, members]) => [
      sector,
      members.filter((m) => m.checkedIn).length,
    ])
  );

  const toggleGroup = (sector) => {
    setGroupVisibility((prev) => ({
      ...prev,
      [sector]: !prev[sector],
    }));
  };

  const filterMember = (member) => {
    const term = searchTerm.toLowerCase();
    return (
      member.name.toLowerCase().includes(term) ||
      (member.cpfSector && member.cpfSector.toLowerCase().includes(term))
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Member's List</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Name or Sector"
          placeholderTextColor="#999"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <View style={styles.infoTextContainer}>
        <Text style={styles.infoText}>
          All signed-up members are displayed below. Use the search bar to
          filter members by name or sector. Tap the sector header to expand or
          collapse the list.
        </Text>
      </View>

      <FlatList
        data={Object.entries(groupedMembers)}
        keyExtractor={([sector]) => sector}
        renderItem={({ item: [sector, members] }) => {
          const isVisible = groupVisibility[sector];
          const filteredMembers = members.filter(filterMember);

          if (filteredMembers.length === 0) return null;

          return (
            <View style={styles.groupContainer}>
              <TouchableOpacity
                onPress={() => toggleGroup(sector)}
                style={[
                  styles.groupHeader,
                  { flexDirection: "column", alignItems: "flex-start" },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <FontAwesome name="home" size={20} color="#fff" />
                  <Text style={styles.groupTitle}>{sector}</Text>
                  <Text style={styles.groupCount}>
                    ({filteredMembers.length}{" "}
                    {filteredMembers.length === 1 ? "Member" : "Members"})
                  </Text>
                  <FontAwesome
                    name={isVisible ? "angle-up" : "angle-down"}
                    size={20}
                    color="#fff"
                    style={{ marginLeft: "auto" }}
                  />
                </View>
                <Text
                  style={[styles.checkedInCount, { marginLeft: 28, marginTop: 2 }]}
                >
                  {checkedInCount[sector]} checked in
                </Text>
              </TouchableOpacity>

              {isVisible &&
                filteredMembers.map((member, idx) => (
                  <View
                    key={member.id}
                    style={[
                      styles.memberCard,
                      { backgroundColor: idx % 2 === 0 ? "#fafafa" : "#fff" },
                    ]}
                  >
                    <View style={styles.row}>
                      <Text style={styles.label}>Name:</Text>
                      <Text style={styles.value}>{member.name}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Address:</Text>
                      <Text style={styles.value}>{member.address}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Contact Number:</Text>
                      <Text style={styles.value}>{member.number}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Email:</Text>
                      <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
                        {member.email}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Checked In:</Text>
                      <Text
                        style={[
                          styles.value,
                          member.checkedIn
                            ? { color: "limegreen" }
                            : { color: "gray" },
                        ]}
                      >
                        {member.checkedIn ? "✓" : "✗"}
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 16,
    backgroundColor: "#f0f0f0",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    color: "#2f95dc",
  },
  searchContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    height: 40,
    fontSize: 16,
    color: "#222",
  },
  infoTextContainer: {
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
  groupContainer: {
    marginBottom: 12,
    backgroundColor: "#333",
    borderRadius: 8,
    overflow: "hidden",
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 8,
  },
  groupCount: {
    fontSize: 14,
    color: "#ddd",
    marginLeft: 8,
  },
  checkedInCount: {
    fontSize: 14,
    color: "#aaffaa",
    marginLeft: 8,
  },
  memberCard: {
    padding: 12,
    borderBottomColor: "#ddd",
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    fontWeight: "700",
    color: "#555",
    width: 120,
  },
  value: {
    flex: 1,
    color: "#222",
  },
});
