import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, Alert } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
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

  // State management
  const [userLocation, setUserLocation] = useState(initialUserLocation);
  const [currentHeading, setCurrentHeading] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isNavigating, setIsNavigating] = useState(true);
  const [distanceRemaining, setDistanceRemaining] = useState(selectedRoute.distance || '0 km');
  const [timeRemaining, setTimeRemaining] = useState(selectedRoute.time || '0 min');
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [nextTurnDistance, setNextTurnDistance] = useState(null);
  const [nextTurnInstruction, setNextTurnInstruction] = useState('Continue straight');
  const [isLocationPermissionGranted, setIsLocationPermissionGranted] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [followUser, setFollowUser] = useState(true);
  const [traveledCoordinates, setTraveledCoordinates] = useState([]);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);

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

  // Calculate distance between two coordinates (in km)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate bearing between two coordinates
  const calculateBearing = (lat1, lon1, lat2, lon2) => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

  // Find closest point on route
  const findClosestPointOnRoute = (userLat, userLon, routeCoords) => {
    if (!routeCoords || routeCoords.length === 0) return null;
    let minDistance = Infinity;
    let closestIndex = 0;
    routeCoords.forEach((coord, index) => {
      const distance = calculateDistance(userLat, userLon, coord.latitude, coord.longitude);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });
    return { index: closestIndex, distance: minDistance };
  };

  // Get remaining route coordinates
  const getRemainingRouteCoordinates = () => {
    if (!routeCoordinates || routeCoordinates.length === 0) return [];
    return routeCoordinates.slice(currentRouteIndex);
  };

  // Get traveled route coordinates
  const getTraveledRouteCoordinates = () => {
    if (!routeCoordinates || routeCoordinates.length === 0) return [];
    return routeCoordinates.slice(0, currentRouteIndex + 1);
  };

  // Update route based on current location
  const updateRouteProgress = useCallback((currentLocation) => {
    if (!routeCoordinates || routeCoordinates.length === 0) {
      console.log('No route coordinates available');
      return;
    }
    const { latitude, longitude } = currentLocation;
    const closestPoint = findClosestPointOnRoute(latitude, longitude, routeCoordinates);
    if (closestPoint) {
      setCurrentRouteIndex(closestPoint.index);
      setTraveledCoordinates(prev => [...prev, currentLocation].slice(-100));
      let remainingDistance = 0;
      for (let i = closestPoint.index; i < routeCoordinates.length - 1; i++) {
        const coord1 = routeCoordinates[i];
        const coord2 = routeCoordinates[i + 1];
        remainingDistance += calculateDistance(
          coord1.latitude, coord1.longitude,
          coord2.latitude, coord2.longitude
        );
      }
      setDistanceRemaining(`${remainingDistance.toFixed(1)} km`);
      if (closestPoint.index < routeCoordinates.length - 5) {
        const nextCoord = routeCoordinates[closestPoint.index + 5];
        const distanceToNext = calculateDistance(
          latitude, longitude,
          nextCoord.latitude, nextCoord.longitude
        );
        setNextTurnDistance(distanceToNext);
        const currentBearing = calculateBearing(
          latitude, longitude,
          routeCoordinates[closestPoint.index + 1].latitude,
          routeCoordinates[closestPoint.index + 1].longitude
        );
        if (closestPoint.index + 2 < routeCoordinates.length) {
          const nextBearing = calculateBearing(
            routeCoordinates[closestPoint.index + 1].latitude,
            routeCoordinates[closestPoint.index + 1].longitude,
            routeCoordinates[closestPoint.index + 2].latitude,
            routeCoordinates[closestPoint.index + 2].longitude
          );
          const bearingDiff = Math.abs(nextBearing - currentBearing);
          if (bearingDiff > 30 && bearingDiff < 150) {
            setNextTurnInstruction(bearingDiff > 90 ? 'Turn right' : 'Turn left');
          } else {
            setNextTurnInstruction('Continue straight');
          }
        }
      }
    }
  }, [routeCoordinates]);

  // Animate to user location
  const animateToUserLocation = useCallback((location, heading = null) => {
    if (!mapRef.current || !followUser) return;
    const region = {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    mapRef.current.animateToRegion(region, 1000);
    if (heading !== null && mapRef.current.animateCamera) {
      mapRef.current.animateCamera({
        center: { latitude: location.latitude, longitude: location.longitude },
        zoom: 18,
        heading: heading,
        pitch: 45,
      }, 1000);
    }
  }, [followUser]);

  // Request location permissions
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission', 'Location permission is required for navigation. Please enable it in settings.');
        return false;
      }
      setIsLocationPermissionGranted(true);
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert('Error', 'Failed to request location permission');
      return false;
    }
  };

  // Start location tracking
  const startLocationTracking = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 5,
        },
        (location) => {
          const newLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setUserLocation(newLocation);
          setCurrentSpeed(location.coords.speed || 0);
          setCurrentHeading(location.coords.heading || 0);
          updateRouteProgress(newLocation);
          animateToUserLocation(newLocation, location.coords.heading);
        }
      );
      setLocationSubscription(subscription);
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Location Error', 'Failed to start location tracking');
    }
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
  };

  // Generate sample route coordinates if none provided
  const generateSampleRoute = (start, end) => {
    const coordinates = [];
    const steps = 20;
    
    for (let i = 0; i <= steps; i++) {
      const lat = start.latitude + (end.latitude - start.latitude) * (i / steps);
      const lng = start.longitude + (end.longitude - start.longitude) * (i / steps);
      coordinates.push({
        latitude: lat,
        longitude: lng,
      });
    }
    
    return coordinates;
  };

  // Validate and set route coordinates
  useEffect(() => {
    console.log('Selected route:', selectedRoute);
    
    if (selectedRoute.coordinates && Array.isArray(selectedRoute.coordinates) && selectedRoute.coordinates.length > 0) {
      const formattedCoords = selectedRoute.coordinates.map(coord => ({
        latitude: coord.lat || coord.latitude,
        longitude: coord.lng || coord.longitude,
      })).filter(coord => coord.latitude != null && coord.longitude != null);
      
      if (formattedCoords.length > 0) {
        setRouteCoordinates(formattedCoords);
        // console.log('Formatted Route Coordinates:', formattedCoords);
      } else {
        console.warn('No valid coordinates after formatting');
        // Generate sample route if no valid coordinates
        if (userLocation && destination && destination.coordinates) {
          const destCoord = {
            latitude: destination.coordinates.lat || destination.coordinates.latitude,
            longitude: destination.coordinates.lng || destination.coordinates.longitude,
          };
          const sampleRoute = generateSampleRoute(userLocation, destCoord);
          setRouteCoordinates(sampleRoute);
          // console.log('Generated sample route:', sampleRoute);
        }
      }
    } else {
      console.warn('Invalid or empty route coordinates, generating sample route');
      // Generate sample route if no coordinates provided
      if (userLocation && destination && destination.coordinates) {
        const destCoord = {
          latitude: destination.coordinates.lat || destination.coordinates.latitude,
          longitude: destination.coordinates.lng || destination.coordinates.longitude,
        };
        const sampleRoute = generateSampleRoute(userLocation, destCoord);
        setRouteCoordinates(sampleRoute);
        // console.log('Generated sample route:', sampleRoute);
      } else {
        // Default Delhi route for testing
        const defaultRoute = [
          { latitude: 28.6139, longitude: 77.2090 },
          { latitude: 28.6149, longitude: 77.2100 },
          { latitude: 28.6159, longitude: 77.2110 },
          { latitude: 28.6169, longitude: 77.2120 },
          { latitude: 28.6179, longitude: 77.2130 },
        ];
        setRouteCoordinates(defaultRoute);
        // console.log('Using default route:', defaultRoute);
      }
    }
  }, [selectedRoute.coordinates, userLocation, destination]);

  // Check if arrived at destination
  useEffect(() => {
    if (userLocation && destination && destination.coordinates) {
      const destCoord = {
        latitude: destination.coordinates.lat || destination.coordinates.latitude,
        longitude: destination.coordinates.lng || destination.coordinates.longitude,
      };
      const distanceToDestination = calculateDistance(
        userLocation.latitude, userLocation.longitude,
        destCoord.latitude, destCoord.longitude
      );
      if (distanceToDestination < 0.05) {
        Alert.alert(
          'Destination Reached',
          `You have arrived at ${destination.name}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    }
  }, [userLocation, destination, navigation]);

  // Initialize navigation
  useEffect(() => {
    const initializeNavigation = async () => {
      await startLocationTracking();
      
      // Fit map to show route after a delay to ensure coordinates are set
      setTimeout(() => {
        if (routeCoordinates.length > 0 && mapRef.current) {
          const allCoordinates = [...routeCoordinates];
          if (userLocation) allCoordinates.unshift(userLocation);
          if (destination && destination.coordinates) {
            const destCoord = {
              latitude: destination.coordinates.lat || destination.coordinates.latitude,
              longitude: destination.coordinates.lng || destination.coordinates.longitude,
            };
            allCoordinates.push(destCoord);
          }
          
          // console.log('Fitting map to coordinates:', allCoordinates);
          mapRef.current.fitToCoordinates(allCoordinates, {
            edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
            animated: true,
          });
        }
      }, 1000);
      
      Animated.timing(infoOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    };
    
    initializeNavigation();
    return () => stopLocationTracking();
  }, [routeCoordinates]);

  const stopNavigation = () => {
    setIsNavigating(false);
    stopLocationTracking();
    Animated.timing(infoOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      navigation.goBack();
    });
  };

  const toggleFollowUser = () => {
    setFollowUser(!followUser);
    if (!followUser && userLocation) {
      animateToUserLocation(userLocation, currentHeading);
    }
  };

  const recenterMap = () => {
    if (userLocation && mapRef.current) {
      animateToUserLocation(userLocation, currentHeading);
    }
  };

  // console.log('Rendering with route coordinates:', routeCoordinates.length);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DELHI_REGION}
        showsUserLocation={true}
        followsUserLocation={followUser}
        showsMyLocationButton={false}
        userLocationPriority="high"
        userLocationUpdateInterval={1000}
        onRegionChangeComplete={() => setFollowUser(false)}
        mapType="standard"
        showsTraffic={false}
        showsBuildings={true}
        showsPointsOfInterest={true}
      >
        {/* Main route polyline */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#007AFF"
            strokeWidth={8}
            strokeOpacity={1}
            lineDashPattern={[0]}
            lineJoin="round"
            lineCap="round"
          />
        )}
        
        {/* Traveled route (different color) */}
        {getTraveledRouteCoordinates().length > 1 && (
          <Polyline
            coordinates={getTraveledRouteCoordinates()}
            strokeColor="#34C759"
            strokeWidth={8}
            strokeOpacity={1}
            lineDashPattern={[0]}
            lineJoin="round"
            lineCap="round"
          />
        )}
        
        {/* Remaining route (original color but slightly transparent) */}
        {getRemainingRouteCoordinates().length > 1 && (
          <Polyline
            coordinates={getRemainingRouteCoordinates()}
            strokeColor="#007AFF"
            strokeWidth={8}
            strokeOpacity={0.7}
            lineDashPattern={[0]}
            lineJoin="round"
            lineCap="round"
          />
        )}
        
        {/* Start marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            description="Starting point"
            pinColor="#34C759"
          />
        )}
        
        {/* Destination marker */}
        {destination && destination.coordinates && (
          <Marker
            coordinate={{
              latitude: destination.coordinates.lat || destination.coordinates.latitude,
              longitude: destination.coordinates.lng || destination.coordinates.longitude,
            }}
            title={destination.name}
            description={destination.address}
            pinColor="#FF3B30"
          />
        )}
      </MapView>
      
      <View style={styles.controlButtons}>
        <TouchableOpacity style={styles.controlButton} onPress={recenterMap}>
          <Ionicons name="locate" size={24} color={followUser ? "#007AFF" : "#666"} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.overlayContainer}>
        <Animated.View style={[styles.navInfoContainer, { opacity: infoOpacity }]}>
          <View style={styles.navHeader}>
            <Text style={styles.navTitle}>Navigating to {destination?.name}</Text>
            <TouchableOpacity style={styles.stopButton} onPress={stopNavigation}>
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.stopButtonText}>Stop</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.turnInstruction}>
            <View style={styles.turnInstructionIcon}>
              <Ionicons
                name={
                  nextTurnInstruction.includes('right') ? 'arrow-forward' :
                  nextTurnInstruction.includes('left') ? 'arrow-back' : 'arrow-up'
                }
                size={24}
                color="#007AFF"
              />
            </View>
            <View style={styles.turnInstructionContent}>
              <Text style={styles.turnInstructionText}>{nextTurnInstruction}</Text>
              {nextTurnDistance && (
                <Text style={styles.turnDistance}>in {nextTurnDistance.toFixed(1)} km</Text>
              )}
            </View>
          </View>
          
          <View style={styles.navDetails}>
            <View style={[styles.routeIndicator, { backgroundColor: '#007AFF' }]} />
            <View style={styles.routeInfo}>
              <Text style={styles.routeTitle}>{selectedRoute.title || 'Route'}</Text>
              <Text style={styles.routeDetails}>
                {distanceRemaining} • {timeRemaining}
              </Text>
              <View style={styles.safetyScoreContainer}>
                <Text style={styles.safetyScoreText}>Safety Score: {selectedRoute.safetyScore || 0}/5</Text>
                <View style={styles.safetyStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= (selectedRoute.safetyScore || 0) ? "star" : "star-outline"}
                      size={14}
                      color={star <= (selectedRoute.safetyScore || 0) ? "#FFD700" : "#ddd"}
                    />
                  ))}
                </View>
              </View>
              <View style={styles.routeExtraInfo}>
                <Text style={styles.routeEta}>ETA: {selectedRoute.eta || 'N/A'}</Text>
                <View style={styles.routeTags}>
                  <View style={styles.routeTag}>
                    <Ionicons name="speedometer-outline" size={12} color="#444" />
                    <Text style={styles.routeTagText}>
                      {(currentSpeed * 3.6).toFixed(0)} km/h
                    </Text>
                  </View>
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
    zIndex: 0,
  },
  controlButtons: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 2,
  },
  controlButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    pointerEvents: 'box-none',
  },
  navInfoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 6,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  turnInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  turnInstructionIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  turnInstructionContent: {
    flex: 1,
  },
  turnInstructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  turnDistance: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  navDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeIndicator: {
    width: 8,
    height: 40,
    borderRadius: 4,
    marginRight: 15,
  },
  routeInfo: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  routeDetails: {
    fontSize: 14,
    color: '#666',
  },
  safetyScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  safetyScoreText: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  safetyStars: {
    flexDirection: 'row',
  },
  routeExtraInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  routeEta: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
    marginBottom: 5,
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
});