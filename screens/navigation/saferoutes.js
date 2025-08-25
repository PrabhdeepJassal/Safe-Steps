import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Easing,
  Keyboard,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Polyline, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

// --- REFACTORED CONSTANTS FOR CALCULATIONS ---
const BASE_SPEEDS_KPH = {
  driving: 30, // A more realistic base speed for city driving
  walking: 5,
};

const TRAFFIC_MULTIPLIERS = {
  low: 1.0,      // No penalty
  moderate: 1.8, // Speed is divided by 1.8
  high: 2.8,     // Speed is divided by 2.8 (heavy penalty)
};


export default function MapScreen() {
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const isInitialLocationSet = useRef(false);

  const DELHI_REGION = {
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  };

  const DRAWER_MIN_HEIGHT = 100;
  const DRAWER_MID_HEIGHT = SCREEN_HEIGHT * 0.4;
  const DRAWER_MAX_HEIGHT = SCREEN_HEIGHT * 0.8;

  const [searchQuery, setSearchQuery] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [activeRoute, setActiveRoute] = useState(null);
  const [drawerHeight, setDrawerHeight] = useState(DRAWER_MIN_HEIGHT);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [mapRoutes, setMapRoutes] = useState([]);
  const [routeCardScales, setRouteCardScales] = useState([]);
  const [travelMode, setTravelMode] = useState('driving');

  const searchTimeoutRef = useRef(null);
  const drawerTranslateY = useRef(new Animated.Value(DRAWER_MIN_HEIGHT)).current;
  const drawerOpacity = useRef(new Animated.Value(0)).current;
  const legendPosition = useRef(new Animated.Value(170)).current;
  const handleRotation = useRef(new Animated.Value(0)).current;
  const searchBarScale = useRef(new Animated.Value(1)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const suggestionsOpacity = useRef(new Animated.Value(0)).current;

  const [lastTapTime, setLastTapTime] = useState(0);
  const [lastTapRouteId, setLastTapRouteId] = useState(null);
  const DOUBLE_TAP_DELAY = 300;

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (userLocation && mapRef.current && !isInitialLocationSet.current) {
      isInitialLocationSet.current = true;
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
    }
  }, [userLocation]);


  useEffect(() => {
    if (selectedDestination && userLocation) {
      fetchRoutesFromML(userLocation, {
        latitude: selectedDestination.coordinates.lat,
        longitude: selectedDestination.coordinates.lng
      });
    }
  }, [travelMode, selectedDestination, userLocation]);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUserLocation({ latitude: 28.6139, longitude: 77.2090 });
        return;
      }
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
    } catch (error) {
      console.error('Error getting location:', error);
      setUserLocation({ latitude: 28.6139, longitude: 77.2090 });
    }
  };

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateCamera({
        center: userLocation,
        pitch: 45,
        zoom: 17,
      }, { duration: 1000 });
    }
  };

  const getTimeCategory = () => {
    const hour = new Date().getHours(); 
    if (hour >= 6 && hour < 12) return "Morning";
    if (hour >= 12 && hour < 17) return "Afternoon";
    if (hour >= 17 && hour < 21) return "Evening";
    return "Night";
  };

  const formatTime = (timeInMinutes) => {
    if (timeInMinutes == null || isNaN(timeInMinutes) || timeInMinutes <= 0) return 'N/A';
    const numericValue = Math.round(timeInMinutes);
    if (numericValue >= 60) {
      return `${Math.floor(numericValue / 60)} hr ${numericValue % 60} min`;
    }
    return `${numericValue} min`;
  };

  const formatDistance = (distanceInKm) => {
    if (distanceInKm == null || isNaN(distanceInKm) || distanceInKm <= 0) return 'N/A';
    if (distanceInKm >= 1) {
      return `${distanceInKm.toFixed(1)} km`;
    }
    return `${Math.round(distanceInKm * 1000)} m`;
  };

  // --- REFACTORED ETA CALCULATION FUNCTION ---
  const calculateTravelTime = (distanceInKm, traffic, mode) => {
    if (!distanceInKm || distanceInKm <= 0) return 0;
  
    const baseSpeed = BASE_SPEEDS_KPH[mode] || BASE_SPEEDS_KPH.driving;
    
    if (mode === 'walking') {
      const timeInHours = distanceInKm / baseSpeed;
      return timeInHours * 60; // Return time in minutes
    }
  
    // For driving mode
    const trafficKey = traffic && TRAFFIC_MULTIPLIERS[traffic] ? traffic : 'moderate';
    const trafficMultiplier = TRAFFIC_MULTIPLIERS[trafficKey];
    
    const effectiveSpeedKph = baseSpeed / trafficMultiplier;
    const timeInHours = distanceInKm / effectiveSpeedKph;
    
    return timeInHours * 60; // Return time in minutes
  };

  const calculateETA = (timeInMinutes) => {
    if (timeInMinutes == null || isNaN(timeInMinutes) || timeInMinutes <= 0) {
      return 'N/A';
    }
    const now = new Date();
    const eta = new Date(now.getTime() + timeInMinutes * 60000);
    return eta.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getRouteColor = (safetyScore) => {
    const score = parseFloat(safetyScore);
    if (isNaN(score)) return '#ff8c00'; // Default orange for errors

    if (score >= 8) return '#00ff00'; // Green (Safe)
    if (score >= 6) return '#ffff00'; // Yellow (Moderately Safe)
    if (score >= 4) return '#ff8c00'; // Orange (Less Safe)
    if (score >= 2) return '#ff0000'; // Red (Unsafe)
    return '#8b0000';              // Dark Red (Very Unsafe)
  };

  const parseCoordinates = (coordinates) => {
    if (!coordinates) return [];
    try {
      if (Array.isArray(coordinates)) {
        return coordinates.map(coord => {
          if (Array.isArray(coord) && coord.length >= 2) return { latitude: parseFloat(coord[0]), longitude: parseFloat(coord[1]) };
          if (coord.latitude !== undefined && coord.longitude !== undefined) return { latitude: parseFloat(coord.latitude), longitude: parseFloat(coord.longitude) };
          if (coord.lat !== undefined && coord.lng !== undefined) return { latitude: parseFloat(coord.lat), longitude: parseFloat(coord.lng) };
          return null;
        }).filter(coord => coord && !isNaN(coord.latitude) && !isNaN(coord.longitude));
      }
      if (typeof coordinates === 'string') return parseCoordinates(JSON.parse(coordinates));
      return [];
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      return [];
    }
  };
  
  // --- REFACTORED SAFETY SCORE CALCULATION FUNCTION ---
  const calculateClientSideSafetyScore = (routeData, timeOfDay) => {
    let score = 10.0; // Start with a perfect score
    const distanceInKm = routeData.total_distance_km || routeData.distance_km || 0;
    const traffic = routeData.traffic || 'moderate';
  
    // 1. Time of Day Penalty (Max penalty: 2.5)
    if (timeOfDay === 'Night') {
      score -= 2.5;
    } else if (timeOfDay === 'Evening') {
      score -= 1.0;
    }
  
    // 2. Traffic Penalty (Max penalty: 2.0)
    if (traffic === 'high') {
      score -= 2.0;
    } else if (traffic === 'moderate') {
      score -= 1.0;
    }
  
    // 3. Distance Penalty (Capped at 3.0 points)
    // Penalty is 0.1 per km, capped to prevent long routes from being unfairly punished.
    const distancePenalty = Math.min(distanceInKm * 0.1, 3.0);
    score -= distancePenalty;
  
    // Ensure score is within the valid range [0, 10] and return
    return Math.max(0, score);
  };


  const fetchRoutesFromML = async (sourceCoords, destinationCoords) => {
    try {
      setIsLoadingRoutes(true);
      setRouteError(null);
      const requestBody = {
        source: [sourceCoords.latitude, sourceCoords.longitude],
        destination: [destinationCoords.latitude, destinationCoords.longitude],
        time_category: getTimeCategory(),
      };

      // Replace with your actual API endpoint
      const response = await fetch('https://kodiak-hot-cheetah.ngrok-free.app/evaluate_routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('No route array found in the response');

      const timeCategory = getTimeCategory();

      // 1. Map data and calculate our own safety score for each route.
      let processedRoutes = data.map((route) => {
        const distanceInKm = route.total_distance_km || route.distance_km;
        // USE THE NEW `calculateTravelTime` FUNCTION
        const dynamicTime = calculateTravelTime(distanceInKm, route.traffic || 'moderate', travelMode);
        // USE THE NEW `calculateClientSideSafetyScore` FUNCTION
        const clientSafetyScore = calculateClientSideSafetyScore(route, timeCategory);

        return {
          id: route.route_name || Math.random().toString(),
          time: formatTime(dynamicTime),
          distance: formatDistance(distanceInKm),
          eta: calculateETA(dynamicTime),
          safetyScore: clientSafetyScore, // Use our new client-side score
          coordinates: parseCoordinates(route.route_coords),
          traffic: route.traffic || 'moderate',
          ...route,
        };
      });

      // 2. Re-sort routes based on our new client-side score (highest score first)
      processedRoutes.sort((a, b) => b.safetyScore - a.safetyScore);

      // 3. Finalize routes: assign title, color, and recommended status based on the new order
      const finalRoutes = processedRoutes.map((route, index) => {
        const isRecommended = index === 0;
        return {
          ...route,
          title: `Route ${index + 1}`,
          recommended: isRecommended,
          color: isRecommended ? '#00c853' : getRouteColor(route.safetyScore),
        };
      });

      if (finalRoutes.length > 0) {
        setRoutes(finalRoutes);
        setMapRoutes(finalRoutes.filter(route => route.coordinates && route.coordinates.length > 0));
        setRouteCardScales(finalRoutes.map(() => new Animated.Value(1)));
        setActiveRoute(finalRoutes[0].id);
      } else {
        setRoutes([]);
        setMapRoutes([]);
      }
    } catch (error) {
      console.error('Error fetching routes from ML model:', error);
      setRouteError(`Failed to fetch routes: ${error.message}`);
      setRoutes([]);
      setMapRoutes([]);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const rotateArrow = handleRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const searchLocations = async (query) => {
    if (query.length < 2) return [];
    setIsLoadingSuggestions(true);
    try {
      // Replace with your own LocationIQ key or other geocoding service
      const response = await fetch(`https://us1.locationiq.com/v1/search.php?key=pk.3f47acbcb5c3b22bb27aa511ed68c9b0&q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`);
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      return data.map((item) => ({ id: item.place_id, name: item.display_name.split(',')[0], address: item.display_name, coordinates: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) } }));
    } catch (error) {
      console.error('Error searching locations:', error);
      return [];
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const animateDrawerTo = (height) => {
    Animated.parallel([
      Animated.timing(handleRotation, { toValue: height > DRAWER_MIN_HEIGHT + 50 ? 1 : 0, duration: 200, useNativeDriver: true }),
      Animated.spring(drawerTranslateY, { toValue: height, friction: 8, tension: 40, useNativeDriver: false }),
      Animated.timing(backdropOpacity, { toValue: height > DRAWER_MIN_HEIGHT ? 0.5 : 0, duration: 300, useNativeDriver: true }),
      Animated.timing(legendPosition, { toValue: height > DRAWER_MID_HEIGHT ? DRAWER_MAX_HEIGHT + 20 : 170, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: false }),
    ]).start(() => setDrawerHeight(height));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        const newHeight = Math.max(DRAWER_MIN_HEIGHT, Math.min(DRAWER_MAX_HEIGHT, drawerHeight - gestureState.dy));
        drawerTranslateY.setValue(newHeight);
        backdropOpacity.setValue(Math.min(0.5, ((newHeight - DRAWER_MIN_HEIGHT) / (DRAWER_MAX_HEIGHT - DRAWER_MIN_HEIGHT)) * 0.5));
        legendPosition.setValue(newHeight > DRAWER_MID_HEIGHT ? DRAWER_MAX_HEIGHT + 20 : 170);
      },
      onPanResponderRelease: (_, gestureState) => {
        const velocity = gestureState.vy;
        let targetHeight;
        if (velocity < -0.5) targetHeight = DRAWER_MAX_HEIGHT;
        else if (velocity > 0.5) targetHeight = DRAWER_MIN_HEIGHT;
        else if (drawerHeight < (DRAWER_MIN_HEIGHT + DRAWER_MID_HEIGHT) / 2) targetHeight = DRAWER_MIN_HEIGHT;
        else if (drawerHeight < (DRAWER_MID_HEIGHT + DRAWER_MAX_HEIGHT) / 2) targetHeight = DRAWER_MID_HEIGHT;
        else targetHeight = DRAWER_MAX_HEIGHT;
        animateDrawerTo(targetHeight);
      },
    })
  ).current;

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (text.length === 0) {
      setShowSuggestions(false);
      setSuggestions([]);
      return;
    }
    setShowSuggestions(true);
    setIsLoadingSuggestions(true);
    Animated.timing(suggestionsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchLocations(text);
      setSuggestions(results);
    }, 300);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedDestination(null);
    setRoutes([]);
    setMapRoutes([]);
    setActiveRoute(null);
    if (showDrawer) {
      setShowDrawer(false);
      Animated.timing(drawerOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => animateDrawerTo(DRAWER_MIN_HEIGHT));
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setSearchQuery(suggestion.name);
    setSelectedDestination(suggestion);
    setShowSuggestions(false);
    Animated.timing(suggestionsOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    Keyboard.dismiss();
    if (userLocation && suggestion.coordinates) {
      setShowDrawer(true);
      animateDrawerTo(DRAWER_MID_HEIGHT);
      Animated.timing(drawerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    Animated.spring(searchBarScale, { toValue: 1.02, friction: 8, tension: 40, useNativeDriver: true }).start();
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    Animated.spring(searchBarScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }).start();
    setTimeout(() => {
        setShowSuggestions(false);
        Animated.timing(suggestionsOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }, 250);
  };

  const selectRoute = (route, index) => {
    const currentTime = new Date().getTime();
    if (lastTapRouteId === route.id && currentTime - lastTapTime < DOUBLE_TAP_DELAY) {
      startNavigation(route);
      return;
    }
    setLastTapTime(currentTime);
    setLastTapRouteId(route.id);
    setActiveRoute(route.id);
    Animated.sequence([
      Animated.timing(routeCardScales[index], { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(routeCardScales[index], { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  };

  const startNavigation = (route) => {
    if (!route) { console.error('No route selected for navigation'); return; }
    navigation.navigate('usernavigation', { route, destination: selectedDestination, userLocation });
  };

  const retryFetchRoutes = () => {
    if (userLocation && selectedDestination) {
      const destinationCoords = { latitude: selectedDestination.coordinates?.lat, longitude: selectedDestination.coordinates?.lng };
      fetchRoutesFromML(userLocation, destinationCoords);
    }
  };

  const toggleTravelMode = () => setTravelMode(prevMode => prevMode === 'driving' ? 'walking' : 'driving');

  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSuggestionSelect(item)} activeOpacity={0.7}>
      <Ionicons name="location-outline" size={20} color="#666" style={styles.suggestionIcon} />
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionName}>{item.name}</Text>
        <Text style={styles.suggestionAddress} numberOfLines={1}>{item.address}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSearchBar = () => (
    <View style={styles.searchWrapper}>
      <Animated.View style={[styles.searchContainer, { transform: [{ scale: searchBarScale }] }]}>
        <View style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput style={styles.searchInput} placeholder="Enter Destination" placeholderTextColor="#666" value={searchQuery} onChangeText={handleSearch} returnKeyType="done" onFocus={handleSearchFocus} onBlur={handleSearchBlur} />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}><Ionicons name="close" size={20} color="#666" /></TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.modeToggle} onPress={toggleTravelMode}><Ionicons name={travelMode === 'driving' ? 'car-sport' : 'walk'} size={24} color="#4285F4" /></TouchableOpacity>
          )}
        </View>
      </Animated.View>
      {showSuggestions && (
        <Animated.View style={[styles.suggestionsContainer, { opacity: suggestionsOpacity }]}>
          {isLoadingSuggestions ? (
            <View style={styles.loadingContainer}><ActivityIndicator size="small" color="#666" /><Text style={styles.loadingText}>Searching...</Text></View>
          ) : suggestions.length > 0 ? (
            <FlatList data={suggestions} renderItem={renderSuggestionItem} keyExtractor={(item) => item.id.toString()} style={styles.suggestionsList} keyboardShouldPersistTaps="handled" />
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.noResultsText}>No results found.</Text>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );

  const renderSeverityLegend = () => (
    <Animated.View style={[styles.legendContainer, { bottom: legendPosition }]}>
      <Text style={styles.legendTitle}>Safety Level</Text>
      {[
        { level: '8-10 (Safest)', color: '#00ff00' },
        { level: '6-8', color: '#ffff00' },
        { level: '4-6', color: '#ff8c00' },
        { level: '2-4', color: '#ff0000' },
        { level: '0-2 (Least Safe)', color: '#8b0000' }
      ].map((item, index) => (
        <View key={index} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: item.color }]} /><Text style={styles.legendText}>{item.level}</Text>
        </View>
      ))}
    </Animated.View>
  );

  const renderRouteCard = (route, index) => (
    <Animated.View style={{ transform: [{ scale: routeCardScales[index] || new Animated.Value(1) }] }}>
      <TouchableOpacity style={[styles.routeCard, activeRoute === route.id && styles.routeCardActive, route.recommended && styles.routeCardRecommended]} onPress={() => selectRoute(route, index)} activeOpacity={0.8}>
        <View style={[styles.routeIndicator, { backgroundColor: route.color }]} />
        <View style={styles.routeInfo}>
          <View style={styles.routeTitleContainer}>
            <Text style={styles.routeTitle}>{route.title}</Text>
            {route.recommended && (<View style={styles.recommendedBadge}><Ionicons name="shield-checkmark" size={12} color="#fff" /><Text style={styles.recommendedText}> Safest</Text></View>)}
          </View>
          <Text style={styles.routeDetails}>{route.time} • {route.distance}</Text>
          <Text style={styles.doubleTapHint}>Double-tap to start navigation</Text>
          {route.safetyScore != null && (
            <View style={styles.safetyScoreContainer}>
              <Text style={styles.safetyScoreText}>Safety Score: {route.safetyScore.toFixed(1)}/10</Text>
              <View style={styles.safetyBar}>
                <View style={[styles.safetyBarFill, { width: `${route.safetyScore * 10}%`, backgroundColor: getRouteColor(route.safetyScore) }]} />
              </View>
            </View>
          )}
          {activeRoute === route.id && (<View style={styles.routeExtraInfo}><Text style={styles.routeEta}>ETA: {route.eta}</Text></View>)}
        </View>
        <Ionicons name={activeRoute === route.id ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderDrawer = () => showDrawer && (
    <Animated.View style={[styles.drawerContainer, { height: drawerTranslateY }]}>
      <View style={styles.drawerHeaderContainer} {...panResponder.panHandlers}>
        <View style={styles.drawerHandleContainer}>
          <View style={styles.drawerHandle} /><Animated.View style={{ transform: [{ rotate: rotateArrow }], marginTop: 8 }}><Ionicons name="chevron-up" size={20} color="#666" /></Animated.View>
        </View>
      </View>
      <Animated.View style={{ opacity: drawerOpacity, flex: 1 }}>
        <Text style={styles.drawerTitle}>Routes to {selectedDestination?.name || searchQuery}</Text>
        {isLoadingRoutes ? (
          <View style={styles.loadingRoutesContainer}><ActivityIndicator size="large" color="#4285F4" /><Text style={styles.loadingRoutesText}>Analyzing safest routes...</Text></View>
        ) : routeError ? (
          <View style={styles.errorContainer}><Ionicons name="warning-outline" size={48} color="#ff6b6b" /><Text style={styles.errorText}>{routeError}</Text><TouchableOpacity style={styles.retryButton} onPress={retryFetchRoutes}><Text style={styles.retryButtonText}>Retry</Text></TouchableOpacity></View>
        ) : routes.length === 0 ? (
          <View style={styles.errorContainer}><Text style={styles.errorText}>No routes available.</Text></View>
        ) : (
          <ScrollView style={styles.drawerContent} showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerScrollContent}>
            {routes.map((route, index) => (<View key={route.id}>{renderRouteCard(route, index)}</View>))}
          </ScrollView>
        )}
      </Animated.View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={DELHI_REGION}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {mapRoutes.map((route) => (
          <Polyline
            key={route.id}
            coordinates={route.coordinates}
            strokeColor={route.color}
            strokeWidth={activeRoute === route.id ? 7 : 5}
            zIndex={activeRoute === route.id ? 10 : 1}
          />
        ))}
        {selectedDestination?.coordinates && (<Marker coordinate={{ latitude: selectedDestination.coordinates.lat, longitude: selectedDestination.coordinates.lng }} title={selectedDestination.name} description={selectedDestination.address} />)}
      </MapView>
      <View style={styles.overlayContainer} pointerEvents="box-none">
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} pointerEvents="none" />
        
        <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
            <Ionicons name="locate-outline" size={28} color="#4285F4" />
        </TouchableOpacity>
        
        {renderSearchBar()}
        {renderSeverityLegend()}
        {renderDrawer()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  map: { ...StyleSheet.absoluteFillObject },
  overlayContainer: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'black' },
  searchWrapper: { position: 'absolute', top: 60, left: 15, right: 15, zIndex: 3 },
  searchContainer: { zIndex: 3 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 30, paddingHorizontal: 15, paddingVertical: 12, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  searchBarFocused: { elevation: 8, shadowOpacity: 0.2 },
  searchInput: { flex: 1, marginHorizontal: 10, fontSize: 17, color: '#333' },
  clearButton: { padding: 5 },
  modeToggle: { padding: 5 },
  suggestionsContainer: { backgroundColor: '#fff', borderRadius: 12, marginTop: 8, elevation: 8, maxHeight: 250 },
  suggestionsList: { maxHeight: 250 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  suggestionIcon: { marginRight: 15 },
  suggestionContent: { flex: 1 },
  suggestionName: { fontSize: 16, fontWeight: '500', color: '#333' },
  suggestionAddress: { fontSize: 14, color: '#666', marginTop: 2 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingText: { marginLeft: 10, fontSize: 14, color: '#666' },
  noResultsText: { fontSize: 14, color: '#666' },
  centerButton: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    backgroundColor: '#fff',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    zIndex: 2,
  },
  legendContainer: { position: 'absolute', left: 15, bottom: 170, backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: 10, borderRadius: 8, elevation: 5, zIndex: 2, },
  legendTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 5, color: '#333', textAlign: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8, borderWidth: 1, borderColor: '#ccc' },
  legendText: { fontSize: 12, color: '#333' },
  drawerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 16, zIndex: 2 },
  drawerHeaderContainer: { height: 40, justifyContent: 'center', alignItems: 'center'},
  drawerHandleContainer: { height: '100%', width: '100%', justifyContent: 'center', alignItems: 'center' },
  drawerHandle: { width: 40, height: 5, backgroundColor: '#ddd', borderRadius: 3, position: 'absolute', top: 8 },
  drawerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  drawerContent: { flex: 1 },
  drawerScrollContent: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 100 },
  routeCard: { flexDirection: 'row', alignItems: 'stretch', paddingLeft: 0, paddingVertical: 0, paddingRight: 15, borderRadius: 12, backgroundColor: '#f9f9f9', marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, borderWidth: 1, borderColor: 'transparent' },
  routeCardActive: { borderColor: '#4285F4', elevation: 4, backgroundColor: '#e9f5ff' },
  routeCardRecommended: { borderColor: '#00c853' },
  routeIndicator: { width: 10, marginRight: 15, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  routeInfo: { flex: 1, paddingVertical: 15 },
  routeTitleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  routeTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  recommendedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00c853', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  recommendedText: { fontSize: 12, color: '#fff', fontWeight: 'bold', marginLeft: 4 },
  routeDetails: { fontSize: 14, color: '#666' },
  doubleTapHint: { fontSize: 12, color: '#888', fontStyle: 'italic', marginTop: 4 },
  routeExtraInfo: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  routeEta: { fontSize: 14, color: '#444', fontWeight: '500' },
  loadingRoutesContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingRoutesText: { fontSize: 16, fontWeight: '500', color: '#333', marginTop: 15, textAlign: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  errorText: { fontSize: 16, color: '#d32f2f', textAlign: 'center', marginTop: 15, marginBottom: 20 },
  retryButton: { backgroundColor: '#4285F4', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  retryButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  safetyScoreContainer: { marginTop: 8 },
  safetyScoreText: { fontSize: 13, color: '#666', marginBottom: 4 },
  safetyBar: { height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, width: '50%' },
  safetyBarFill: { height: '100%', borderRadius: 3 },
});