import React, { useState } from 'react';
import {
    View, Text, TextInput, Button, ScrollView, Image, Alert, StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';

const CreateGroupScreen = ({ navigation }) => {
    const [groupName, setGroupName] = useState('');
    const [welcomeText, setWelcomeText] = useState('');
    const [vision, setVision] = useState('');
    const [mission, setMission] = useState('');
    const [values, setValues] = useState('');
    const [objectives, setObjectives] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [mainImage, setMainImage] = useState(null);
    const [executivesTitle, setExecutivesTitle] = useState('');
    const [execName, setExecName] = useState('');
    const [execRole, setExecRole] = useState('');
    const [execImage, setExecImage] = useState(null);
    const [executives, setExecutives] = useState([]);
    const [loading, setLoading] = useState(false);

    const pickImage = async (setter) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });
        if (!result.canceled) {
            setter(result.assets[0].uri);
        }
    };

    const addExecutive = () => {
        if (!execName || !execRole) {
            Alert.alert('Error', 'Please enter name and role');
            return;
        }
        setExecutives([...executives, { name: execName, role: execRole, image: execImage }]);
        setExecName('');
        setExecRole('');
        setExecImage(null);
    };

    const handleCreateGroup = async () => {
        console.log('Create group button pressed');
        Alert.alert('Debug', 'Creating group...');

        if (!groupName) {
            Alert.alert('Error', 'Please enter a group name.');
            return;
        }

        setLoading(true);

        try {
            // Get current user
            const { data: userData, error: userError } = await supabase.auth.getUser();

            if (userError || !userData?.user) {
                console.error('User fetch failed:', userError);
                Alert.alert('Error', 'User not logged in or failed to fetch user.');
                setLoading(false);
                return;
            }

            const user = userData.user;
            console.log('Current user ID:', user.id);

            const groupPayload = {
                name: groupName,
                objectives,
                values,
                mission,
                vision,
                welcome_text: welcomeText,
                main_image: mainImage,
                executives_title: executivesTitle,
                executives: JSON.stringify(executives),
                contact_email: contactEmail,
                created_by: user.id,
            };

            console.log('Inserting group with data:', JSON.stringify(groupPayload));

            const { data: insertData, error: insertError } = await supabase
                .from('groups')
                .insert([groupPayload])
                .select();

            if (insertError) {
                console.error('Insert error:', insertError);
                Alert.alert('Error', insertError.message);
                setLoading(false);
                return;
            }

            const newGroup = insertData?.[0];
            if (!newGroup) {
                console.error('Insert returned no group');
                Alert.alert('Error', 'Failed to create group.');
                setLoading(false);
                return;
            }

            console.log('New group created:', newGroup);

            // Update user profile with new group_id
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    group_id: newGroup.id,
                    is_group_creator: true,
                })
                .eq('id', user.id);


            if (profileError) {
                console.error('Profile update error:', profileError);
                Alert.alert('Error updating profile:', profileError.message);
                setLoading(false);
                return;
            }

            console.log('User profile updated with group_id:', newGroup.id);

            // Confirm profile updated
            const { data: updatedProfile, error: fetchProfileError } = await supabase
                .from('profiles')
                .select('group_id')
                .eq('id', user.id)
                .single();

            if (fetchProfileError) {
                console.warn('Could not confirm profile update:', fetchProfileError);
            } else {
                console.log('Confirmed updated group_id in profile:', updatedProfile.group_id);
            }

            // Navigate to the new group instance
            navigation.reset({
                index: 0,
                routes: [{ name: 'MainApp', params: { groupId: newGroup.id } }],
            });
        } catch (error) {
            console.error('Error creating group:', error);
            Alert.alert('Error', 'Something went wrong creating your group.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.label}>Group Name</Text>
            <TextInput value={groupName} onChangeText={setGroupName} style={styles.input} />

            <Text style={styles.label}>Welcome Text</Text>
            <TextInput value={welcomeText} onChangeText={setWelcomeText} style={styles.input} multiline />

            <Button title="Select Main Image" onPress={() => pickImage(setMainImage)} />
            {mainImage && <Image source={{ uri: mainImage }} style={styles.image} />}

            <Text style={styles.label}>Vision</Text>
            <TextInput value={vision} onChangeText={setVision} style={styles.input} multiline />

            <Text style={styles.label}>Mission</Text>
            <TextInput value={mission} onChangeText={setMission} style={styles.input} multiline />

            <Text style={styles.label}>Values</Text>
            <TextInput value={values} onChangeText={setValues} style={styles.input} multiline />

            <Text style={styles.label}>Objectives</Text>
            <TextInput value={objectives} onChangeText={setObjectives} style={styles.input} multiline />

            <Text style={styles.label}>Contact Email</Text>
            <TextInput value={contactEmail} onChangeText={setContactEmail} style={styles.input} />

            <Text style={styles.label}>Executives Section Title</Text>
            <TextInput value={executivesTitle} onChangeText={setExecutivesTitle} style={styles.input} />

            <Text style={styles.label}>Executive Name</Text>
            <TextInput value={execName} onChangeText={setExecName} style={styles.input} />
            <Text style={styles.label}>Executive Role</Text>
            <TextInput value={execRole} onChangeText={setExecRole} style={styles.input} />
            <Button title="Select Executive Image" onPress={() => pickImage(setExecImage)} />
            {execImage && <Image source={{ uri: execImage }} style={styles.execImage} />}
            <Button title="Add Executive" onPress={addExecutive} />

            {executives.length > 0 && (
                <View style={{ marginTop: 20 }}>
                    <Text style={{ fontWeight: 'bold' }}>Current Executives:</Text>
                    {executives.map((exec, index) => (
                        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
                            {exec.image && <Image source={{ uri: exec.image }} style={styles.execImage} />}
                            <View>
                                <Text>{exec.name}</Text>
                                <Text>{exec.role}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            <Button title="Create Group" onPress={handleCreateGroup} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 40,  // <-- Add this padding to push content up from bottom
    },
    label: { fontWeight: '600', marginTop: 10 },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 10, backgroundColor: '#fff' },
    image: { width: '100%', height: 200, marginVertical: 10 },
    execImage: { width: 60, height: 60, borderRadius: 30, marginRight: 10 },
});


export default CreateGroupScreen;
