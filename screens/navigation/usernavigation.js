import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert, Modal, TextInput, Linking, Vibration } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SMS from 'expo-sms';
import * as Battery from 'expo-battery';
import SafetyAuditScreen from '../audit/auditscreen';


const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

const PIN_STORAGE_KEY = '@user_security_pin';
const DEFAULT_PIN = '1234';
const EMERGENCY_CONTACT_NUMBER = '112'; 

export default function NavigationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { route: selectedRoute, destination, userLocation: initialUserLocation } = route.params;
  
  const mapRef = useRef(null);
  
  // State management
  const [userLocation, setUserLocation] = useState(initialUserLocation);
  const [currentHeading, setCurrentHeading] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationStarted, setNavigationStarted] = useState(false);
  const [distanceRemaining, setDistanceRemaining] = useState(selectedRoute.distance || '0 km');
  const [timeRemaining, setTimeRemaining] = useState(selectedRoute.time || '0 min');
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [nextTurnDistance, setNextTurnDistance] = useState(null);
  const [nextTurnInstruction, setNextTurnInstruction] = useState('Continue straight');
  const [isLocationPermissionGranted, setIsLocationPermissionGranted] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [traveledCoordinates, setTraveledCoordinates] = useState([]);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [cameraFollowing, setCameraFollowing] = useState(false);
  
  // NEW State for the custom audit modal
  const [isAuditModalVisible, setIsAuditModalVisible] = useState(false);

  // Safety check modal state
  const [isSafetyModalVisible, setIsSafetyModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [securityPin, setSecurityPin] = useState(DEFAULT_PIN);
  const [countdown, setCountdown] = useState(30);
  const countdownTimerRef = useRef(null);


  const sendEmergencySms = async () => {
    const isSmsAvailable = await SMS.isAvailableAsync();
    if (isSmsAvailable) {
        const batteryLevel = Math.round((await Battery.getBatteryLevelAsync()) * 100);
        const currentTime = new Date().toLocaleTimeString();
        const locationString = userLocation 
            ? `http://maps.google.com/?q=${userLocation.latitude},${userLocation.longitude}`
            : "Location not available";

        const message = `EMERGENCY ALERT: I might be in trouble.
Current Location: ${locationString}
Battery: ${batteryLevel}%
Time: ${currentTime}`;

        await SMS.sendSMSAsync(
            [EMERGENCY_CONTACT_NUMBER],
            message
        );
    } else {
        Alert.alert("SMS Not Available", "Could not send SMS from this device.");
    }
  };

  useEffect(() => {
    if (isSafetyModalVisible) {
      Vibration.vibrate(500); 
      setCountdown(30);
      
      countdownTimerRef.current = setInterval(() => {
        setCountdown(prev => {
          const newCountdown = prev - 1;

          if (newCountdown === 20 || newCountdown === 10) {
            Vibration.vibrate([0, 300, 200, 300]);
          }

          if (newCountdown === 5) {
            Vibration.vibrate([0, 500, 100, 500, 100, 500, 100, 500, 100, 500]);
          }

          if (newCountdown <= 0) {
            clearInterval(countdownTimerRef.current);
            Vibration.cancel();
            handlePinSubmit(true);
            return 0;
          }
          return newCountdown;
        });
      }, 1000);
    } else {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      Vibration.cancel();
    }
    
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      Vibration.cancel();
    };
  }, [isSafetyModalVisible]);


  useEffect(() => {
    const loadPin = async () => {
      try {
        const storedPin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
        if (storedPin) {
          setSecurityPin(storedPin);
        } else {
          Alert.alert(
            "Set a Security PIN",
            "A default PIN (1234) will be used until you set one.",
            [
              { text: "OK" },
              { text: "Set PIN Now", onPress: () => navigation.navigate('SecurityPin') }
            ]
          );
        }
      } catch (error) {
        console.error("Failed to load PIN from storage", error);
        setSecurityPin(DEFAULT_PIN);
      }
    };
    loadPin();
  }, [navigation]);

  const OVERVIEW_REGION = {
    latitude: initialUserLocation?.latitude || 28.6139,
    longitude: initialUserLocation?.longitude || 77.2090,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateBearing = (lat1, lon1, lat2, lon2) => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
      Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

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

  const getRemainingRouteCoordinates = () => {
    if (!routeCoordinates || routeCoordinates.length === 0) return [];
    return routeCoordinates.slice(currentRouteIndex);
  };

  const getTraveledRouteCoordinates = () => {
    if (!routeCoordinates || routeCoordinates.length === 0) return [];
    return routeCoordinates.slice(0, currentRouteIndex + 1);
  };

  const updateRouteProgress = useCallback((currentLocation) => {
    if (!routeCoordinates || routeCoordinates.length === 0) return;
    const { latitude, longitude } = currentLocation;
    const closestPoint = findClosestPointOnRoute(latitude, longitude, routeCoordinates);
    if (closestPoint) {
      setCurrentRouteIndex(closestPoint.index);
      setTraveledCoordinates(prev => [...prev, currentLocation].slice(-100));
      let remainingDistance = 0;
      for (let i = closestPoint.index; i < routeCoordinates.length - 1; i++) {
        const coord1 = routeCoordinates[i];
        const coord2 = routeCoordinates[i + 1];
        remainingDistance += calculateDistance(coord1.latitude, coord1.longitude, coord2.latitude, coord2.longitude);
      }
      setDistanceRemaining(`${remainingDistance.toFixed(1)} km`);
      if (closestPoint.index < routeCoordinates.length - 5) {
        const nextCoord = routeCoordinates[closestPoint.index + 5];
        const distanceToNext = calculateDistance(latitude, longitude, nextCoord.latitude, nextCoord.longitude);
        setNextTurnDistance(distanceToNext);
        const currentBearing = calculateBearing(latitude, longitude, routeCoordinates[closestPoint.index + 1].latitude, routeCoordinates[closestPoint.index + 1].longitude);
        if (closestPoint.index + 2 < routeCoordinates.length) {
          const nextBearing = calculateBearing(routeCoordinates[closestPoint.index + 1].latitude, routeCoordinates[closestPoint.index + 1].longitude, routeCoordinates[closestPoint.index + 2].latitude, routeCoordinates[closestPoint.index + 2].longitude);
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

  const smoothHeading = (newHeading, oldHeading) => {
    if (newHeading == null || oldHeading == null) return newHeading ?? 0;
    const diff = ((newHeading - oldHeading + 180) % 360) - 180;
    return oldHeading + diff * 0.2;
  };
  
  const animateToUserLocation = useCallback((location, heading = null) => {
    if (!mapRef.current) return;
    const cameraConfig = { center: { latitude: location.latitude, longitude: location.longitude }, zoom: 18, heading: heading ?? 0, pitch: 45 };
    mapRef.current.animateCamera(cameraConfig, { duration: 500 });
  }, [mapRef]);

  const getActualRoute = async (start, end) => {
    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`);
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return route.geometry.coordinates.map(coord => ({ latitude: coord[1], longitude: coord[0] }));
      }
    } catch (error) { console.error(error); }
    return generateRealisticRoute(start, end);
  };

  const generateRealisticRoute = (start, end) => {
    const coordinates = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const lat = start.latitude + (end.latitude - start.latitude) * progress + Math.sin(progress * Math.PI * 2) * 0.001;
      const lng = start.longitude + (end.longitude - start.longitude) * progress + Math.cos(progress * Math.PI * 3) * 0.001;
      coordinates.push({ latitude: lat, longitude: lng });
    }
    return coordinates;
  };

  // MODIFIED function to show the custom modal
  const promptForAudit = () => {
    setIsNavigating(false);
    setNavigationStarted(false);
    setIsAuditModalVisible(true);
  };

  // NEW handlers for the custom modal buttons
  const handleContinueToAudit = () => {
    setIsAuditModalVisible(false);
    navigation.navigate('auditscreen', {
      source: initialUserLocation,
      destination: destination,
    });
  };

  const handleSkipAudit = () => {
    setIsAuditModalVisible(false);
    navigation.goBack();
  };


  const startNavigation = () => {
    setNavigationStarted(true);
    setIsNavigating(true);
    setCameraFollowing(true);
    if (userLocation) animateToUserLocation(userLocation, currentHeading);
  };

  const stopNavigation = () => {
    promptForAudit();
  };

  const exitNavigation = () => {
    setNavigationStarted(false);
    navigation.goBack();
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission', 'Location permission is required for navigation.');
        return false;
      }
      setIsLocationPermissionGranted(true);
      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to request location permission');
      return false;
    }
  };

  const startLocationTracking = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;
    try {
      const subscription = await Location.watchPositionAsync({ accuracy: Location.Accuracy.BestForNavigation, timeInterval: 500, distanceInterval: 2 },
        (location) => {
          const newLocation = { latitude: location.coords.latitude, longitude: location.coords.longitude };
          const newHeading = location.coords.heading ?? 0;
          const smoothedHeading = smoothHeading(newHeading, currentHeading);
          setUserLocation(newLocation);
          setCurrentSpeed(location.coords.speed ?? 0);
          setCurrentHeading(smoothedHeading);
          updateRouteProgress(newLocation);
          if (cameraFollowing) animateToUserLocation(newLocation, smoothedHeading);
        }
      );
      setLocationSubscription(subscription);
    } catch (error) {
      Alert.alert('Location Error', 'Failed to start location tracking');
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
  };
  
  const toggleFollowUser = () => {
    if (!cameraFollowing) {
      setCameraFollowing(true);
      if (userLocation) animateToUserLocation(userLocation, currentHeading);
    }
  };
  
  const handleRegionChangeComplete = (region, details) => {
    if (details && details.isGesture) setCameraFollowing(false);
  };

  const handleCallForHelp = () => {
    setIsSafetyModalVisible(false);
    Linking.openURL('tel:112').catch(err => Alert.alert("Couldn't make the call", err.message));
  };

  const handlePinSubmit = (isTimerExpired = false) => {
    if (isTimerExpired) {
        setIsSafetyModalVisible(false);
        sendEmergencySms();
        Alert.alert("Emergency Alert Sent", "Your location has been sent to your emergency contact.");
        return;
    }

    if (pinInput === securityPin) {
      setIsSafetyModalVisible(false);
      setPinInput('');
    } else {
      Alert.alert('Incorrect PIN', 'Please try again.');
      setPinInput('');
    }
  };

  const NavigationArrow = ({ heading }) => (
    <View style={[styles.navigationArrow, { transform: [{ rotate: `${heading}deg` }] }]}>
      <Ionicons name="navigate-circle" size={40} color="#007AFF" style={styles.navigationArrowIcon} />
    </View>
  );

  useEffect(() => {
    const initializeRoute = async () => {
      if (selectedRoute.coordinates && Array.isArray(selectedRoute.coordinates) && selectedRoute.coordinates.length > 0) {
        const formattedCoords = selectedRoute.coordinates.map(coord => ({ latitude: coord.lat || coord.latitude, longitude: coord.lng || coord.longitude })).filter(coord => coord.latitude != null && coord.longitude != null);
        if (formattedCoords.length > 0) setRouteCoordinates(formattedCoords);
        else if (userLocation && destination && destination.coordinates) {
          const destCoord = { latitude: destination.coordinates.lat || destination.coordinates.latitude, longitude: destination.coordinates.lng || destination.coordinates.longitude };
          const actualRoute = await getActualRoute(userLocation, destCoord);
          setRouteCoordinates(actualRoute);
        }
      } else if (userLocation && destination && destination.coordinates) {
        const destCoord = { latitude: destination.coordinates.lat || destination.coordinates.latitude, longitude: destination.coordinates.lng || destination.coordinates.longitude };
        const actualRoute = await getActualRoute(userLocation, destCoord);
        setRouteCoordinates(actualRoute);
      } else {
        const defaultStart = { latitude: 28.6139, longitude: 77.2090 };
        const defaultEnd = { latitude: 28.6179, longitude: 77.2130 };
        const defaultRoute = await getActualRoute(defaultStart, defaultEnd);
        setRouteCoordinates(defaultRoute);
      }
    };
    initializeRoute();
  }, [selectedRoute.coordinates, userLocation, destination]);

  useEffect(() => {
    if (navigationStarted) startLocationTracking();
    else stopLocationTracking();
    return () => stopLocationTracking();
  }, [navigationStarted]);

  useEffect(() => {
    if (isNavigating && userLocation && destination && destination.coordinates) {
      const destCoord = { latitude: destination.coordinates.lat || destination.coordinates.latitude, longitude: destination.coordinates.lng || destination.coordinates.longitude };
      const distanceToDestination = calculateDistance(userLocation.latitude, userLocation.longitude, destCoord.latitude, destCoord.longitude);
      if (distanceToDestination < 0.05) {
        promptForAudit();
      }
    }
  }, [userLocation, destination, isNavigating]);

  useEffect(() => {
    let safetyTimer;
    if (navigationStarted) {
      safetyTimer = setInterval(() => {
        setIsSafetyModalVisible(true);
      }, 300000); 
    }
    return () => {
      if (safetyTimer) clearInterval(safetyTimer);
    };
  }, [navigationStarted]);

  // NEW Render function for the Audit Modal
  const renderAuditModal = () => (
    <Modal
      transparent={true}
      animationType="fade"
      visible={isAuditModalVisible}
      onRequestClose={handleSkipAudit}
    >
      <View style={styles.auditModalBackdrop}>
        <View style={styles.auditModalContainer}>
          <View style={styles.auditModalIconContainer}>
            <Ionicons name="help" size={80} color="#c8a45c" style={styles.auditModalIcon} />
          </View>
          <Text style={styles.auditModalTitle}>Share Experience</Text>
          <Text style={styles.auditModalDescription}>
            Fill the Safety Audit and let others gain insights from your travel !!
          </Text>
          
          {/* This is the corrected line */}
          <TouchableOpacity style={styles.auditModalContinueButton} onPress={handleContinueToAudit}>
            <Text style={styles.auditModalContinueButtonText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.auditModalSkipButton} onPress={handleSkipAudit}>
            <Text style={styles.auditModalSkipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={OVERVIEW_REGION}
        showsUserLocation={!navigationStarted}
        userLocationPriority="high"
        onRegionChangeComplete={handleRegionChangeComplete}
        mapType="standard"
        showsTraffic={true}
        showsBuildings={true}
        showsPointsOfInterest={false}
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={true}
        pitchEnabled={true}
      >
        {getTraveledRouteCoordinates().length > 1 && <Polyline coordinates={getTraveledRouteCoordinates()} strokeColor="#34C759" strokeWidth={8} zIndex={3} />}
        {getRemainingRouteCoordinates().length > 1 && <Polyline coordinates={getRemainingRouteCoordinates()} strokeColor="#007AFF" strokeWidth={8} zIndex={2} />}
        {!navigationStarted && userLocation && <Marker coordinate={userLocation} title="Your Location" description="Starting point" pinColor="#34C759" />}
        {navigationStarted && userLocation && <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }} zIndex={4}><NavigationArrow heading={currentHeading} /></Marker>}
        {destination && destination.coordinates && <Marker coordinate={{ latitude: destination.coordinates.lat || destination.coordinates.latitude, longitude: destination.coordinates.lng || destination.coordinates.longitude }} title={destination.name} description={destination.address} pinColor="#FF3B30" />}
      </MapView>

      <View style={styles.controlButtons}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleFollowUser}>
          <Ionicons name={navigationStarted ? "navigate" : "locate"} size={24} color={cameraFollowing ? "#007AFF" : "#666"} />
        </TouchableOpacity>
      </View>

      <View style={styles.overlayContainer} pointerEvents="box-none">
        <View style={styles.navInfoContainer} pointerEvents="auto">
          <View style={styles.navHeader}>
            <Text style={styles.navTitle} numberOfLines={1}>{navigationStarted ? 'Navigating to' : 'Route to'} {destination?.name}</Text>
            <TouchableOpacity style={styles.stopButton} onPress={exitNavigation}>
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.stopButtonText}>Exit</Text>
            </TouchableOpacity>
          </View>
          {navigationStarted && (
            <View style={styles.turnInstruction}>
              <View style={styles.turnInstructionIcon}><Ionicons name={nextTurnInstruction.includes('right') ? 'arrow-forward' : nextTurnInstruction.includes('left') ? 'arrow-back' : 'arrow-up'} size={24} color="#007AFF" /></View>
              <View style={styles.turnInstructionContent}>
                <Text style={styles.turnInstructionText}>{nextTurnInstruction}</Text>
                {nextTurnDistance && <Text style={styles.turnDistance}>in {nextTurnDistance.toFixed(1)} km</Text>}
              </View>
            </View>
          )}
          <View style={styles.navDetails}>
            <View style={[styles.routeIndicator, { backgroundColor: '#007AFF' }]} />
            <View style={styles.routeInfo}>
              <Text style={styles.routeTitle}>{selectedRoute.title || 'Route'}</Text>
              <Text style={styles.routeDetails}>{distanceRemaining} • {timeRemaining}</Text>
              <View style={styles.safetyScoreContainer}>
                <Text style={styles.safetyScoreText}>Safety Score: {selectedRoute.safetyScore || 0}/5</Text>
                <View style={styles.safetyStars}>{[1, 2, 3, 4, 5].map((star) => <Ionicons key={star} name={star <= (selectedRoute.safetyScore || 0) ? "star" : "star-outline"} size={14} color={star <= (selectedRoute.safetyScore || 0) ? "#FFD700" : "#ddd"} />)}</View>
              </View>
              <View style={styles.routeExtraInfo}>
                <Text style={styles.routeEta}>ETA: {selectedRoute.eta || 'N/A'}</Text>
                <View style={styles.routeTags}>
                  {navigationStarted && <View style={styles.routeTag}><Ionicons name="speedometer-outline" size={12} color="#444" /><Text style={styles.routeTagText}>{(currentSpeed * 3.6).toFixed(0)} km/h</Text></View>}
                  <View style={styles.routeTag}><Ionicons name="car-outline" size={12} color="#444" /><Text style={styles.routeTagText}>{selectedRoute.traffic || 'Low Traffic'}</Text></View>
                </View>
              </View>
            </View>
          </View>
          {!navigationStarted ? (
            <TouchableOpacity style={styles.startButton} onPress={startNavigation}><Ionicons name="play" size={20} color="#fff" /><Text style={styles.startButtonText}>Start Navigation</Text></TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.stopNavigationButton} onPress={stopNavigation}><Ionicons name="stop" size={20} color="#fff" /><Text style={styles.stopNavigationButtonText}>End Trip</Text></TouchableOpacity>
          )}
        </View>
      </View>

      <Modal
        transparent={true}
        animationType="fade"
        visible={isSafetyModalVisible}
        onRequestClose={() => { Alert.alert("Action Required", "Please confirm your status or call for help."); }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.timerContainer}>
                <Text style={styles.timerText}>{countdown}</Text>
            </View>
            <Text style={styles.modalTitle}>Safety Check</Text>
            <Text style={styles.modalMessage}>Are you okay? Please confirm your status.</Text>
            
            <TouchableOpacity style={styles.helpButton} onPress={handleCallForHelp}>
              <Ionicons name="call-outline" size={20} color="#fff" />
              <Text style={styles.helpButtonText}>Call for Help</Text>
            </TouchableOpacity>

            <Text style={styles.pinPrompt}>If you are safe, enter your PIN to dismiss.</Text>
            
            <TextInput
              style={styles.pinInput}
              placeholder="* * * *"
              placeholderTextColor="#a0a0a0"
              keyboardType="numeric"
              maxLength={4}
              value={pinInput}
              onChangeText={setPinInput}
              secureTextEntry={true}
            />
            
            <TouchableOpacity style={styles.dismissButton} onPress={() => handlePinSubmit(false)}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
              <Text style={styles.dismissButtonText}>I'm Safe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {renderAuditModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  map: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, position: 'absolute', top: 0, left: 0, zIndex: 0 },
  controlButtons: { position: 'absolute', top: 60, right: 20, zIndex: 2 },
  controlButton: { backgroundColor: '#fff', borderRadius: 25, width: 50, height: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 10, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  navigationArrow: { alignItems: 'center', justifyContent: 'center' },
  navigationArrowIcon: { elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  overlayContainer: { ...StyleSheet.absoluteFillObject, zIndex: 1, justifyContent: 'flex-end', pointerEvents: 'box-none' },
  navInfoContainer: { backgroundColor: '#fff', borderRadius: 12, elevation: 6, padding: 15, margin: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65 },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  navTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
  stopButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ff6b6b', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  stopButtonText: { color: '#fff', fontSize: 14, fontWeight: '500', marginLeft: 5 },
  turnInstruction: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8, marginBottom: 15 },
  turnInstructionIcon: { width: 40, height: 40, backgroundColor: '#fff', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.22, shadowRadius: 2.22 },
  turnInstructionContent: { flex: 1 },
  turnInstructionText: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 2 },
  turnDistance: { fontSize: 14, color: '#666', fontWeight: '500' },
  navDetails: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
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
  startButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 8, marginTop: 10 },
  startButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  stopNavigationButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff6b6b', paddingVertical: 15, borderRadius: 8, marginTop: 10 },
  stopNavigationButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)' },
  modalContent: { width: '85%', maxWidth: 350, backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10 },
  timerContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 3, borderColor: 'white', elevation: 5 },
  timerText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
  modalMessage: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 25 },
  helpButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF3B30', paddingVertical: 14, borderRadius: 12, marginBottom: 20, width: '100%' },
  helpButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 10 },
  pinPrompt: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 15 },
  pinInput: { width: '80%', height: 55, borderColor: '#ddd', borderWidth: 1, borderRadius: 12, textAlign: 'center', fontSize: 24, letterSpacing: 15, marginBottom: 20, backgroundColor: '#f9f9f9' },
  dismissButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#34C759', paddingVertical: 14, borderRadius: 12, width: '100%' },
  dismissButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 10 },
  
  // NEW Styles for the Audit Modal
  auditModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  auditModalContainer: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
    elevation: 20, // Make sure it's on top of other modals if they overlap
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  auditModalIconContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  auditModalIcon: {
    fontWeight: 'bold',
  },
  auditModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  auditModalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  auditModalContinueButton: {
    width: '100%',
    backgroundColor: '#212121',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 15,
  },
  auditModalContinueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  auditModalSkipButton: {
    width: '100%',
    padding: 10,
    alignItems: 'center',
  },
  auditModalSkipButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});