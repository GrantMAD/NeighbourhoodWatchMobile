import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    Alert,
    Image,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { Calendar } from 'react-native-calendars';

const AddEventScreen = ({ route, navigation }) => {
    const { groupId } = route.params;

    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [imageUri, setImageUri] = useState('');

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [markedDates, setMarkedDates] = useState({});

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Permission to access media library is required!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const onDayPress = (day) => {
        const dateStr = day.dateString;

        if (!startDate || (startDate && endDate)) {
            setStartDate(dateStr);
            setEndDate(null);
            setMarkedDates({
                [dateStr]: {
                    startingDay: true,
                    endingDay: true,
                    color: '#70d7c7',
                    textColor: 'white'
                }
            });
            return;
        }

        if (startDate && !endDate) {
            if (dateStr < startDate) {
                Alert.alert('Invalid range', 'End date cannot be before start date.');
                return;
            }

            setEndDate(dateStr);
            const range = getMarkedRange(startDate, dateStr);
            setMarkedDates(range);
        }
    };

    const getMarkedRange = (start, end) => {
        let range = {};
        let startDateObj = new Date(start);
        let endDateObj = new Date(end);

        for (
            let d = new Date(startDateObj);
            d <= endDateObj;
            d.setDate(d.getDate() + 1)
        ) {
            const dateStr = d.toISOString().split('T')[0];
            if (dateStr === start) {
                range[dateStr] = {
                    startingDay: true,
                    color: '#70d7c7',
                    textColor: 'white'
                };
            } else if (dateStr === end) {
                range[dateStr] = {
                    endingDay: true,
                    color: '#70d7c7',
                    textColor: 'white'
                };
            } else {
                range[dateStr] = {
                    color: '#9be1d7',
                    textColor: 'white'
                };
            }
        }
        return range;
    };

    const handleAddEvent = async () => {
        if (!title || !message || !startDate || !endDate) {
            Alert.alert('Missing info', 'Please fill in all required fields.');
            return;
        }

        const newEvent = {
            title,
            message,
            image: imageUri,
            startDate,
            endDate,
        };

        try {
            console.log('Fetching group with ID:', groupId);

            const { data: group, error: fetchError, status: fetchStatus } = await supabase
                .from('groups')
                .select('events')
                .eq('id', groupId)
                .single();

            console.log('Fetch group status:', fetchStatus);
            console.log('Fetched group data:', group);

            if (fetchError) {
                console.error('Fetch error:', fetchError);
                Alert.alert('Error fetching group data.');
                return;
            }

            const existingEvents = group?.events || [];
            const updatedEvents = [...existingEvents, newEvent];

            const { data: updateData, error: updateError, status: updateStatus } = await supabase
                .from('groups')
                .update({ events: updatedEvents })
                .eq('id', groupId);

            console.log('Update status:', updateStatus);
            console.log('Update data:', updateData);

            if (updateError) {
                console.error('Update error:', updateError);
                Alert.alert('Error saving event.');
                return;
            }

            Alert.alert('Success', 'Event added!');
            navigation.goBack();
        } catch (err) {
            console.error('Unexpected error:', err);
            Alert.alert('Something went wrong. Please try again.');
        }
    };

    const renderDatePrompt = () => {
        if (!startDate && !endDate) {
            return <Text style={styles.dateRangeText}>📅 Please select a start date</Text>;
        } else if (startDate && !endDate) {
            return <Text style={styles.dateRangeText}>➡️ Now select an end date</Text>;
        } else {
            return (
                <Text style={styles.dateRangeText}>
                    ✅ Selected from {startDate} to {endDate}
                </Text>
            );
        }
    };

    return (
        <ScrollView
            style={styles.container}
            keyboardShouldPersistTaps="handled" 
        >
            <View style={styles.container}>
                <Text style={styles.label}>Title *</Text>
                <TextInput style={styles.input} value={title} onChangeText={setTitle} />

                <Text style={styles.label}>Message *</Text>
                <TextInput
                    style={[styles.input, styles.messageInput]}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />

                <Text style={styles.label}>Image</Text>
                <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    ) : (
                        <Text style={{ color: '#999' }}>Tap to choose an image</Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.label}>Select Date Range *</Text>
                {renderDatePrompt()}

                <Calendar
                    markingType={'period'}
                    markedDates={markedDates}
                    onDayPress={onDayPress}
                    style={{ marginTop: 10, height: 350 }}
                />

                <View style={{ marginBottom: 50, marginTop: 10 }}>
                    <Button title="Add Event" onPress={() => {
                        console.log('🟡 Button pressed');
                        Alert.alert('Pressed');
                        handleAddEvent();
                    }} />
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 16 },
    label: { marginTop: 12, fontWeight: 'bold' },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        padding: 8,
        marginTop: 4,
    },
    messageInput: {
        height: 100,
    },
    imagePicker: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 6,
    },
    dateRangeText: {
        marginTop: 8,
        fontStyle: 'italic',
        color: '#333',
    },
});

export default AddEventScreen;
