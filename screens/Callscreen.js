import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Image, PermissionsAndroid, 
  Platform, ScrollView, Linking, ActivityIndicator, RefreshControl 
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { Ionicons } from '@expo/vector-icons';
import * as IntentLauncher from 'expo-intent-launcher';

const HomeScreen = ({ navigation }) => {
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // 🔄 Pull-to-refresh state

  useEffect(() => {
    checkLocationEnabled();
  }, []);

  // Function to check if location is enabled
  const checkLocationEnabled = async () => {
    setLoading(true); 
    
    // Set a timeout to prevent getting stuck in loading state
    const timeoutId = setTimeout(() => {
      setLocationEnabled(false);
      setLoading(false);
    }, 6000); // 6 seconds timeout
    
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
    
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          Geolocation.getCurrentPosition(
            (position) => {
              clearTimeout(timeoutId);
              setLocationEnabled(true);
              setLoading(false);
            },
            (error) => {
              clearTimeout(timeoutId);
              setLocationEnabled(false);
              setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 1000 }
          );
        } else {
          clearTimeout(timeoutId);
          setLocationEnabled(false);
          setLoading(false);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        setLocationEnabled(false);
        setLoading(false);
      }
    } else {
      Geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          setLocationEnabled(true);
          setLoading(false);
        },
        (error) => {
          clearTimeout(timeoutId);
          setLocationEnabled(false);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 1000 }
      );
    }
  };

  // Function to refresh the screen when pulled down
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    checkLocationEnabled();
    setTimeout(() => {
      setRefreshing(false);
    }, 1500); // Simulating a refresh delay
  }, []);

  // Function to open location settings
  const openLocationSettings = () => {
    if (Platform.OS === 'android') {
      IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS);
    } else {
      Linking.openSettings();
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent} 
      keyboardShouldPersistTaps="handled"
      refreshControl={ // 🔄 Adds pull-to-refresh animation
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#ff4444"]} />
      }
    >
      {/* Loading Indicator */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff4444" />
          <Text style={styles.loadingText}>Checking location...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.header}>Personal Safety</Text>

          {/* Get Help Fast Section */}
          <Text style={styles.sectionTitle}>Get help fast</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => navigation.navigate('EmergencySharing')}
            >
              <Ionicons name="warning" size={24} color="#ff4444" style={styles.icon} />
              <Text style={styles.buttonText}>Emergency Sharing</Text>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => navigation.navigate('Call112')}
            >
              <Ionicons name="call" size={24} color="#ff4444" style={styles.icon} />
              <Text style={styles.buttonText}>Call 112</Text>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Take Action Section - Only show when location is OFF */}
          {!locationEnabled && (
            <>
              <Text style={styles.sectionTitle}>Take action</Text>
              <View style={styles.warningCard}>
                <Ionicons name="warning" size={24} color="#ff4444" style={styles.warningIcon} />
                <Text style={styles.warningText}>Can't share your location</Text>
                <Text style={styles.warningSubText}>
                  Turn on device location to share where you are with emergency contacts.
                </Text>
                <TouchableOpacity style={styles.settingsButton} onPress={openLocationSettings}>
                  <Text style={styles.settingsButtonText}>Settings</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Be Prepared Section */}
          <Text style={styles.sectionTitle}>Be prepared</Text>
          <TouchableOpacity 
            style={styles.safetyCheckButton}
            onPress={() => navigation.navigate('SafetyCheck')}
          >
            <Ionicons name="shield-checkmark" size={24} color="#ff4444" style={styles.safetyCheckIcon} />
            <Text style={styles.safetyCheckText}>Safety Check</Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require('../assets/images/safesteps illustration.png')}
              style={styles.illustration}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  scrollContent: {
    paddingBottom: 40, 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 600,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  warningCard: {
    backgroundColor: '#ffe6e6',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  warningIcon: {
    marginBottom: 10,
  },
  warningText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  warningSubText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  settingsButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  illustrationContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
  },
  illustration: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  safetyCheckButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    justifyContent: 'space-between',
    elevation: 6,
  },
  safetyCheckIcon: {
    marginRight: 10,
  },
  safetyCheckText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default HomeScreen;