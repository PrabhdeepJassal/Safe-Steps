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
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

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

  const sampleRoutes = [
    { id: 1, title: 'Fastest Route', time: '25 min', distance: '12 km', color: '#00ff00', eta: '10:45 AM' },
    { id: 2, title: 'Shortest Route', time: '30 min', distance: '10 km', color: '#ffff00', eta: '10:50 AM' },
    { id: 3, title: 'Scenic Route', time: '35 min', distance: '15 km', color: '#ff8c00', eta: '10:55 AM' },
  ];
  const routeCardScales = useRef(sampleRoutes.map(() => createAnimatedValue(1))).current;

  const rotateArrow = handleRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

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

  const handleSearch = (text) => {
    setSearchQuery(text);
    const shouldShowDrawer = text.length > 0;

    if (shouldShowDrawer !== showDrawer) {
      setShowDrawer(shouldShowDrawer);
      if (shouldShowDrawer) {
        animateDrawerTo(DRAWER_MID_HEIGHT);
        Animated.timing(drawerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      } else {
        Animated.timing(drawerOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          animateDrawerTo(DRAWER_MIN_HEIGHT);
        });
      }
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
  };

  const selectRoute = (route, index) => {
    const newActiveRoute = route.id === activeRoute ? null : route.id;
    setActiveRoute(newActiveRoute);

    Animated.sequence([
      Animated.timing(routeCardScales[index], { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(routeCardScales[index], { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start(() => {
      if (newActiveRoute) {
        navigation.navigate('NavigationScreen', { route });
      }
    });
  };

  const renderSearchBar = () => (
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
        <Animated.View style={{ opacity: drawerOpacity, flex: 1 }}>
          <View style={styles.drawerContent}>
            {sampleRoutes.map((route, index) => renderRouteCard(route, index))}
            <TouchableOpacity style={styles.startButton}>
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={styles.startButtonText}>Start Navigation</Text>
            </TouchableOpacity>
          </View>
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
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 2,
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
  searchBarFocused: { elevation: 8 },
  searchInput: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 17.5,
    opacity: 0.6,
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
    marginratoon: 10,
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
});