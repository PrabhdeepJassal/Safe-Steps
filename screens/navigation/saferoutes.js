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
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function MapScreen() {
  const navigation = useNavigation();
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

  const searchTimeoutRef = useRef(null);

  const createAnimatedValue = (initialValue) => {
    try {
      return new Animated.Value(initialValue);
    } catch (e) {
      console.error('Failed to create Animated.Value:', e);
      return { setValue: () => {}, interpolate: () => '0' };
    }
  };

  const drawerTranslateY = useRef(createAnimatedValue(DRAWER_MIN_HEIGHT)).current;
  const drawerOpacity = useRef(createAnimatedValue(0)).current;
  const legendPosition = useRef(createAnimatedValue(170)).current;
  const handleRotation = useRef(createAnimatedValue(0)).current;
  const searchBarScale = useRef(createAnimatedValue(1)).current;
  const backdropOpacity = useRef(createAnimatedValue(0)).current;
  const suggestionsOpacity = useRef(createAnimatedValue(0)).current;

  const sampleRoutes = [
    { id: 1, title: 'Fastest Route', time: '25 min', distance: '12 km', color: '#00ff00', eta: '10:45 AM' },
    { id: 2, title: 'Shortest Route', time: '30 min', distance: '10 km', color: '#ffff00', eta: '10:50 AM' },
    { id: 3, title: 'Scenic Route', time: '35 min', distance: '15 km', color: '#ff8c00', eta: '10:55 AM' },
  ];
  const [routes, setRoutes] = useState(sampleRoutes);
  const routeCardScales = useRef(routes.map(() => createAnimatedValue(1))).current;

  // Get user's current location
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        // Use Delhi as default location
        setUserLocation({
          latitude: 28.6139,
          longitude: 77.2090
        });
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    } catch (error) {
      console.error('Error getting location:', error);
      // Use Delhi as fallback
      setUserLocation({
        latitude: 28.6139,
        longitude: 77.2090
      });
    }
  };

  // Function to call ML model API
  const fetchRoutesFromML = async (sourceCoords, destinationCoords) => {
    try {
      setIsLoadingRoutes(true);
      setRouteError(null);
      
      const requestBody = {
        source: {
          latitude: sourceCoords.latitude,
          longitude: sourceCoords.longitude
        },
        destination: {
          latitude: destinationCoords.latitude,
          longitude: destinationCoords.longitude
        }
      };

      console.log('Calling ML API with:', requestBody);

      const response = await fetch('https://d95e-2404-7c80-34-2c3e-a917-2471-a4f6-9b8f.ngrok-free.app/evaluate_routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('ML API Response:', data);

      // Transform ML response to match your route structure
      const transformedRoutes = data.routes?.map((route, index) => ({
        id: index + 1,
        title: route.route_name || `Route ${index + 1}`,
        time: route.estimated_time || 'N/A',
        distance: route.distance || 'N/A',
        color: getRouteColor(route.safety_score || 3),
        eta: calculateETA(route.estimated_time),
        safetyScore: route.safety_score || 3,
        coordinates: route.coordinates || [],
        traffic: route.traffic_level || 'moderate',
        toll: route.toll_cost || 0,
        ...route
      })) || [];

      if (transformedRoutes.length > 0) {
        setRoutes(transformedRoutes);
      } else {
        // Fallback to sample routes if no routes returned
        setRoutes(sampleRoutes);
      }

    } catch (error) {
      console.error('Error fetching routes from ML model:', error);
      setRouteError('Failed to fetch routes. Using default routes.');
      // Use sample routes as fallback
      setRoutes(sampleRoutes);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  // Helper function to determine route color based on safety score
  const getRouteColor = (safetyScore) => {
    switch(safetyScore) {
      case 1: return '#8b0000'; // Dark red - least safe
      case 2: return '#ff0000'; // Red
      case 3: return '#ff8c00'; // Orange
      case 4: return '#ffff00'; // Yellow
      case 5: return '#00ff00'; // Green - safest
      default: return '#ff8c00';
    }
  };

  // Helper function to calculate ETA
  const calculateETA = (estimatedTime) => {
    if (!estimatedTime) return 'N/A';
    
    const now = new Date();
    const timeInMinutes = parseInt(estimatedTime.replace(/\D/g, ''));
    const eta = new Date(now.getTime() + timeInMinutes * 60000);
    
    return eta.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const rotateArrow = handleRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Mock function to simulate location search API
  const searchLocations = async (query) => {
    if (query.length < 2) return [];
    
    setIsLoadingSuggestions(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock location data - replace with actual API call
    const mockLocations = [
      { id: 1, name: `${query} Metro Station`, address: 'Delhi Metro, New Delhi', coordinates: { lat: 28.6139, lng: 77.2090 } },
      { id: 2, name: `${query} Market`, address: 'Commercial Area, New Delhi', coordinates: { lat: 28.6129, lng: 77.2100 } },
      { id: 3, name: `${query} Mall`, address: 'Shopping Complex, New Delhi', coordinates: { lat: 28.6149, lng: 77.2080 } },
      { id: 4, name: `${query} Hospital`, address: 'Medical Center, New Delhi', coordinates: { lat: 28.6159, lng: 77.2070 } },
      { id: 5, name: `${query} Park`, address: 'Public Park, New Delhi', coordinates: { lat: 28.6119, lng: 77.2110 } },
    ];
    
    setIsLoadingSuggestions(false);
    return mockLocations.filter(location => 
      location.name.toLowerCase().includes(query.toLowerCase()) ||
      location.address.toLowerCase().includes(query.toLowerCase())
    );
  };

  const animateDrawerTo = (height, duration = 300) => {
    Animated.parallel([
      Animated.timing(handleRotation, {
        toValue: height > DRAWER_MIN_HEIGHT + 50 ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(drawerTranslateY, {
        toValue: height,
        friction: 8,
        tension: 40,
        useNativeDriver: false,
      }),
      Animated.timing(backdropOpacity, {
        toValue: height > DRAWER_MIN_HEIGHT ? 0.5 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(legendPosition, {
        toValue: height > DRAWER_MID_HEIGHT ? DRAWER_MAX_HEIGHT + 20 : 170,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start(() => {
      setDrawerHeight(height);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        const newHeight = Math.max(
          DRAWER_MIN_HEIGHT,
          Math.min(DRAWER_MAX_HEIGHT, drawerHeight - gestureState.dy)
        );
        drawerTranslateY.setValue(newHeight);
        backdropOpacity.setValue(
          Math.min(0.5, ((newHeight - DRAWER_MIN_HEIGHT) / (DRAWER_MAX_HEIGHT - DRAWER_MIN_HEIGHT)) * 0.5)
        );
        legendPosition.setValue(newHeight > DRAWER_MID_HEIGHT ? DRAWER_MAX_HEIGHT + 20 : 170);
      },
      onPanResponderRelease: (_, gestureState) => {
        const velocity = gestureState.vy;
        let targetHeight;

        if (velocity < -0.5) {
          targetHeight = DRAWER_MAX_HEIGHT;
        } else if (velocity > 0.5) {
          targetHeight = DRAWER_MIN_HEIGHT;
        } else {
          if (drawerHeight < (DRAWER_MIN_HEIGHT + DRAWER_MID_HEIGHT) / 2) {
            targetHeight = DRAWER_MIN_HEIGHT;
          } else if (drawerHeight < (DRAWER_MID_HEIGHT + DRAWER_MAX_HEIGHT) / 2) {
            targetHeight = DRAWER_MID_HEIGHT;
          } else {
            targetHeight = DRAWER_MAX_HEIGHT;
          }
        }
        animateDrawerTo(targetHeight);
      },
    })
  ).current;

  const handleSearch = async (text) => {
    setSearchQuery(text);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (text.length === 0) {
      setShowSuggestions(false);
      setSuggestions([]);
      setSelectedDestination(null);
      if (showDrawer) {
        setShowDrawer(false);
        Animated.timing(drawerOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          animateDrawerTo(DRAWER_MIN_HEIGHT);
        });
      }
      return;
    }

    setShowSuggestions(true);
    Animated.timing(suggestionsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Debounce the search
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
    
    // Hide suggestions
    Animated.timing(suggestionsOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Show drawer with loading state
    setShowDrawer(true);
    animateDrawerTo(DRAWER_MID_HEIGHT);
    Animated.timing(drawerOpacity, { 
      toValue: 1, 
      duration: 300, 
      useNativeDriver: true 
    }).start();

    Keyboard.dismiss();

    // Fetch routes from ML model if we have both source and destination
    if (userLocation && suggestion.coordinates) {
      await fetchRoutesFromML(userLocation, suggestion.coordinates);
    } else if (userLocation) {
      // If suggestion doesn't have coordinates, use mock coordinates
      const mockDestination = {
        latitude: suggestion.coordinates?.lat || 28.6139 + Math.random() * 0.1,
        longitude: suggestion.coordinates?.lng || 77.2090 + Math.random() * 0.1
      };
      await fetchRoutesFromML(userLocation, mockDestination);
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
    
    // Hide suggestions after a short delay to allow for selection
    setTimeout(() => {
      if (!selectedDestination && showSuggestions) {
        setShowSuggestions(false);
        Animated.timing(suggestionsOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }, 150);
  };

  const selectRoute = (route, index) => {
    const newActiveRoute = route.id === activeRoute ? null : route.id;
    setActiveRoute(newActiveRoute);

    Animated.sequence([
      Animated.timing(routeCardScales[index], { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(routeCardScales[index], { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start(() => {
      if (newActiveRoute) {
        navigation.navigate('NavigationScreen', { route, destination: selectedDestination });
      }
    });
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
      <Text style={styles.legendTitle}>Severity Level</Text>
      {[
        { level: 'Severity Level 5 (Highest)', color: '#8b0000' },
        { level: 'Severity Level 4', color: '#ff0000' },
        { level: 'Severity Level 3', color: '#ff8c00' },
        { level: 'Severity Level 2', color: '#ffff00' },
        { level: 'Severity Level 1 (Lowest)', color: '#00ff00' },
      ].map((item, index) => (
        <View key={index} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
          <Text style={styles.legendText}>{item.level}</Text>
        </View>
      ))}
    </Animated.View>
  );

  const renderRouteCard = (route, index) => (
    <Animated.View style={{ transform: [{ scale: routeCardScales[index] }] }}>
      <TouchableOpacity
        style={[styles.routeCard, activeRoute === route.id && styles.routeCardActive]}
        onPress={() => selectRoute(route, index)}
        activeOpacity={0.8}
      >
        <View style={[styles.routeIndicator, { backgroundColor: route.color }]} />
        <View style={styles.routeInfo}>
          <Text style={styles.routeTitle}>{route.title}</Text>
                        <Text style={styles.routeDetails}>{route.time} • {route.distance}</Text>
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

  const renderDrawer = () =>
    showDrawer && (
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
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  if (userLocation && selectedDestination) {
                    fetchRoutesFromML(userLocation, selectedDestination.coordinates);
                  }
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.drawerContent}>
              {routes.map((route, index) => renderRouteCard(route, index))}
              <TouchableOpacity style={styles.startButton}>
                <Ionicons name="navigate" size={20} color="#fff" />
                <Text style={styles.startButtonText}>Start Navigation</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    );

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={DELHI_REGION}
        showsUserLocation
        showsMyLocationButton
      />
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
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  searchWrapper: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 3,
  },
  searchContainer: {
    zIndex: 3,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    elevation: 5,
  },
  searchBarFocused: { 
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 17.5,
    opacity: 0.6,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    maxHeight: 250,
  },
  suggestionsList: {
    maxHeight: 250,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  suggestionAddress: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  legendContainer: {
    position: 'absolute',
    left: 15,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    elevation: 5,
    zIndex: 2,
    marginBottom: -50,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: { fontSize: 12 },
  drawerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 6,
    zIndex: 2,
  },
  drawerHeaderContainer: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  drawerHandleContainer: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  drawerHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ddd',
    borderRadius: 3,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 50,
    marginBottom: 10,
  },
  drawerActions: {
    flexDirection: 'row',
    marginTop: 50,
    marginBottom: 10,
  },
  drawerAction: {
    padding: 8,
    marginLeft: 10,
  },
  drawerContent: {
    padding: 20,
    flex: 1,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    marginBottom: 10,
    elevation: 2,
  },
  routeCardActive: {
    backgroundColor: '#fff',
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  routeIndicator: {
    width: 8,
    height: 40,
    borderRadius: 4,
    marginRight: 15,
  },
  routeInfo: { flex: 1 },
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
  startButton: {
    backgroundColor: '#4285F4',
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  loadingRoutesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingRoutesText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginTop: 15,
    textAlign: 'center',
  },
  loadingSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
});