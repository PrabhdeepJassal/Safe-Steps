import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Image, StyleSheet, TouchableOpacity, StatusBar, Platform, RefreshControl } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

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

const HomeScreen = ({ navigation }) => { // Add navigation prop for navigation buttons
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
          <Text style={styles.sectionTitle}>Recent Routes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {isLoading ? (
              <>
                <SkeletonPlaceholder style={styles.placeCard} />
                <SkeletonPlaceholder style={styles.placeCard} />
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.placeCard}>
                  <Image source={{ uri: 'https://via.placeholder.com/250x150' }} style={styles.placeImage} />
                  <View style={styles.cardContent}>
                    <Text style={styles.placeName}>Street Side Cafe</Text>
                    <Text style={styles.placeDistance}>200m away</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.placeCard}>
                  <Image source={{ uri: 'https://via.placeholder.com/250x150' }} style={styles.placeImage} />
                  <View style={styles.cardContent}>
                    <Text style={styles.placeName}>Children’s Park</Text>
                    <Text style={styles.placeDistance}>125m away</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>

    

        {/* Navigation Buttons Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => navigation.navigate('authorityno')} // Replace 'Map' with your actual screen name
            >
              <Ionicons name="man-outline" size={30} color="#fff" />
              <Text style={styles.actionText}>Authorities</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => navigation.navigate('SOS')} // Replace 'Settings' with your actual screen name
            >
              <Ionicons name="alert-outline" size={30} color="#fff" />
              <Text style={styles.actionText}>SOS</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => navigation.navigate('Profile')} // Replace 'Profile' with your actual screen name
            >
              <Ionicons name="person-outline" size={30} color="#fff" />
              <Text style={styles.actionText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Updated Styles
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 50 : 20,
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
    borderRadius: 8,
    padding: 10,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 17.5,
    paddingVertical: 8,
    opacity: 0.6,
  },
  firstSection: {
    marginTop: 20,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  placeCard: {
    width: 250,
    backgroundColor: '#ddd',
    borderRadius: 12,
    marginRight: 15,
    overflow: 'hidden',
    height: 180,
  },
  placeImage: {
    width: '100%',
    height: 150,
  },
  cardContent: {
    padding: 10,
  },
  placeName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeDistance: {
    fontSize: 14,
    color: '#666',
  },
  skeletonBase: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  skeletonGradient: {
    flex: 1,
    height: '100%',
    borderRadius: 8,
  },
  headerSkeleton: {
    width: '80%',
    height: 35,
    borderRadius: 6,
  },
  // New Styles for Authority Numbers
  authorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  authorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    elevation: 2,
  },
  authorityText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#000',
  },
  // New Styles for Quick Actions
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: 100,
    elevation: 3,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
    fontWeight: 'bold',
  },
});

export default HomeScreen;