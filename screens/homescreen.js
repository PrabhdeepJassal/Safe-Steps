import React from 'react';
import { View, Text, TextInput, ScrollView, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const HomeScreen = () => {
  return (
    <ScrollView style={styles.container}>
      {/* Black Banner Section */}
      <View style={styles.banner}>
        <Text style={styles.headerTitle}>Enhance safety and{'\n'}travel security</Text>
      </View>

      {/* Search Bar */}
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

      {/* Safe Routes Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safe route recommended</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={styles.placeCard}>
            <Image
              source={{ uri: 'https://via.placeholder.com/250x150' }}
              style={styles.placeImage}
            />
            <View style={styles.cardContent}>
              <Text style={styles.placeName}>Safe Haven Cafe</Text>
              <Text style={styles.placeDistance}>100 meters away</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.placeCard}>
            <Image
              source={{ uri: 'https://via.placeholder.com/250x150' }}
              style={styles.placeImage}
            />
            <View style={styles.cardContent}>
              <Text style={styles.placeName}>Guardian Grill</Text>
              <Text style={styles.placeDistance}>150 meters away</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Safety Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={styles.safetyCard}>
            <Ionicons name="location" size={24} color="black" />
            <Text style={styles.safetyText}>Night</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.safetyCard}>
            <Ionicons name="warning" size={24} color="black" />
            <Text style={styles.safetyText}>Crime</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.safetyCard}>
            <Ionicons name="person-circle" size={24} color="black" />
            <Text style={styles.safetyText}>Live</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.safetyCard}>
            <Ionicons name="call" size={24} color="black" />
            <Text style={styles.safetyText}>Emergency</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  banner: {
    backgroundColor: '#000',  // Black banner
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 8,
    padding: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
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
  safetyCard: {
    width: 80,
    height: 80,
    backgroundColor: '#ddd',
    borderRadius: 12,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safetyText: {
    marginTop: 5,
    fontSize: 12,
  },
});

export default HomeScreen;
