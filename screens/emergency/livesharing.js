//this screen naviagtes from the callscreen (aka safetycheck procedure)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Platform,
  Linking,
  Animated,
  Modal,        // Added
  TextInput,    // Added
  Vibration,    // Added
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Added

const PIN_STORAGE_KEY = '@user_security_pin';
const DEFAULT_PIN = '1234';

const LiveSharingScreen = ({ navigation, route }) => {
  const { contacts, reason, duration } = route.params || {};

  const [timeLeft, setTimeLeft] = useState(0);
  const [isSharing, setIsSharing] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [smsActionTaken, setSmsActionTaken] = useState(false);

  // --- Safety Check State ---
  const [isSafetyModalVisible, setIsSafetyModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [securityPin, setSecurityPin] = useState(DEFAULT_PIN);
  const [countdown, setCountdown] = useState(30);
  const countdownTimerRef = useRef(null);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // --- Utility Functions ---

  const parseDurationToSeconds = (durationString) => {
    if (!durationString) return 0;
    const parts = durationString.split(' ');
    const value = parseInt(parts[0], 10);
    if (isNaN(value)) return 0;
    if (parts[1]?.includes('hour')) return value * 3600;
    if (parts[1]?.includes('minute')) return value * 60;
    return 0;
  };

  const formatTime = (seconds) => {
    if (seconds < 0) seconds = 0;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Core Logic ---

  useEffect(() => {
    // Start pulsing animation for the status icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Timer countdown effect
  useEffect(() => {
    if (!isSharing) return;

    const totalSeconds = parseDurationToSeconds(duration);
    setTimeLeft(totalSeconds);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsSharing(false);
          Alert.alert('Sharing Ended', 'The live sharing session has ended.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSharing, duration, navigation]);

  // Location tracking effect
  useEffect(() => {
    let locationSubscriber;

    const startLocationTracking = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to share your location.');
        setIsSharing(false);
        return;
      }

      locationSubscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // 5 seconds
          distanceInterval: 10, // 10 meters
        },
        (location) => {
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );
    };

    if (isSharing) {
      startLocationTracking();
    }

    return () => {
      if (locationSubscriber) {
        locationSubscriber.remove();
      }
    };
  }, [isSharing]);

  // --- Safety Check Logic (NEW) ---

  // Load PIN from storage
  useEffect(() => {
    const loadPin = async () => {
      try {
        const storedPin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
        if (storedPin) {
          setSecurityPin(storedPin);
        }
      } catch (error) {
        console.error("Failed to load PIN from storage", error);
      }
    };
    loadPin();
  }, []);

  // Periodic timer to trigger the safety modal
  useEffect(() => {
    let safetyTimer;
    if (isSharing) {
      // Show modal every 5 minutes (300000 ms)
      safetyTimer = setInterval(() => {
        setIsSafetyModalVisible(true);
      }, 300000); 
    }
    return () => {
      if (safetyTimer) clearInterval(safetyTimer);
    };
  }, [isSharing]);
  
  // Countdown and vibration effect for the modal
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
            handlePinSubmit(true); // Timer finished, trigger emergency action
            return 0;
          }
          return newCountdown;
        });
      }, 1000);
    } else {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      Vibration.cancel();
    }
    
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      Vibration.cancel();
    };
  }, [isSafetyModalVisible]);


  const handleCallForHelp = () => {
    setIsSafetyModalVisible(false);
    Linking.openURL('tel:112').catch(err => Alert.alert("Couldn't make the call", err.message));
  };

  const handlePinSubmit = (isTimerExpired = false) => {
    if (isTimerExpired) {
        setIsSafetyModalVisible(false);
        sendEmergencySMS(); // Call the SMS function
        Alert.alert("Emergency Alert Sent", "Your location has been sent to your emergency contacts.");
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


  /**
   * Prepares and opens the user's default SMS app with a pre-filled message.
   */
  const sendEmergencySMS = async () => {
    if (!contacts || contacts.length === 0) {
      Alert.alert('No Contacts', 'No emergency contacts are available to send messages.');
      return;
    }
    if (smsActionTaken) {
        Alert.alert('Already Sent', 'You have already initiated the emergency message process.');
        return;
    }

    // 1. Get Location
    let location = userLocation;
    if (!location) {
        try {
            const freshLocation = await Location.getCurrentPositionAsync({ timeout: 5000 });
            location = { latitude: freshLocation.coords.latitude, longitude: freshLocation.coords.longitude };
            setUserLocation(location);
        } catch (error) {
            Alert.alert('Location Error', 'Could not fetch current location. Please try again.');
            return;
        }
    }
    
    // 2. Get Battery Level
    const batteryLevel = await Battery.getBatteryLevelAsync();
    const batteryPercentage = Math.round(batteryLevel * 100);

    // 3. Construct Message
    const mapsLink = `http://maps.google.com/maps?q=${location.latitude},${location.longitude}`;
    const message = `EMERGENCY ALERT: This is an automated safety check alert. I may be in trouble.\n\nReason: '${reason || 'Feeling unsafe'}'.\nMy current location: ${mapsLink}\n\nMy battery is at ${batteryPercentage}%. This check-in was set for ${duration || 'a set duration'}.`;


    // 4. Get all phone numbers
    const recipients = contacts.map(c => c.mobile.replace(/[^0-9]/g, '')).join(',');

    // 5. Create the SMS URL
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:${recipients}${separator}body=${encodeURIComponent(message)}`;

    // 6. Open the SMS app
    try {
        await Linking.openURL(url);
        setSmsActionTaken(true); // Mark that the user has taken the SMS action
    } catch (error) {
        Alert.alert('SMS Error', 'Could not open your messaging app. Please send the message manually.');
    }
  };


  const handleStopSharing = () => {
    Alert.alert('Stop Sharing', 'Are you sure you want to stop sharing your location?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Stop', style: 'destructive', onPress: () => {
          setIsSharing(false);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleExtendDuration = () => {
    setTimeLeft((prev) => prev + 30 * 60);
    Alert.alert('Duration Extended', '30 minutes have been added to your sharing session.');
  };

  // --- Render Functions ---

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={26} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Live Sharing</Text>
      <TouchableOpacity onPress={sendEmergencySMS} style={styles.smsButton}>
        <Ionicons name="chatbubble-ellipses-outline" size={26} color="#333" />
      </TouchableOpacity>
    </View>
  );

  const renderStatusCard = () => (
    <View style={styles.statusCard}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Ionicons name="pulse" size={32} color="#FFFFFF" />
      </Animated.View>
      <View style={styles.statusTextContainer}>
        <Text style={styles.statusTitle}>{isSharing ? 'Sharing is Active' : 'Sharing Ended'}</Text>
        <Text style={styles.statusSubtitle}>Your location is visible to selected contacts.</Text>
      </View>
    </View>
  );

  const renderDetailsCard = () => (
    <View style={styles.detailsCard}>
      <View style={styles.detailRow}>
        <Ionicons name="timer-outline" size={24} color="#FF4D4F" style={styles.detailIcon} />
        <View>
          <Text style={styles.detailLabel}>Time Left</Text>
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        </View>
      </View>
      <View style={styles.detailRow}>
        <Ionicons name="information-circle-outline" size={24} color="#1E90FF" style={styles.detailIcon} />
        <View>
          <Text style={styles.detailLabel}>Reason</Text>
          <Text style={styles.detailValue}>{reason || 'Not specified'}</Text>
        </View>
      </View>
    </View>
  );

  const renderMap = () => (
    <View style={styles.mapContainer}>
      {userLocation ? (
        <MapView
          style={styles.map}
          region={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={false} // We use a custom marker
          scrollEnabled={false}
          zoomEnabled={false}
        >
          <Marker coordinate={userLocation} title="Your Location">
            <View style={styles.marker}>
              <View style={styles.markerDot} />
            </View>
          </Marker>
        </MapView>
      ) : (
        <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>Getting your location...</Text>
        </View>
      )}
    </View>
  );

  const renderContacts = () => (
    <View>
      <Text style={styles.sectionTitle}>Sharing With</Text>
      {contacts && contacts.length > 0 ? (
        contacts.map((contact) => (
          <View key={contact.id} style={styles.contactItem}>
            <Image source={{ uri: contact.photo || `https://ui-avatars.com/api/?name=${contact.name.replace(' ','+')}&background=random` }} style={styles.contactImage} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactNumber}>{contact.mobile}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          </View>
        ))
      ) : (
        <Text style={styles.noContactsText}>No contacts were selected.</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderHeader()}
        {renderStatusCard()}
        {renderDetailsCard()}
        {renderMap()}
        {renderContacts()}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.extendButton]}
          onPress={handleExtendDuration}
          disabled={!isSharing}
        >
          <Ionicons name="add-circle-outline" size={22} color="#1E90FF" style={styles.buttonIcon} />
          <Text style={[styles.buttonText, styles.extendButtonText]}>Extend by 30 min</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.stopButton]}
          onPress={handleStopSharing}
          disabled={!isSharing}
        >
          <Ionicons name="stop-circle-outline" size={22} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={[styles.buttonText, styles.stopButtonText]}>Stop Sharing</Text>
        </TouchableOpacity>
      </View>
      
      {/* --- Safety Check Modal --- */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={isSafetyModalVisible}
        onRequestClose={() => { Alert.alert("Action Required", "Please confirm your status or call for help."); }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.timerContainer}>
                <Text style={styles.modalTimerText}>{countdown}</Text>
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

    </View>
  );
};

const styles = StyleSheet.create({
  // --- Existing Styles ---
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Space for the footer
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  smsButton: {
    padding: 5,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statusTextContainer: {
    marginLeft: 15,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailRow: {
    alignItems: 'center',
  },
  detailIcon: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  timerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4D4F',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  mapContainer: {
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#E9EEF3',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  mapPlaceholderText:{
      color: '#666',
      fontSize: 16,
  },
  marker: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 144, 255, 0.9)',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  contactImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactNumber: {
    fontSize: 14,
    color: '#666',
  },
  noContactsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9EEF3',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  stopButton: {
    backgroundColor: '#FF4D4F',
  },
  extendButton: {
    backgroundColor: '#E9F4FF',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stopButtonText: {
    color: '#FFFFFF',
  },
  extendButtonText: {
    color: '#1E90FF',
  },

  // --- Styles for Safety Check Modal (NEW) ---
  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0, 0, 0, 0.7)' 
  },
  modalContent: { 
    width: '85%', 
    maxWidth: 350, 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 25, 
    alignItems: 'center', 
    elevation: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 5 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 10 
  },
  timerContainer: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#FF3B30', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 15, 
    borderWidth: 3, 
    borderColor: 'white', 
    elevation: 5 
  },
  modalTimerText: { 
    color: 'white', 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 8, 
    textAlign: 'center' 
  },
  modalMessage: { 
    fontSize: 16, 
    color: '#555', 
    textAlign: 'center', 
    marginBottom: 25 
  },
  helpButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#FF3B30', 
    paddingVertical: 14, 
    borderRadius: 12, 
    marginBottom: 20, 
    width: '100%' 
  },
  helpButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '600', 
    marginLeft: 10 
  },
  pinPrompt: { 
    fontSize: 14, 
    color: '#666', 
    textAlign: 'center', 
    marginBottom: 15 
  },
  pinInput: { 
    width: '80%', 
    height: 55, 
    borderColor: '#ddd', 
    borderWidth: 1, 
    borderRadius: 12, 
    textAlign: 'center', 
    fontSize: 24, 
    letterSpacing: 15, 
    marginBottom: 20, 
    backgroundColor: '#f9f9f9' 
  },
  dismissButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#34C759', 
    paddingVertical: 14, 
    borderRadius: 12, 
    width: '100%' 
  },
  dismissButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '600', 
    marginLeft: 10 
  },
});

export default LiveSharingScreen;