import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, ScrollView, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useGroup } from '../context/GroupContext';

const GroupSetupScreen = ({ navigation }) => {
    const { setGroupData } = useGroup();

    // Existing fields
    const [welcomeText, setWelcomeText] = useState('');
    const [mainImage, setMainImage] = useState(null);

    // New About Screen fields
    const [vision, setVision] = useState('');
    const [mission, setMission] = useState('');
    const [values, setValues] = useState('');
    const [objectives, setObjectives] = useState('');
    const [executivesTitle, setExecutivesTitle] = useState('');

    // Executives list state
    const [executives, setExecutives] = useState([]);

    // Temporary exec inputs
    const [execName, setExecName] = useState('');
    const [execRole, setExecRole] = useState('');
    const [execImage, setExecImage] = useState(null);

    // Contact email
    const [contactEmail, setContactEmail] = useState('');

    // Pick image helper (for main image and exec images)
    const pickImage = async (setImage) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    // Add new executive to list
    const addExecutive = () => {
        if (!execName.trim() || !execRole.trim()) {
            alert('Please enter both executive name and role.');
            return;
        }

        setExecutives([
            ...executives,
            {
                name: execName.trim(),
                role: execRole.trim(),
                image: execImage,
            },
        ]);

        // Clear exec inputs
        setExecName('');
        setExecRole('');
        setExecImage(null);
    };

    // Submit handler to save all data
    const handleSubmit = () => {
        setGroupData({
            welcomeText,
            mainImage,
            vision,
            mission,
            values,
            objectives,
            executivesTitle,
            executives,
            contactEmail, // <-- Save to context
        });

        navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Welcome Message */}
            <Text style={styles.label}>Welcome Message</Text>
            <TextInput
                placeholder="Enter welcome text"
                value={welcomeText}
                onChangeText={setWelcomeText}
                style={styles.input}
                multiline
            />

            {/* Main Image */}
            <Button title="Select Main Image" onPress={() => pickImage(setMainImage)} />
            {mainImage && <Image source={{ uri: mainImage }} style={styles.image} />}

            {/* About Screen Fields */}
            <Text style={styles.sectionTitle}>About Screen Content</Text>

            <Text style={styles.label}>Our Vision</Text>
            <TextInput
                placeholder="Enter group's vision"
                value={vision}
                onChangeText={setVision}
                style={styles.input}
                multiline
            />

            <Text style={styles.label}>Our Mission</Text>
            <TextInput
                placeholder="Enter group's mission"
                value={mission}
                onChangeText={setMission}
                style={styles.input}
                multiline
            />

            <Text style={styles.label}>Our Values</Text>
            <TextInput
                placeholder="Enter group's values"
                value={values}
                onChangeText={setValues}
                style={styles.input}
                multiline
            />

            <Text style={styles.label}>Objectives</Text>
            <TextInput
                placeholder="Enter group's objectives"
                value={objectives}
                onChangeText={setObjectives}
                style={styles.input}
                multiline
            />

            <Text style={styles.label}>Executives Section Title</Text>
            <TextInput
                placeholder="Executives section title"
                value={executivesTitle}
                onChangeText={setExecutivesTitle}
                style={styles.input}
            />

            {/* Add Executives */}
            <Text style={[styles.label, { marginTop: 20 }]}>Add Executive</Text>
            <TextInput
                placeholder="Name"
                value={execName}
                onChangeText={setExecName}
                style={styles.input}
            />
            <TextInput
                placeholder="Role"
                value={execRole}
                onChangeText={setExecRole}
                style={styles.input}
            />

            <Button title="Select Executive Image" onPress={() => pickImage(setExecImage)} />
            {execImage && <Image source={{ uri: execImage }} style={styles.execImage} />}

            <Button title="Add Executive" onPress={addExecutive} />

            {/* Display added executives */}
            {executives.length > 0 && (
                <View style={{ marginTop: 20 }}>
                    <Text style={styles.label}>Executives Added:</Text>
                    {executives.map((exec, idx) => (
                        <View key={idx} style={styles.execCard}>
                            {exec.image && <Image source={{ uri: exec.image }} style={styles.execImageSmall} />}
                            <View style={{ marginLeft: 10 }}>
                                <Text style={styles.execName}>{exec.name}</Text>
                                <Text style={styles.execRole}>{exec.role}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            <Text style={styles.label}>Contact Email</Text>
            <TextInput
                placeholder="Enter contact email"
                value={contactEmail}
                onChangeText={setContactEmail}
                style={styles.input}
            />

            <View style={{ marginVertical: 30 }}>
                <Button title="Save & Continue" onPress={handleSubmit} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 50,
    },
    label: {
        fontSize: 16,
        marginBottom: 6,
        fontWeight: '600',
        color: '#333',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginTop: 30,
        marginBottom: 12,
        color: '#111',
        textDecorationLine: 'underline',
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#999',
        borderRadius: 6,
        padding: 10,
        marginBottom: 16,
        minHeight: 40,
        textAlignVertical: 'top',
        backgroundColor: '#fff',
    },
    image: {
        width: '100%',
        height: 200,
        marginVertical: 12,
        borderRadius: 12,
    },
    execImage: {
        width: 100,
        height: 100,
        marginVertical: 10,
        borderRadius: 50,
    },
    execCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
        backgroundColor: '#e7e7e7',
        padding: 10,
        borderRadius: 10,
    },
    execImageSmall: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    execName: {
        fontWeight: '700',
        fontSize: 16,
        color: '#222',
    },
    execRole: {
        color: '#555',
        fontSize: 14,
    },
});

export default GroupSetupScreen;