import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Polyline, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function NavigationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { route: selectedRoute, destination, userLocation: initialUserLocation } = route.params;
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(initialUserLocation);

  const DELHI_REGION = {
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  };

  const createAnimatedValue = (initialValue) => {
    try {
      return new Animated.Value(initialValue);
    } catch (e) {
      console.error('Failed to create Animated.Value:', e);
      return { setValue: () => {}, interpolate: () => '0' };
    }
  };

  const infoOpacity = useRef(createAnimatedValue(1)).current;

  useEffect(() => {
    // Fit map to show route
    const fitMapToRoute = () => {
      if (!selectedRoute.coordinates || selectedRoute.coordinates.length === 0 || !mapRef.current) return;
      const coordinates = selectedRoute.coordinates;
      const allCoordinates = [...coordinates];
      if (userLocation) allCoordinates.unshift(userLocation);
      if (destination && destination.coordinates) {
        const destCoord = {
          latitude: destination.coordinates.lat || destination.coordinates.latitude,
          longitude: destination.coordinates.lng || destination.coordinates.longitude,
        };
        allCoordinates.push(destCoord);
      }
      mapRef.current.fitToCoordinates(allCoordinates, {
        edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
        animated: true,
      });
    };

    fitMapToRoute();

    // Start location updates
    const locationSubscription = Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
      (location) => {
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    );

    // Fade in navigation info
    Animated.timing(infoOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    return () => {
      locationSubscription.then(sub => sub.remove());
    };
  }, [selectedRoute, destination, userLocation]);

  const stopNavigation = () => {
    Animated.timing(infoOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      navigation.goBack();
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={DELHI_REGION}
        showsUserLocation
        showsMyLocationButton
      >
        {selectedRoute.coordinates && selectedRoute.coordinates.length > 0 && (
          <Polyline
            coordinates={selectedRoute.coordinates}
            strokeColor={selectedRoute.color}
            strokeWidth={4}
          />
        )}
        {destination && destination.coordinates && (
          <Marker
            coordinate={{
              latitude: destination.coordinates.lat || destination.coordinates.latitude,
              longitude: destination.coordinates.lng || destination.coordinates.longitude,
            }}
            title={destination.name}
            description={destination.address}
          />
        )}
      </MapView>
      <View style={styles.overlayContainer}>
        <Animated.View style={[styles.navInfoContainer, { opacity: infoOpacity }]}>
          <View style={styles.navHeader}>
            <Text style={styles.navTitle}>Navigating to {destination?.name}</Text>
            <TouchableOpacity style={styles.stopButton} onPress={stopNavigation}>
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.stopButtonText}>Stop</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.navDetails}>
            <View style={[styles.routeIndicator, { backgroundColor: selectedRoute.color }]} />
            <View style={styles.routeInfo}>
              <Text style={styles.routeTitle}>{selectedRoute.title}</Text>
              <Text style={styles.routeDetails}>{selectedRoute.time} • {selectedRoute.distance}</Text>
              <View style={styles.safetyScoreContainer}>
                <Text style={styles.safetyScoreText}>Safety Score: {selectedRoute.safetyScore}/5</Text>
                <View style={styles.safetyStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= selectedRoute.safetyScore ? "star" : "star-outline"}
                      size={14}
                      color={star <= selectedRoute.safetyScore ? "#FFD700" : "#ddd"}
                    />
                  ))}
                </View>
              </View>
              <View style={styles.routeExtraInfo}>
                <Text style={styles.routeEta}>ETA: {selectedRoute.eta}</Text>
                <View style={styles.routeTags}>
                  <View style={styles.routeTag}>
                    <Ionicons name="car-outline" size={12} color="#444" />
                    <Text style={styles.routeTagText}>{selectedRoute.traffic || 'Low Traffic'}</Text>
                  </View>
                  <View style={styles.routeTag}>
                    <Ionicons name="pricetag-outline" size={12} color="#444" />
                    <Text style={styles.routeTagText}>₹{selectedRoute.toll || '50'} Toll</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  map: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, position: 'absolute', top: 0, left: 0 },
  overlayContainer: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  navInfoContainer: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#fff', borderRadius: 12, elevation: 6, padding: 15 },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  navTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  stopButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ff6b6b', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  stopButtonText: { color: '#fff', fontSize: 14, fontWeight: '500', marginLeft: 5 },
  navDetails: { flexDirection: 'row', alignItems: 'center' },
  routeIndicator: { width: 8, height: 40, borderRadius: 4, marginRight: 15 },
  routeInfo: { flex: 1 },
  routeTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  routeDetails: { fontSize: 14, color: '#666' },
  safetyScoreContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  safetyScoreText: { fontSize: 13, color: '#666', marginRight: 8 },
  safetyStars: { flexDirection: 'row' },
  routeExtraInfo: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  routeEta: { fontSize: 14, color: '#444', fontWeight: '500', marginBottom: 5 },
  routeTags: { flexDirection: 'row', flexWrap: 'wrap' },
  routeTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8, marginTop: 5 },
  routeTagText: { fontSize: 12, color: '#444', marginLeft: 4 },
});