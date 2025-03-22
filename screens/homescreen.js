import React from 'react';
import { View, Text, TextInput, ScrollView, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const HomeScreen = () => {
  return (
    <ScrollView style={styles.container}>
      {/* Banner Section (Unchanged) */}
      <View style={styles.bannerContainer}>
        <View style={styles.banner}>
          <Text style={styles.headerTitle}>Enhance safety and{''} travel security</Text>
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

      {/* Safe Routes Section */}
      <View style={[styles.section, styles.firstSection]}>
        <Text style={styles.sectionTitle}>Safe Routes Nearby</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={styles.placeCard}>
            <Image
              source={{ uri: 'https://via.placeholder.com/250x150' }}
              style={styles.placeImage}
            />
            <View style={styles.cardContent}>
              <Text style={styles.placeName}>Street Side Cafe</Text>
              <Text style={styles.placeDistance}>200m away</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.placeCard}>
            <Image
              source={{ uri: 'https://via.placeholder.com/250x150' }}
              style={styles.placeImage}
            />
            <View style={styles.cardContent}>
              <Text style={styles.placeName}>Children’s Park</Text>
              <Text style={styles.placeDistance}>125m away</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Safety Check Section */}
      <View style={styles.safetyCheckContainer}>
        <Ionicons name="time-outline" size={24} color="black" style={styles.safetyIcon} />
        <View style={styles.safetyTextContainer}>
          <Text style={styles.safetyTitle}>Safety Check</Text>
          <Text style={styles.safetySubtitle}>Set a check-in timer for your phone to confirm that you’re safe</Text>
        </View>
        <TouchableOpacity style={styles.safetyButton}>
          <Text style={styles.safetyButtonText}>Start a safety check</Text>
        </TouchableOpacity>
      </View>

      {/* Explore Features Section */}
      <View style={styles.exploreContainer}>
        <Ionicons name="grid-outline" size={24} color="black" style={styles.safetyIcon} />
        <View style={styles.safetyTextContainer}>
          <Text style={styles.safetyTitle}>Explore Features</Text>
        </View>
        <TouchableOpacity style={styles.safetyButton}>
          <Text style={styles.safetyButtonText}>Explore</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  bannerContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  banner: {
    backgroundColor: '#000',
    padding: 20,
    paddingTop: 60,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
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
  safetyCheckContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    padding: 15,
    borderRadius: 12,
    margin: 20,
  },
  safetyIcon: {
    marginRight: 10,
  },
  safetyTextContainer: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  safetySubtitle: {
    fontSize: 14,
    color: '#666',
  },
  safetyButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  safetyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  exploreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    padding: 15,
    borderRadius: 12,
    margin: 20,
  },
});

export default HomeScreen;
