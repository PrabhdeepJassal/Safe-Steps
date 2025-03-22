import React, { useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Animated, PanResponder, Dimensions, TouchableOpacity, Easing, Keyboard } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

export default function MapScreen() {
  const DELHI_REGION = {
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  };

  // Get screen dimensions
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  
  // Define drawer snap points
  const DRAWER_MIN_HEIGHT = 100;
  const DRAWER_MID_HEIGHT = SCREEN_HEIGHT * 0.4;
  const DRAWER_MAX_HEIGHT = SCREEN_HEIGHT * 0.8;

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [activeRoute, setActiveRoute] = useState(null);
  const [drawerHeight, setDrawerHeight] = useState(DRAWER_MIN_HEIGHT);

  // Animation values that can use native driver
  const drawerTranslateY = useRef(new Animated.Value(0)).current;
  const drawerOpacity = useRef(new Animated.Value(0)).current;
  const legendPosition = useRef(new Animated.Value(170)).current;
  const handleRotation = useRef(new Animated.Value(0)).current;
  
  // Convert rotation value to interpolated string for transform
  const rotateArrow = handleRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Animate drawer to specific height
  const animateDrawerTo = (height, duration = 300) => {
    // Determine if drawer is expanding or collapsing
    const isExpanding = height > drawerHeight;
    
    // Update handle rotation based on drawer state
    Animated.timing(handleRotation, {
      toValue: height > DRAWER_MIN_HEIGHT + 50 ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    // Update drawer height state
    setDrawerHeight(height);
  };

  // Calculate translateY based on drawer position
  const getTranslateY = () => {
    const maxTranslate = DRAWER_MAX_HEIGHT - DRAWER_MIN_HEIGHT;
    const currentTranslate = Math.max(0, Math.min(maxTranslate, drawerHeight - DRAWER_MIN_HEIGHT));
    return maxTranslate - currentTranslate;
  };

  // PanResponder for drawer gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Update drawer height through state instead of animated value
        const newHeight = Math.max(
          DRAWER_MIN_HEIGHT, 
          Math.min(DRAWER_MAX_HEIGHT, drawerHeight - gestureState.dy)
        );
        setDrawerHeight(newHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        const velocity = gestureState.vy;
        
        // Determine which snap point to use based on velocity and current position
        if (velocity < -0.5) {
          // Fast upward swipe - go to max height
          animateDrawerTo(DRAWER_MAX_HEIGHT);
        } else if (velocity > 0.5) {
          // Fast downward swipe - go to min height
          animateDrawerTo(DRAWER_MIN_HEIGHT);
        } else {
          // Slower movement - snap to closest point
          if (drawerHeight < (DRAWER_MIN_HEIGHT + DRAWER_MID_HEIGHT) / 2) {
            animateDrawerTo(DRAWER_MIN_HEIGHT);
          } else if (drawerHeight < (DRAWER_MID_HEIGHT + DRAWER_MAX_HEIGHT) / 2) {
            animateDrawerTo(DRAWER_MID_HEIGHT);
          } else {
            animateDrawerTo(DRAWER_MAX_HEIGHT);
          }
        }
      },
    })
  ).current;

  // Sample route data
  const sampleRoutes = [
    { id: 1, title: 'Fastest Route', time: '25 min', distance: '12 km', color: '#00ff00', eta: '10:45 AM' },
    { id: 2, title: 'Shortest Route', time: '30 min', distance: '10 km', color: '#ffff00', eta: '10:50 AM' },
    { id: 3, title: 'Scenic Route', time: '35 min', distance: '15 km', color: '#ff8c00', eta: '10:55 AM' },
  ];

  // Handle search input changes
  const handleSearch = (text) => {
    setSearchQuery(text);
    const shouldShowDrawer = text.length > 0;
    
    if (shouldShowDrawer !== showDrawer) {
      setShowDrawer(shouldShowDrawer);
      
      // Animate the drawer appearance/disappearance
      if (shouldShowDrawer) {
        setDrawerHeight(DRAWER_MID_HEIGHT);
        Animated.timing(drawerOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(drawerOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (searchQuery.length > 0 && !showDrawer) {
      setShowDrawer(true);
      animateDrawerTo(DRAWER_MID_HEIGHT);
      Animated.timing(drawerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  // Select a route
  const selectRoute = (route) => {
    setActiveRoute(route.id === activeRoute ? null : route.id);
  };

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Enter Destination"
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={handleSearch}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
        />
        <Ionicons name="mic" size={20} color="#666" />
      </View>
    </View>
  );

  const renderSeverityLegend = () => (
    <View 
      style={[styles.legendContainer, { bottom: 170 }]}
    >
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
    </View>
  );

  const renderRouteCard = (route) => (
    <TouchableOpacity 
      key={route.id} 
      style={[
        styles.routeCard,
        activeRoute === route.id && styles.routeCardActive
      ]}
      onPress={() => selectRoute(route)}
      activeOpacity={0.8}
    >
      <View style={[styles.routeIndicator, { backgroundColor: route.color }]} />
      <View style={styles.routeInfo}>
        <Text style={styles.routeTitle}>{route.title}</Text>
        <Text style={styles.routeDetails}>{route.time} • {route.distance}</Text>
        {activeRoute === route.id && (
          <View style={styles.routeExtraInfo}>
            <Text style={styles.routeEta}>ETA: {route.eta}</Text>
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
        )}
      </View>
      <Ionicons 
        name={activeRoute === route.id ? "chevron-up" : "chevron-down"} 
        size={20} 
        color="#666" 
      />
    </TouchableOpacity>
  );

  const renderDrawer = () => {
    if (!showDrawer) return null;

    return (
      <Animated.View 
        style={[
          styles.drawerContainer, 
          { 
            height: drawerHeight,
            opacity: drawerOpacity,
            transform: [
              { 
                translateY: drawerOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0]
                })
              }
            ]
          }
        ]}
      >
        <View style={styles.drawerHeaderContainer}>
          <View 
            style={styles.drawerHandleContainer}
            {...panResponder.panHandlers}
          >
            <View style={styles.drawerHandle} />
            <Animated.View style={{ transform: [{ rotate: rotateArrow }], marginTop: 8 }}>
              <Ionicons name="chevron-up" size={20} color="#666" />
            </Animated.View>
          </View>
          
          <Text style={styles.drawerTitle}>Routes to {searchQuery}</Text>
          
          <View style={styles.drawerActions}>
            <TouchableOpacity style={styles.drawerAction}>
              <Ionicons name="options-outline" size={22} color="#555" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerAction}>
              <Ionicons name="share-social-outline" size={22} color="#555" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.drawerContent}>
          {sampleRoutes.map(route => renderRouteCard(route))}
          
          <TouchableOpacity style={styles.startButton}>
            <Ionicons name="navigate" size={20} color="#fff" />
            <Text style={styles.startButtonText}>Start Navigation</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
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
      {renderSearchBar()}
      {renderSeverityLegend()}
      {renderDrawer()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  legendContainer: {
    position: 'absolute',
    marginBottom: -80,
    left: 15,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
  legendText: {
    fontSize: 12,
  },
  drawerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
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
    marginLeft: 0,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  routeCardActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  routeIndicator: {
    width: 8,
    height: '100%',
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
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});