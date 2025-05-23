import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
}

const IncidentScreen = () => {
  const [reports, setReports] = useState([]);
  const [expandedReportId, setExpandedReportId] = useState(null);

  const sampleReports = [
    {
      id: '1',
      title: 'Stolen Bike',
      dateReport: '2025-05-20',
      patrollerName: 'John Doe',
      description: 'A bike was stolen from Main Street.',
      location: 'Main Street',
      date: '2025-05-19',
      time: '14:00',
      policeNumber: 'XYZ123',
      viewCount: 3,
    },
    {
      id: '2',
      title: 'Vandalism',
      dateReport: '2025-05-21',
      patrollerName: 'Jane Smith',
      description: 'Graffiti found on wall near the park.',
      location: 'Central Park',
      date: '2025-05-20',
      time: '09:30',
      policeNumber: 'ABC456',
      viewCount: 5,
    },
  ];

  useEffect(() => {
    setReports(sampleReports);
  }, []);

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedReportId(prevId => (prevId === id ? null : id));
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#E4E4E7', paddingTop: 40 }}>
      <Text style={{
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        textDecorationLine: 'underline',
        marginBottom: 20,
        color: '#2f95dc',
      }}>
        Incident Reports
      </Text>

      {reports.map((report) => {
        const isExpanded = report.id === expandedReportId;
        return (
          <View
            key={report.id}
            style={{
              backgroundColor: '#fff',
              marginHorizontal: 20,
              marginBottom: 12,
              borderRadius: 8,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 4,
              elevation: 3,
              overflow: 'hidden',
            }}
          >
            <TouchableOpacity
              onPress={() => toggleExpand(report.id)}
              style={{
                padding: 16,
                backgroundColor: '#1F2937',
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                {report.title}
              </Text>
              <Text style={{ color: '#D1D5DB', marginTop: 4 }}>
                Views: {report.viewCount}
              </Text>
            </TouchableOpacity>

            {isExpanded && (
              <View style={{ padding: 16, backgroundColor: '#F9FAFB' }}>
                <Text>Date of Report: {report.dateReport}</Text>
                <Text>Patroller: {report.patrollerName}</Text>
                <Text>Location: {report.location}</Text>
                <Text>Date of Incident: {report.date}</Text>
                <Text>Time of Incident: {report.time}</Text>
                <Text>Reference #: {report.policeNumber}</Text>
                <Text>Description: {report.description}</Text>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

export default IncidentScreen;
