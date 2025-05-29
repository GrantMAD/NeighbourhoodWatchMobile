import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    TextInput,
    Modal,
    StyleSheet,
    Button,
    Dimensions,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const staticAlbums = [
    {
        id: "1",
        name: "Vacation",
        userId: "user1",
        images: [
            { id: "img1", imageUrl: require("../../assets/images/Image1.jpg") },
            { id: "img2", imageUrl: require("../../assets/images/Image2.jpg") },
            { id: "img3", imageUrl: require("../../assets/images/Image3.jpg") },
        ],
    },
    {
        id: "2",
        name: "Family",
        userId: "user2",
        images: [
            { id: "img4", imageUrl: require("../../assets/images/Image4.jpg") },
            { id: "img5", imageUrl: require("../../assets/images/Image5.jpg") },
        ],
    },
];

const pageSize = 12;
const screenWidth = Dimensions.get("window").width;

const GalleryScreen = () => {
    const [albums, setAlbums] = useState([]);
    const [selectedAlbum, setSelectedAlbum] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isEditing, setIsEditing] = useState(false);
    const [editedAlbumName, setEditedAlbumName] = useState("");
    const [editedImageTitles, setEditedImageTitles] = useState({});
    const [isImageFullscreen, setIsImageFullscreen] = useState(false);
    const [fullscreenImageIndex, setFullscreenImageIndex] = useState(null);

    const flatListRef = useRef(null);

    useEffect(() => {
        setAlbums(staticAlbums);
    }, []);

    useEffect(() => {
        if (selectedAlbum) {
            setEditedAlbumName(selectedAlbum.name);
            const titles = {};
            selectedAlbum.images.forEach((img) => {
                titles[img.id] = img.title || "";
            });
            setEditedImageTitles(titles);
            setCurrentPage(1);
        }
    }, [selectedAlbum]);

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const totalImages = selectedAlbum ? selectedAlbum.images.length : 0;
    const currentImages = selectedAlbum
        ? selectedAlbum.images.slice(startIndex, endIndex)
        : [];

    const handleAlbumPress = (album) => {
        setSelectedAlbum(album);
        setIsEditing(false);
    };

    const handleBackToAlbums = () => {
        setSelectedAlbum(null);
        setIsEditing(false);
    };

    const handleImagePress = (image) => {
        if (!selectedAlbum) return;
        const index = selectedAlbum.images.findIndex((img) => img.id === image.id);
        setFullscreenImageIndex(index);
        setIsImageFullscreen(true);
    };

    const closeFullscreen = () => {
        setIsImageFullscreen(false);
        setFullscreenImageIndex(null);
    };

    const handleEditToggle = () => setIsEditing(!isEditing);

    const handleSave = () => {
        setSelectedAlbum((prev) => ({
            ...prev,
            name: editedAlbumName,
            images: prev.images.map((img) => ({
                ...img,
                title: editedImageTitles[img.id] || img.title,
            })),
        }));
        setIsEditing(false);
    };

    const renderAlbumItem = ({ item }) => {
        const coverImage = item.images.length > 0 ? item.images[0].imageUrl : null;

        return (
            <TouchableOpacity
                style={styles.albumContainer}
                onPress={() => handleAlbumPress(item)}
            >
                <View style={styles.albumCover}>
                    {coverImage ? (
                        <Image source={coverImage} style={styles.albumImage} />
                    ) : (
                        <FontAwesome name="folder" size={60} color="gray" />
                    )}
                </View>
                <Text style={styles.albumName}>{item.name}</Text>
                <Text style={styles.imageCount}>
                    {item.images.length} {item.images.length === 1 ? "Image" : "Images"}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderImageItem = ({ item }) => (
        <View style={styles.imageContainer}>
            <TouchableOpacity onPress={() => handleImagePress(item)}>
                <Image source={item.imageUrl} style={styles.image} />
            </TouchableOpacity>
            <View style={styles.imageTitleContainer}>
                {isEditing ? (
                    <TextInput
                        style={styles.imageTitleInput}
                        value={editedImageTitles[item.id]}
                        onChangeText={(text) =>
                            setEditedImageTitles((prev) => ({
                                ...prev,
                                [item.id]: text,
                            }))
                        }
                    />
                ) : (
                    <Text style={styles.imageTitle}>{item.title}</Text>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {selectedAlbum ? (
                    isEditing ? (
                        <TextInput
                            style={styles.albumNameInput}
                            value={editedAlbumName}
                            onChangeText={setEditedAlbumName}
                        />
                    ) : (
                        <Text style={styles.albumTitle}>{selectedAlbum.name}</Text>
                    )
                ) : (
                    <Text style={styles.albumTitle}>Gallery</Text>
                )}
            </View>

            {selectedAlbum ? (
                <View style={styles.controls}>
                    <Button title="Back to Albums" onPress={handleBackToAlbums} />
                </View>
            ) : (
                <Text style={styles.welcomeText}>
                    Welcome to the Gallery page. Click on an album to view images.
                </Text>
            )}

            <FlatList
                data={selectedAlbum ? currentImages : albums}
                keyExtractor={(item) => item.id}
                renderItem={selectedAlbum ? renderImageItem : renderAlbumItem}
                numColumns={1}
                key={selectedAlbum ? "images-view" : "album-view"}
                contentContainerStyle={{ paddingBottom: 100 }}
            />

            {selectedAlbum && (
                <View style={styles.pagination}>
                    {currentPage > 1 && (
                        <Button
                            title="Previous"
                            onPress={() => setCurrentPage(currentPage - 1)}
                        />
                    )}
                    {endIndex < totalImages && (
                        <Button
                            title="Next"
                            onPress={() => setCurrentPage(currentPage + 1)}
                        />
                    )}
                </View>
            )}

            {/* Fullscreen Modal with swipe */}
            <Modal visible={isImageFullscreen} transparent={true} animationType="fade">
                <View style={styles.modalBackground}>
                    <TouchableOpacity style={styles.closeButton} onPress={closeFullscreen}>
                        <Text style={styles.closeText}>✕</Text>
                    </TouchableOpacity>

                    {selectedAlbum && fullscreenImageIndex !== null && (
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                            <FlatList
                                ref={flatListRef}
                                data={selectedAlbum.images}
                                horizontal
                                pagingEnabled
                                initialScrollIndex={fullscreenImageIndex}
                                getItemLayout={(data, index) => ({
                                    length: screenWidth,
                                    offset: screenWidth * index,
                                    index,
                                })}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <View style={{ width: screenWidth, justifyContent: "center", alignItems: "center", flex: 1 }}>
                                        <Image
                                            source={item.imageUrl}
                                            style={styles.fullscreenImage}
                                            resizeMode="contain"
                                        />
                                    </View>
                                )}
                                onMomentumScrollEnd={(event) => {
                                    const newIndex = Math.round(
                                        event.nativeEvent.contentOffset.x /
                                        event.nativeEvent.layoutMeasurement.width
                                    );
                                    setFullscreenImageIndex(newIndex);
                                }}
                            />

                            <Text style={styles.imageCounterText}>
                                Image {fullscreenImageIndex + 1} of {selectedAlbum.images.length}
                            </Text>
                        </View>
                    )}
                </View>
            </Modal>

        </View>
    );
};

export default GalleryScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#eee",
        paddingTop: 40,
        paddingHorizontal: 10,
    },
    header: { marginBottom: 10, alignItems: "center" },
    albumTitle: { fontSize: 28, fontWeight: "bold", color: "#333" },
    albumNameInput: {
        fontSize: 28,
        fontWeight: "bold",
        borderBottomWidth: 2,
        borderColor: "#007bff",
        width: "80%",
        textAlign: "center",
    },
    welcomeText: {
        fontSize: 16,
        color: "#666",
        marginVertical: 10,
        textAlign: "center",
    },
    albumContainer: {
        marginBottom: 15,
        padding: 10,
        borderRadius: 10,
        overflow: "hidden",
        width: "100%",
        alignItems: "center",
    },
    albumCover: {
        width: "100%",
        height: 150,
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: "#ccc",
    },
    albumImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",  
    },
    albumName: { fontSize: 20, fontWeight: "600", marginTop: 8, color: "#222" },
    imageCount: { fontSize: 14, color: "#666" },
    imageContainer: {
        flex: 1,
        marginVertical: 10,
        borderRadius: 10,
        overflow: "hidden",
    },
    imageCounterText: {
        color: "#fff",
        fontSize: 16,
        marginTop: 10,
        fontWeight: "600",
    },
    image: {
        width: "100%",
        height: 200,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
    imageTitleContainer: {
        padding: 8,
    },
    imageTitle: { fontSize: 16, fontWeight: "600", color: "#333" },
    imageTitleInput: {
        borderWidth: 1,
        borderColor: "#007bff",
        borderRadius: 5,
        padding: 5,
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    controls: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 10,
    },
    pagination: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: 10,
    },
    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.85)",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 20,
    },
    fullscreenImage: {
        width: screenWidth,
        height: "80%",
    },
    closeButton: {
        position: "absolute",
        top: 50,
        right: 20,
        zIndex: 10,
        backgroundColor: "rgba(0,0,0,0.5)",
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    closeText: {
        color: "white",
        fontSize: 28,
        fontWeight: "bold",
    },
});
