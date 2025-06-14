import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, Platform, PermissionsAndroid, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import SendSMS from 'react-native-sms';

const LiveSharingScreen = ({ navigation, route }) => {
  const { contacts, reason, duration } = route.params || {};
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSharing, setIsSharing] = useState(true);
  const [userLocation, setUserLocation] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [smsSent, setSmsSent] = useState(false);

  // Convert duration to seconds
  const parseDurationToSeconds = (durationString) => {
    console.log('Parsing duration:', durationString);
    if (!durationString) return 0;
    const parts = durationString.split(' ');
    const value = parseInt(parts[0], 10);
    if (isNaN(value)) return 0;
    if (parts[1]?.includes('hour')) {
      return value * 3600;
    } else if (parts[1]?.includes('minute')) {
      return value * 60;
    }
    return 0;
  };

  // Format seconds to MM:SS or HH:MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Sanitize phone number
  const sanitizePhoneNumber = (number) => {
    if (!number) return '';
    const sanitized = number.replace(/[^0-9+]/g, '');
    console.log('Sanitized phone number:', sanitized);
    return sanitized;
  };

  // Send SMS to all contacts
  const sendEmergencySMS = async () => {
    try {
      console.log('Starting sendEmergencySMS for contacts:', JSON.stringify(contacts));

      // Validate contacts
      if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
        console.log('No valid contacts provided');
        Alert.alert('No Contacts', 'No emergency contacts are available to send messages.');
        return false;
      }

      // Request SMS permission on Android
      let hasSMSPermission = true;
      if (Platform.OS === 'android') {
        console.log('Requesting SMS permission');
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.SEND_SMS,
          {
            title: 'SMS Permission',
            message: 'This app needs SMS permission to send emergency messages.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        hasSMSPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        console.log('SMS permission status:', hasSMSPermission ? 'granted' : 'denied');
        if (!hasSMSPermission) {
          Alert.alert('Permission Denied', 'SMS permission is required to send emergency messages.');
        }
      }

      // Get current location with timeout
      console.log('Requesting location permission');
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        Alert.alert('Permission Denied', 'Location permission is required to share your location.');
        return false;
      }
      let location;
      try {
        location = await Location.getCurrentPositionAsync({ timeout: 10000 });
        console.log('Location fetched:', JSON.stringify(location.coords));
      } catch (error) {
        console.error('Location fetch failed:', error.message);
        Alert.alert('Error', 'Failed to get location. Using default location.');
        location = { coords: { latitude: 37.78825, longitude: -122.4324 } };
      }

      // Update user location for map
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // Get battery level
      let batteryLevel = 0;
      try {
        batteryLevel = await Battery.getBatteryLevelAsync();
        console.log('Battery level fetched:', batteryLevel);
      } catch (error) {
        console.error('Battery fetch failed:', error.message);
        Alert.alert('Warning', 'Could not fetch battery level. Using 0%.');
      }
      const batteryPercentage = Math.round(batteryLevel * 100);

      // Construct SMS message
      const message = `Emergency: ${reason || 'No reason provided'}. My location is https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}. Duration: ${duration || 'N/A'}. Battery: ${batteryPercentage}%.`;
      console.log('SMS message constructed:', message);

      // Send SMS to each contact
      let allSent = true;
      for (const contact of contacts) {
        const phoneNumber = sanitizePhoneNumber(contact.mobile);
        if (!phoneNumber || phoneNumber.length < 7) {
          console.log(`Invalid phone number for ${contact.name}: ${phoneNumber}`);
          Alert.alert('Error', `Invalid phone number for ${contact.name}.`);
          allSent = false;
          continue;
        }
        console.log(`Attempting to send SMS to ${contact.name}: ${phoneNumber}`);

        // Try react-native-sms first
        let smsSentSuccessfully = false;
        if (hasSMSPermission) {
          try {
            await new Promise((resolve, reject) => {
              SendSMS.send(
                {
                  body: message,
                  recipients: [phoneNumber],
                  successTypes: ['sent', 'queued'],
                  allowAndroidSendWithoutReadPermission: true,
                },
                (completed, cancelled, error) => {
                  if (completed) {
                    console.log(`SMS sent to ${contact.name}`);
                    smsSentSuccessfully = true;
                    resolve();
                  } else if (cancelled) {
                    console.log(`SMS cancelled for ${contact.name}`);
                    Alert.alert('Cancelled', `Message to ${contact.name} was cancelled.`);
                    allSent = false;
                    resolve();
                  } else if (error) {
                    console.error(`SMS error for ${contact.name}: ${error}`);
                    Alert.alert('Error', `Failed to send message to ${contact.name}: ${error}`);
                    allSent = false;
                    resolve();
                  }
                }
              );
            });
          } catch (error) {
            console.error(`react-native-sms failed for ${contact.name}: ${error.message}`);
            Alert.alert('Error', `react-native-sms failed for ${contact.name}: ${error.message}`);
            allSent = false;
          }
        }

        // Fallback to Linking if react-native-sms fails or no permission
        if (!smsSentSuccessfully) {
          console.log(`Falling back to Linking for ${contact.name}`);
          try {
            const smsUrl = Platform.OS === 'ios'
              ? `sms:${phoneNumber}&body=${encodeURIComponent(message)}`
              : `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
            const supported = await Linking.canOpenURL(smsUrl);
            if (supported) {
              await Linking.openURL(smsUrl);
              console.log(`Linking SMS opened for ${contact.name}`);
            } else {
              console.log(`SMS not supported for ${contact.name}`);
              Alert.alert('Error', `Unable to send SMS to ${contact.name}. SMS app not available.`);
              allSent = false;
            }
          } catch (error) {
            console.error(`Linking SMS failed for ${contact.name}: ${error.message}`);
            Alert.alert('Error', `Failed to open SMS app for ${contact.name}: ${error.message}`);
            allSent = false;
          }
        }
      }
      return allSent;
    } catch (error) {
      console.error('Error in sendEmergencySMS:', error.message);
      Alert.alert('Error', `Failed to send emergency messages: ${error.message}`);
      return false;
    }
  };

  useEffect(() => {
    if (!duration || !isSharing || smsSent) {
      console.log('Skipping SMS send: duration=', duration, 'isSharing=', isSharing, 'smsSent=', smsSent);
      return;
    }

    const totalSeconds = parseDurationToSeconds(duration);
    console.log('Total seconds:', totalSeconds);
    setTimeLeft(totalSeconds);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          setIsSharing(false);
          Alert.alert('Sharing Ended', 'The live sharing session has ended.', [
            { text: 'OK', onPress: () => navigation.navigate('PersonalSafety') }
          ]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Send SMS when sharing starts
    (async () => {
      console.log('Checking contacts for SMS:', JSON.stringify(contacts));
      if (contacts && Array.isArray(contacts) && contacts.length > 0) {
        const success = await sendEmergencySMS();
        if (success) {
          setSmsSent(true);
          console.log('All SMS sent successfully');
          Alert.alert('Emergency Messages Sent', 'Messages have been sent to your emergency contacts.');
        } else {
          console.log('Some or all SMS failed to send');
        }
      } else {
        console.log('No contacts provided');
        Alert.alert('No Contacts', 'Please add emergency contacts to enable messaging.');
      }
    })();

    return () => clearInterval(timer);
  }, [duration, isSharing, navigation, contacts, smsSent]);

  const handleStopSharing = () => {
    Alert.alert(
      'Stop Sharing',
      'Are you sure you want to stop sharing your location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => {
            setIsSharing(false);
            setTimeLeft(0);
            navigation.goBack(); // Go back to previous screen instead of pushing
          },
        },
      ]
    );
  };
  
  const handleExtendDuration = () => {
    Alert.alert(
      'Extend Duration',
      'Extend the sharing duration by 30 minutes?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Extend',
          onPress: () => {
            setTimeLeft((prev) => prev + 30 * 60);
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      accessibilityLabel="Live Sharing Screen"
      accessibilityHint="View and manage live location sharing"
    >
      <View style={styles.headerContainer}>
      <TouchableOpacity
  onPress={() => navigation.goBack()}
  accessibilityLabel="Go back to Personal Safety"
  accessibilityHint="Navigates back to the Personal Safety screen"
>
  <Ionicons name="arrow-back" size={28} color="#000" />
</TouchableOpacity>

        <Text style={styles.header}>Live Sharing</Text>
        <Ionicons name="share-social" size={28} color="#1E90FF" />
      </View>

      <View style={styles.statusContainer}>
        <Ionicons
          name={isSharing ? "location" : "location-outline"}
          size={28}
          color={isSharing ? "#FF4D4F" : "#666"}
          style={styles.statusIcon}
          accessibilityLabel={isSharing ? "Location sharing active" : "Location sharing stopped"}
        />
        <Text style={styles.statusText}>
          {isSharing ? 'Sharing in Progress' : 'Sharing Stopped'}
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle" size={20} color="#1E90FF" style={styles.infoIcon} />
          <Text style={styles.infoText}>{reason || 'No reason provided'} • {duration || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time" size={20} color="#FF4D4F" style={styles.infoIcon} />
          <Text style={styles.timerText}>Time Left: {formatTime(timeLeft)}</Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={userLocation}
          showsUserLocation={true}
          followsUserLocation={isSharing}
          accessibilityLabel="Live location map"
          accessibilityHint="Shows your current location on a map"
        >
          <Marker coordinate={userLocation} title="Your Location" />
        </MapView>
      </View>

      <Text style={styles.sectionTitle}>
        <Ionicons name="people" size={20} color="#666" style={styles.sectionIcon} />
        Sharing with
      </Text>
      {contacts && Array.isArray(contacts) && contacts.length > 0 ? (
        contacts.map((contact) => (
          <View key={contact.id} style={styles.contactItem}>
            <Image
              source={{ uri: contact.photo || 'https://via.placeholder.com/40' }}
              style={styles.contactImage}
              accessibilityLabel={`Profile picture of ${contact.name}`}
            />
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactNumber}>{contact.mobile}</Text>
            </View>
            <Ionicons name="person-circle" size={24} color="#1E90FF" />
          </View>
        ))
      ) : (
        <Text style={styles.noContactsText}>No contacts selected.</Text>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.stopButton, !isSharing && styles.disabledButton]}
          onPress={handleStopSharing}
          disabled={!isSharing}
          accessibilityLabel="Stop sharing location"
          accessibilityHint="Ends the live location sharing session"
        >
          <Ionicons name="stop-circle" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Stop Sharing</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.extendButton, !isSharing && styles.disabledButton]}
          onPress={handleExtendDuration}
          disabled={!isSharing}
          accessibilityLabel="Extend sharing duration"
          accessibilityHint="Extends the location sharing duration by 30 minutes"
        >
          <Ionicons name="time-outline" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Extend Duration</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 10,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIcon: {
    marginRight: 10,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4D4F',
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8ECEF',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  sectionIcon: {
    marginRight: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  contactImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 25,
    marginHorizontal: 8,
  },
  stopButton: {
    backgroundColor: '#FF4D4F',
  },
  extendButton: {
    backgroundColor: '#1E90FF',
  },
  disabledButton: {
    backgroundColor: '#B0B0B0',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LiveSharingScreen;