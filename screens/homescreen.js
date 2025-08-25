import React, { useState, useEffect } from 'react';
// --- MODIFIED: Added Dimensions ---
import { View, Text, TextInput, ScrollView, Image, StyleSheet, TouchableOpacity, StatusBar, Platform, RefreshControl, Linking, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// --- Videos to be displayed in the tutorials section ---
const tutorialVideos = [
  {
    title: 'How to Do CPR',
    channel: 'St John Ambulance',
    videoId: 'n5QJ6x_Gz_Y',
  },
  {
    title: 'The Heimlich Maneuver',
    channel: 'Heimlich Heroes',
    videoId: '7CgtIgSy3cI',
  },
  {
    title: 'How to Use a Fire Extinguisher',
    channel: 'National Fire Protection Association',
    videoId: 'lUojO12S_rA',
  },
];

// Skeleton Placeholder Component
const SkeletonPlaceholder = ({ style }) => (
  <View style={[styles.skeletonBase, style]}>
    <LinearGradient
      colors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.skeletonGradient}
    />
  </View>
);

// Array of headlines that change daily
const headlines = [
  "Enhance safety and travel security",
  "Stay Safe, Travel Smart",
  "Navigate with Confidence",
  "Your Safety, Our Priority",
  "Secure Journeys, Worry-Free Travel",
  "Explore with Peace of Mind",
  "Smart Routes, Safer Travels",
  "Travel Fearlessly, Arrive Safely",
  "Where Safety Meets Convenience",
  "Protecting Every Step You Take",
  "Plan Ahead, Travel Safely",
  "Be Aware, Stay Secure",
  "Your Guardian on the Go",
  "Navigate the World with Confidence"
];

const HomeScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date().getDate();
  const headline = headlines[today % headlines.length];

  // Set StatusBar on initial mount
  useEffect(() => {
    StatusBar.setBackgroundColor('transparent');
    StatusBar.setTranslucent(true);
    StatusBar.setBarStyle('light-content');
  }, []);

  // Handle StatusBar when screen gains/loses focus
  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
      StatusBar.setBarStyle('light-content');

      return () => {
        StatusBar.setBackgroundColor('#ffffff');
        StatusBar.setTranslucent(false);
        StatusBar.setBarStyle('dark-content');
      };
    }, [])
  );

  // Simulate API loading
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 2000);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setRefreshing(false);
    }, 2000);
  };

  // Function to open YouTube links
  const openVideo = (videoId) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.log(`Don't know how to open URI: ${url}`);
      }
    });
  };

  return (
    <View style={styles.fullScreenContainer}>
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={['#000']}
          />
        }
      >
        <View style={styles.bannerContainer}>
          <View style={styles.banner}>
            {isLoading ? (
              <SkeletonPlaceholder style={styles.headerSkeleton} />
            ) : (
              <Text style={styles.headerTitle}>{headline}</Text>
            )}
          </View>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter your destination"
              placeholderTextColor="#666"
            />
            <TouchableOpacity>
              <Ionicons name="arrow-forward" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, styles.firstSection]}>
          <Text style={styles.sectionTitle}>YouTube Tutorials</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {isLoading ? (
              <>
                <SkeletonPlaceholder style={styles.tutorialCard} />
                <SkeletonPlaceholder style={styles.tutorialCard} />
                <SkeletonPlaceholder style={styles.tutorialCard} />
              </>
            ) : (
              tutorialVideos.map((video, index) => (
                <TouchableOpacity key={index} style={styles.tutorialCard} onPress={() => openVideo(video.videoId)}>
                  <Image 
                    source={{ uri: `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg` }} 
                    style={styles.tutorialImage} 
                  />
                  <View style={styles.cardContent}>
                    <Text style={styles.tutorialName}>{video.title}</Text>
                    <Text style={styles.tutorialChannel}>{video.channel}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        {/* --- MODIFIED: Navigation Buttons Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => navigation.navigate('authorityno')}
            >
              <Ionicons name="man-outline" size={styles.actionIcon.size} color="#fff" />
              <Text style={styles.actionText}>Authorities</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => navigation.navigate('SOSactive')}
            >
              <Ionicons name="alert-outline" size={styles.actionIcon.size} color="#fff" />
              <Text style={styles.actionText}>SOS</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => navigation.navigate('emergencyrecord')}
            >
              <Ionicons name="camera-outline" size={styles.actionIcon.size} color="#fff" />
              <Text style={styles.actionText}>Emergency      Record</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// --- NEW: Calculate dynamic dimensions ---
const { width } = Dimensions.get('window');
const sectionPadding = 20 * 2;
const gapBetweenButtons = 15;
const numberOfButtons = 3;
const totalGaps = gapBetweenButtons * (numberOfButtons - 1);

const buttonSize = (width - sectionPadding - totalGaps) / numberOfButtons;

// --- MODIFIED: Updated Styles ---
const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 0,
  },
  bannerContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  banner: {
    backgroundColor: '#000',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 50 : 60,
    paddingBottom: 60,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    position: 'absolute',
    bottom: -25,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 5,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 17.5,
    paddingVertical: 10,
    color: '#333',
  },
  firstSection: {
    marginTop: 20,
  },
  section: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  tutorialCard: {
    width: 250,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginRight: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tutorialImage: {
    width: '100%',
    height: 125,
    backgroundColor: '#e0e0e0',
  },
  cardContent: {
    padding: 12,
  },
  tutorialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  tutorialChannel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  skeletonBase: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  skeletonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerSkeleton: {
    width: '80%',
    height: 35,
    borderRadius: 6,
  },
  // --- MODIFIED: Styles for Quick Actions ---
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Changed from space-around
    marginTop: 10,
    marginBottom: 100,
  },
  actionButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically
    elevation: 3,
    // --- DYNAMIC SIZE ---
    width: buttonSize,
    height: buttonSize, // Making it a square
  },
  actionIcon: {
    // --- DYNAMIC SIZE ---
    size: buttonSize / 3, // Icon size proportional to button size
  },
  actionText: {
    color: '#fff',
    marginTop: 5,
    fontWeight: 'bold',
    textAlign: 'center', // Ensure text is centered
    // --- DYNAMIC FONT SIZE ---
    fontSize: buttonSize / 8.5, // Font size proportional to button size
  },
});

export default HomeScreen;