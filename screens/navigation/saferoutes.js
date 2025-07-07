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

export default function MapScreen() {
  const navigation = useNavigation();
  const mapRef = useRef(null);
  
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

  const searchTimeoutRef = useRef(null);
  const drawerTranslateY = useRef(new Animated.Value(DRAWER_MIN_HEIGHT)).current;
  const drawerOpacity = useRef(new Animated.Value(0)).current;
  const legendPosition = useRef(new Animated.Value(170)).current;
  const handleRotation = useRef(new Animated.Value(0)).current;
  const searchBarScale = useRef(new Animated.Value(1)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const suggestionsOpacity = useRef(new Animated.Value(0)).current;
  const [routeCardScales, setRouteCardScales] = useState([]);

  // Double-tap tracking
  const [lastTapTime, setLastTapTime] = useState(0);
  const [lastTapRouteId, setLastTapRouteId] = useState(null);
  const DOUBLE_TAP_DELAY = 300; // milliseconds

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUserLocation({ latitude: 28.6139, longitude: 77.2090 });
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
    } catch (error) {
      console.error('Error getting location:', error);
      setUserLocation({ latitude: 28.6139, longitude: 77.2090 });
    }
  };

  const getTimeCategory = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return "Morning";
    if (hour >= 12 && hour < 17) return "Afternoon";
    if (hour >= 17 && hour < 21) return "Evening";
    return "Night";
  };

  const formatTime = (timeValue) => {
    if (!timeValue) return 'N/A';
    if (typeof timeValue === 'string') {
      if (timeValue.includes('min') || timeValue.includes('hour')) return timeValue;
      const numericValue = parseFloat(timeValue);
      if (!isNaN(numericValue)) {
        return numericValue >= 60 
          ? `${Math.round(numericValue / 60)} hr ${Math.round(numericValue % 60)} min`
          : `${Math.round(numericValue)} min`;
      }
    }
    if (typeof timeValue === 'number') {
      return timeValue >= 60 
        ? `${Math.round(timeValue / 60)} hr ${Math.round(timeValue % 60)} min`
        : `${Math.round(timeValue)} min`;
    }
    return 'N/A';
  };

  const formatDistance = (distanceValue) => {
    if (!distanceValue) return 'N/A';
    if (typeof distanceValue === 'string') {
      if (distanceValue.includes('km') || distanceValue.includes('m')) return distanceValue;
      const numericValue = parseFloat(distanceValue);
      if (!isNaN(numericValue)) {
        return numericValue >= 1 
          ? `${numericValue.toFixed(1)} km`
          : `${Math.round(numericValue * 1000)} m`;
      }
    }
    if (typeof distanceValue === 'number') {
      return distanceValue >= 1 
        ? `${distanceValue.toFixed(1)} km`
        : `${Math.round(distanceValue * 1000)} m`;
    }
    return 'N/A';
  };

  const getRouteColor = (safetyScore, isRecommended = false) => {
    if (isRecommended) return '#00ff00'; // Green for recommended route
    if (typeof safetyScore === 'string') safetyScore = parseFloat(safetyScore) || 3;
    if (safetyScore > 5) safetyScore = Math.min(5, safetyScore / 2);
    switch(Math.round(safetyScore)) {
      case 1: return '#8b0000';
      case 2: return '#ff0000';
      case 3: return '#ff8c00';
      case 4: return '#ffff00';
      case 5: return '#00ff00';
      default: return '#ff8c00';
    }
  };

  const calculateETA = (estimatedTime) => {
    if (!estimatedTime) return 'N/A';
    let timeInMinutes = 0;
    if (typeof estimatedTime === 'string') {
      const numbers = estimatedTime.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        timeInMinutes = parseInt(numbers[0]);
        if (estimatedTime.toLowerCase().includes('hour') || estimatedTime.toLowerCase().includes('hr')) {
          timeInMinutes *= 60;
          if (numbers.length > 1) timeInMinutes += parseInt(numbers[1]);
        }
      }
    } else if (typeof estimatedTime === 'number') {
      timeInMinutes = Math.round(estimatedTime);
    }
    if (timeInMinutes === 0) return 'N/A';
    const now = new Date();
    const eta = new Date(now.getTime() + timeInMinutes * 60000);
    return eta.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const parseCoordinates = (coordinates) => {
    if (!coordinates) return [];
    try {
      if (Array.isArray(coordinates)) {
        return coordinates.map(coord => {
          if (Array.isArray(coord) && coord.length >= 2) {
            return { latitude: parseFloat(coord[0]), longitude: parseFloat(coord[1]) };
          } else if (coord.latitude !== undefined && coord.longitude !== undefined) {
            return { latitude: parseFloat(coord.latitude), longitude: parseFloat(coord.longitude) };
          } else if (coord.lat !== undefined && coord.lng !== undefined) {
            return { latitude: parseFloat(coord.lat), longitude: parseFloat(coord.lng) };
          }
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

  const fetchRoutesFromML = async (sourceCoords, destinationCoords) => {
    try {
      setIsLoadingRoutes(true);
      setRouteError(null);
      const requestBody = {
        source: [sourceCoords.latitude, sourceCoords.longitude],
        destination: [destinationCoords.latitude, destinationCoords.longitude],
        time_category: getTimeCategory()
      };
      const response = await fetch('https://1753-2404-7c80-34-2db0-f974-12f9-37b4-c072.ngrok-free.app/evaluate_routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      let routesArray = [];
      if (data.routes && Array.isArray(data.routes)) routesArray = data.routes;
      else if (Array.isArray(data)) routesArray = data;
      else if (data.route_options && Array.isArray(data.route_options)) routesArray = data.route_options;
      else if (data.predictions && Array.isArray(data.predictions)) routesArray = data.predictions;
      else {
        const possibleArrays = Object.values(data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) routesArray = possibleArrays[0];
        else throw new Error('No route array found in ML model response');
      }
      const transformedRoutes = routesArray.map((route, index) => {
        const parsedCoordinates = parseCoordinates(route.coordinates || route.path || route.route_coordinates);
        const isRecommended = route.recommended || (index === 0 && !routesArray.some(r => r.recommended));
        return {
          id: index + 1,
          title: route.route_name || route.name || `Route ${index + 1}`,
          time: formatTime(route.estimated_time || route.duration || route.time),
          distance: formatDistance(route.distance),
          color: getRouteColor(route.safety_score || route.safety || 3, isRecommended),
          eta: calculateETA(route.estimated_time || route.duration || route.time),
          safetyScore: route.safety_score || route.safety || 3,
          coordinates: parsedCoordinates,
          traffic: route.traffic_level || route.traffic || 'moderate',
          toll: route.toll_cost || route.toll || 0,
          severity: route.severity_level || route.severity || 3,
          recommended: isRecommended,
          ...route
        };
      });
      const sortedRoutes = transformedRoutes.sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0));
      if (sortedRoutes.length > 0) {
        setRoutes(sortedRoutes);
        setMapRoutes(sortedRoutes.filter(route => route.coordinates && route.coordinates.length > 0));
        setRouteCardScales(sortedRoutes.map(() => new Animated.Value(1)));
      } else {
        setRoutes([]);
        setMapRoutes([]);
        setRouteCardScales([]);
      }
    } catch (error) {
      console.error('Error fetching routes from ML model:', error);
      setRouteError(`Failed to fetch routes: ${error.message}`);
      setRoutes([]);
      setMapRoutes([]);
      setRouteCardScales([]);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const rotateArrow = handleRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const searchLocations = async (query) => {
    if (query.length < 2) return [];
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(
        `https://us1.locationiq.com/v1/search.php?key=pk.3f47acbcb5c3b22bb27aa511ed68c9b0&q=${encodeURIComponent(query)}&format=json&limit=5`
      );
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      const transformedResults = data.map((item, index) => ({
        id: index + 1,
        name: item.display_name.split(',')[0],
        address: item.display_name,
        coordinates: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) }
      }));
      setIsLoadingSuggestions(false);
      return transformedResults;
    } catch (error) {
      console.error('Error searching locations:', error);
      setIsLoadingSuggestions(false);
      return [];
    }
  };

  const animateDrawerTo = (height, duration = 300) => {
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

  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (text.length === 0) {
      setShowSuggestions(false);
      setSuggestions([]);
      setSelectedDestination(null);
      setMapRoutes([]);
      setActiveRoute(null);
      if (showDrawer) {
        setShowDrawer(false);
        Animated.timing(drawerOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => animateDrawerTo(DRAWER_MIN_HEIGHT));
      }
      return;
    }
    setShowSuggestions(true);
    Animated.timing(suggestionsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(text);
        setSuggestions(results);
      } catch (error) {
        console.error('Error searching locations:', error);
        setSuggestions([]);
      }
    }, 300);
  };

  const handleSuggestionSelect = async (suggestion) => {
    setSearchQuery(suggestion.name);
    setSelectedDestination(suggestion);
    setShowSuggestions(false);
    Animated.timing(suggestionsOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    setShowDrawer(true);
    animateDrawerTo(DRAWER_MID_HEIGHT);
    Animated.timing(drawerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    Keyboard.dismiss();
    if (userLocation && suggestion.coordinates) {
      await fetchRoutesFromML(userLocation, { latitude: suggestion.coordinates.lat, longitude: suggestion.coordinates.lng });
    }
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (searchQuery.length > 0 && !showDrawer) {
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
      if (!selectedDestination && showSuggestions) {
        setShowSuggestions(false);
        Animated.timing(suggestionsOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      }
    }, 150);
  };

  const selectRoute = (route, index) => {
    const currentTime = new Date().getTime();
    
    // Check if it's a double-tap
    if (
      lastTapRouteId === route.id &&
      currentTime - lastTapTime < DOUBLE_TAP_DELAY
    ) {
      // Double-tap detected - navigate to navigation screen
      startNavigation(route);
      return;
    }
    
    // Single tap - toggle route selection
    setLastTapTime(currentTime);
    setLastTapRouteId(route.id);
    
    const newActiveRoute = route.id === activeRoute ? null : route.id;
    setActiveRoute(newActiveRoute);
    
    Animated.sequence([
      Animated.timing(routeCardScales[index], { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(routeCardScales[index], { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  };

  const startNavigation = (route) => {
    if (!route) {
      console.error('No route selected for navigation');
      return;
    }
    navigation.navigate('usernavigation', { route, destination: selectedDestination, userLocation });
  };

  const retryFetchRoutes = () => {
    if (userLocation && selectedDestination) {
      const destinationCoords = {
        latitude: selectedDestination.coordinates?.lat || selectedDestination.coordinates?.latitude,
        longitude: selectedDestination.coordinates?.lng || selectedDestination.coordinates?.longitude
      };
      fetchRoutesFromML(userLocation, destinationCoords);
    }
  };

  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionSelect(item)}
      activeOpacity={0.7}
    >
      <Ionicons name="location-outline" size={20} color="#666" style={styles.suggestionIcon} />
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionName}>{item.name}</Text>
        <Text style={styles.suggestionAddress}>{item.address}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSearchBar = () => (
    <View style={styles.searchWrapper}>
      <Animated.View style={[styles.searchContainer, { transform: [{ scale: searchBarScale }] }]}>
        <View style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Enter Destination"
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={handleSearch}
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
          />
          <Ionicons name="mic" size={20} color="#666" />
        </View>
      </Animated.View>
      {showSuggestions && (
        <Animated.View style={[styles.suggestionsContainer, { opacity: suggestionsOpacity }]}>
          {isLoadingSuggestions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#666" />
              <Text style={styles.loadingText}>Searching locations...</Text>
            </View>
          ) : (
            <FlatList
              data={suggestions}
              renderItem={renderSuggestionItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </Animated.View>
      )}
    </View>
  );

  const renderSeverityLegend = () => (
    <Animated.View style={[styles.legendContainer, { bottom: legendPosition }]}>
      <Text style={styles.legendTitle}>Safety Level</Text>
      {[
        { level: 'Level 5 (Safest)', color: '#00ff00' },
        { level: 'Level 4', color: '#ffff00' },
        { level: 'Level 3', color: '#ff8c00' },
        { level: 'Level 2', color: '#ff0000' },
        { level: 'Level 1 (Least Safe)', color: '#8b0000' },
      ].map((item, index) => (
        <View key={index} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
          <Text style={styles.legendText}>{item.level}</Text>
        </View>
      ))}
    </Animated.View>
  );

  const renderRouteCard = (route, index) => (
    <Animated.View style={{ transform: [{ scale: routeCardScales[index] || new Animated.Value(1) }] }}>
      <TouchableOpacity
        style={[
          styles.routeCard,
          activeRoute === route.id && styles.routeCardActive,
          route.recommended && styles.routeCardRecommended
        ]}
        onPress={() => selectRoute(route, index)}
        activeOpacity={0.8}
      >
        <View style={[styles.routeIndicator, { backgroundColor: route.color }]} />
        <View style={styles.routeInfo}>
          <View style={styles.routeTitleContainer}>
            <Text style={styles.routeTitle}>{route.title}</Text>
            {route.recommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>Recommended</Text>
              </View>
            )}
          </View>
          <Text style={styles.routeDetails}>{route.time} • {route.distance}</Text>
          <Text style={styles.doubleTapHint}>Double-tap to navigate</Text>
          {route.safetyScore && (
            <View style={styles.safetyScoreContainer}>
              <Text style={styles.safetyScoreText}>
                Safety Score: {route.safetyScore}/5
              </Text>
              <View style={styles.safetyStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= route.safetyScore ? "star" : "star-outline"}
                    size={14}
                    color={star <= route.safetyScore ? "#FFD700" : "#ddd"}
                  />
                ))}
              </View>
            </View>
          )}
          {activeRoute === route.id && (
            <View style={styles.routeExtraInfo}>
              <Text style={styles.routeEta}>ETA: {route.eta}</Text>
              <View style={styles.routeTags}>
                <View style={styles.routeTag}>
                  <Ionicons name="car-outline" size={12} color="#444" />
                  <Text style={styles.routeTagText}>{route.traffic || 'Low Traffic'}</Text>
                </View>
                <View style={styles.routeTag}>
                  <Ionicons name="pricetag-outline" size={12} color="#444" />
                  <Text style={styles.routeTagText}>₹{route.toll || '50'} Toll</Text>
                </View>
              </View>
            </View>
          )}
        </View>
        <Ionicons
          name={activeRoute === route.id ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#666"
        />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderDrawer = () => showDrawer && (
    <Animated.View style={[styles.drawerContainer, { height: drawerTranslateY }]}>
      <View style={styles.drawerHeaderContainer}>
        <View style={styles.drawerHandleContainer} {...panResponder.panHandlers}>
          <View style={styles.drawerHandle} />
          <Animated.View style={{ transform: [{ rotate: rotateArrow }], marginTop: 8 }}>
            <Ionicons name="chevron-up" size={20} color="#666" />
          </Animated.View>
        </View>
        <Text style={styles.drawerTitle}>Routes to {selectedDestination?.name || searchQuery}</Text>
        <View style={styles.drawerActions}>
          <TouchableOpacity style={styles.drawerAction}>
            <Ionicons name="options-outline" size={22} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerAction}>
            <Ionicons name="share-social-outline" size={22} color="#555" />
          </TouchableOpacity>
        </View>
      </View>
      <Animated.View style={{ opacity: drawerOpacity, flex: 1 }}>
        {isLoadingRoutes ? (
          <View style={styles.loadingRoutesContainer}>
            <ActivityIndicator size="large" color="#4285F4" />
            <Text style={styles.loadingRoutesText}>Analyzing routes for safety...</Text>
            <Text style={styles.loadingSubText}>This may take a few seconds</Text>
          </View>
        ) : routeError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={48} color="#ff6b6b" />
            <Text style={styles.errorText}>{routeError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={retryFetchRoutes}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : routes.length === 0 ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No routes available</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.drawerContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.drawerScrollContent}
          >
            {routes.map((route, index) => (
              <View key={route.id}>{renderRouteCard(route, index)}</View>
            ))}
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
        showsUserLocation
        showsMyLocationButton
      >
        {mapRoutes.map((route, index) => (
          <Polyline
            key={index}
            coordinates={route.coordinates}
            strokeColor={route.color}
            strokeWidth={4}
          />
        ))}
        {selectedDestination && selectedDestination.coordinates && (
          <Marker
            coordinate={{
              latitude: selectedDestination.coordinates.lat || selectedDestination.coordinates.latitude,
              longitude: selectedDestination.coordinates.lng || selectedDestination.coordinates.longitude,
            }}
            title={selectedDestination.name}
            description={selectedDestination.address}
          />
        )}
      </MapView>
      <View style={styles.overlayContainer} pointerEvents="box-none">
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} pointerEvents={showDrawer ? 'auto' : 'none'} />
        {renderSearchBar()}
        {renderSeverityLegend()}
        {renderDrawer()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  map: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, position: 'absolute', top: 0, left: 0 },
  overlayContainer: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'black' },
  searchWrapper: { position: 'absolute', top: 50, left: 20, right: 20, zIndex: 3 },
  searchContainer: { zIndex: 3 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 10, elevation: 5 },
  searchBarFocused: { elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
  searchInput: { flex: 1, marginHorizontal: 10, fontSize: 17.5, opacity: 0.6 },
  suggestionsContainer: { backgroundColor: '#fff', borderRadius: 12, marginTop: 8, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, maxHeight: 250 },
  suggestionsList: { maxHeight: 250 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  suggestionIcon: { marginRight: 12 },
  suggestionContent: { flex: 1 },
  suggestionName: { fontSize: 16, fontWeight: '500', color: '#333', marginBottom: 2 },
  suggestionAddress: { fontSize: 14, color: '#666' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  loadingText: { marginLeft: 10, fontSize: 14, color: '#666' },
  legendContainer: { position: 'absolute', left: 15, backgroundColor: '#fff', padding: 10, borderRadius: 8, elevation: 5, zIndex: 2, marginBottom: -50 },
  legendTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  legendText: { fontSize: 12 },
  drawerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 6, zIndex: 2 },
  drawerHeaderContainer: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  drawerHandleContainer: { height: 50, justifyContent: 'center', alignItems: 'center', position: 'absolute', top: 0, left: 0, right: 0 },
  drawerHandle: { width: 40, height: 5, backgroundColor: '#ddd', borderRadius: 3 },
  drawerTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 50, marginBottom: 10 },
  drawerActions: { flexDirection: 'row', marginTop: 50, marginBottom: 10 },
  drawerAction: { padding: 8, marginLeft: 10 },
  drawerContent: { padding: 20, flex: 1 },
  routeCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, backgroundColor: '#f8f8f8', marginBottom: 10, elevation: 2 },
  routeCardActive: { backgroundColor: '#fff', elevation: 4, borderWidth: 1, borderColor: '#f0f0f0' },
  routeCardRecommended: { backgroundColor: '#e6ffe6', borderWidth: 1, borderColor: '#00ff00' },
  routeIndicator: { width: 8, height: 40, borderRadius: 4, marginRight: 15 },
  routeInfo: { flex: 1 },
  routeTitleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  routeTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  recommendedBadge: { backgroundColor: '#00ff00', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  recommendedText: { fontSize: 12, color: '#fff', fontWeight: '500' },
  routeDetails: { fontSize: 14, color: '#666' },
  routeExtraInfo: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  routeEta: { fontSize: 14, color: '#444', fontWeight: '500', marginBottom: 5 },
  routeTags: { flexDirection: 'row', flexWrap: 'wrap' },
  routeTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8, marginTop: 5 },
  routeTagText: { fontSize: 12, color: '#444', marginLeft: 4 },
  loadingRoutesContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingRoutesText: { fontSize: 16, fontWeight: '500', color: '#333', marginTop: 15, textAlign: 'center' },
  loadingSubText: { fontSize: 14, color: '#666', marginTop: 5, textAlign: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  errorText: { fontSize: 16, color: '#ff6b6b', textAlign: 'center', marginTop: 15, marginBottom: 20 },
  retryButton: { backgroundColor: '#4285F4', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  safetyScoreContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  safetyScoreText: { fontSize: 13, color: '#666', marginRight: 8 },
  safetyStars: { flexDirection: 'row' },
  drawerScrollContent: { paddingBottom: 20, flexGrow: 1 },
});