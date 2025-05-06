import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

const NavigationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { route: selectedRoute } = route.params;

  const DELHI_REGION = {
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  };

  const handleEndNavigation = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={DELHI_REGION}
        showsUserLocation
        showsMyLocationButton
      />
      <View style={styles.overlayContainer}>
        {/* Route Info Header */}
        <View style={styles.routeInfoContainer}>
          <View style={styles.routeHeader}>
            <View style={[styles.routeIndicator, { backgroundColor: selectedRoute.color }]} />
            <View style={styles.routeDetails}>
              <Text style={styles.routeTitle}>{selectedRoute.title}</Text>
              <Text style={styles.routeSubtitle}>
                {selectedRoute.time} • {selectedRoute.distance} • ETA: {selectedRoute.eta}
              </Text>
            </View>
            <TouchableOpacity onPress={handleEndNavigation}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.routeTags}>
            <View style={styles.routeTag}>
              <Ionicons name="car-outline" size={12} color="#444" />
              <Text style={styles.routeTagText}>Low Traffic</Text>
            </View>
            <View style={styles.routeTag}>
              <Ionicons name="pricetag-outline" size={12} color="#444" />
              <Text style={styles.routeTagText}>₹50 Toll</Text>
            </View>
          </View>
        </View>

        {/* Navigation Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="volume-high" size={24} color="#fff" />
            <Text style={styles.controlButtonText}>Voice On</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="map" size={24} color="#fff" />
            <Text style={styles.controlButtonText}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="share-social" size={24} color="#fff" />
            <Text style={styles.controlButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* End Navigation Button */}
        <TouchableOpacity style={styles.endButton} onPress={handleEndNavigation}>
          <Text style={styles.endButtonText}>End Navigation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  map: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    justifyContent: 'space-between',
  },
  routeInfoContainer: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 50,
    borderRadius: 12,
    padding: 15,
    elevation: 5,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  routeIndicator: {
    width: 8,
    height: 40,
    borderRadius: 4,
    marginRight: 15,
  },
  routeDetails: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  routeSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  routeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  routeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginTop: 5,
  },
  routeTagText: {
    fontSize: 12,
    color: '#444',
    marginLeft: 4,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 100,
  },
  controlButton: {
    backgroundColor: '#4285F4',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,
  },
  endButton: {
    backgroundColor: '#ff0000',
    borderRadius: 12,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 3,
  },
  endButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NavigationScreen;