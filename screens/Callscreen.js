import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, PermissionsAndroid,
  Platform, ScrollView, Linking, ActivityIndicator, RefreshControl, Modal, TextInput
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { Ionicons } from '@expo/vector-icons';
import * as IntentLauncher from 'expo-intent-launcher';
import { Picker } from '@react-native-picker/picker';

const PersonalSafetyScreen = ({ navigation, route }) => {
  const [isLocationOn, setIsLocationOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false); // State for modal visibility
  const [selectedReason, setSelectedReason] = useState('Walking alone'); // State for reason dropdown
  const [customReason, setCustomReason] = useState(''); // State for custom reason input
  const [selectedDuration, setSelectedDuration] = useState('1 hour'); // State for duration dropdown

  const isMounted = useRef(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const updatedContacts = route.params?.contacts || [];
      setContacts(updatedContacts);
    });

    return unsubscribe;
  }, [navigation, route]);

  useEffect(() => {
    isMounted.current = true;
    checkLocationStatus();

    const focusListener = navigation.addListener('focus', () => {
      checkLocationStatus();
    });

    return () => {
      isMounted.current = false;
      focusListener();
    };
  }, [navigation]);

  const checkLocationStatus = async () => {
    if (!isMounted.current) return;

    setLoading(true);

    try {
      if (Platform.OS === 'android') {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        if (!hasPermission) {
          setIsLocationOn(false);
          setLoading(false);
          return;
        }
      }

      Geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted.current) return;
          setIsLocationOn(true);
          setLoading(false);
        },
        (error) => {
          if (!isMounted.current) return;
          console.log('Location error:', error);
          setIsLocationOn(false);
          setLoading(false);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 5000, 
          maximumAge: 1000 
        }
      );
    } catch (err) {
      if (!isMounted.current) return;
      console.log('Location check error:', err);
      setIsLocationOn(false);
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          checkLocationStatus();
        } else {
          IntentLauncher.startActivityAsync(
            IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS
          );
        }
      } else {
        Linking.openURL('app-settings:');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const makeEmergencyCall = () => {
    const phoneNumber = 'tel:112';
    Linking.canOpenURL(phoneNumber)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneNumber);
        } else {
          console.log("Can't make emergency call");
        }
      })
      .catch((err) => console.error('An error occurred', err));
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    checkLocationStatus();
    setTimeout(() => {
      if (!isMounted.current) return;
      setRefreshing(false);
    }, 1500);
  }, []);

  const openLocationSettings = () => {
    if (Platform.OS === 'android') {
      IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS);
    } else {
      Linking.openURL('app-settings:');
    }
  };

  // Handle "Next" button in the modal
  const handleNext = () => {
    // Use customReason if the user selected "Other", otherwise use selectedReason
    const finalReason = selectedReason === 'Other' ? customReason : selectedReason;
    console.log('Reason:', finalReason, 'Duration:', selectedDuration);
    setModalVisible(false);
    // Example: Navigate to a confirmation screen
    // navigation.navigate('SafetyCheckConfirmation', { reason: finalReason, duration: selectedDuration });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#ff4444"]} />
      }
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff4444" />
          <Text style={styles.loadingText}>Checking location...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.header}>Personal Safety</Text>

          <Text style={styles.sectionTitle}>Get help fast</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('emergencysharing', { contacts })}
            >
              <Ionicons name="warning" size={24} color="#ff4444" style={styles.icon} />
              <Text style={styles.buttonText}>Emergency Sharing</Text>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={makeEmergencyCall}
            >
              <Ionicons name="call" size={24} color="#ff4444" style={styles.icon} />
              <Text style={styles.buttonText}>Call 112</Text>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {!isLocationOn && (
            <View style={styles.warningContainer}>
              <Text style={styles.sectionTitle}>Take action</Text>
              <View style={styles.warningCard}>
                <Ionicons name="warning" size={24} color="#ff4444" style={styles.warningIcon} />
                <Text style={styles.warningText}>Can't share your location</Text>
                <Text style={styles.warningSubText}>
                  Turn on device location to share where you are with emergency contacts.
                </Text>
                <TouchableOpacity 
                  style={styles.settingsButton} 
                  onPress={openLocationSettings}
                >
                  <Text style={styles.settingsButtonText}>
                    Enable Location Services
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>Be prepared</Text>
          <TouchableOpacity
            style={styles.safetyCheckButton}
            onPress={() => setModalVisible(true)} // Open the modal
          >
            <Ionicons name="shield-checkmark" size={24} color="#ff4444" style={styles.safetyCheckIcon} />
            <Text style={styles.safetyCheckText}>Safety Check</Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          {/* Safety Check Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <ScrollView contentContainerStyle={styles.modalScrollContent}>
                  <View style={styles.modalHeader}>
                    <Ionicons name="shield-checkmark" size={40} color="#ffcc00" style={styles.modalIcon} />
                    <Text style={styles.modalTitle}>Start a Safety Check</Text>
                    <Text style={styles.modalSubtitle}>Step 1 of 2</Text>
                  </View>

                  <Text style={styles.modalDescription}>
                    Let Personal Safety know your situation and when to check that you're safe.{' '}
                    <Text style={styles.linkText}>See how it works</Text>
                  </Text>

                  {/* Reason Dropdown */}
                  <View style={styles.dropdownContainer}>
                    <Ionicons name="person-outline" size={20} color="#1E90FF" style={styles.dropdownIcon} />
                    <Text style={styles.dropdownLabel}>Reason</Text>
                    <Picker
                      selectedValue={selectedReason}
                      style={styles.picker}
                      onValueChange={(itemValue) => {
                        setSelectedReason(itemValue);
                        if (itemValue !== 'Other') {
                          setCustomReason(''); // Clear custom reason if a predefined option is selected
                        }
                      }}
                    >
                      <Picker.Item label="Walking alone" value="Walking alone" />
                      <Picker.Item label="Traveling late" value="Traveling late" />
                      <Picker.Item label="Meeting someone new" value="Meeting someone new" />
                      <Picker.Item label="Feeling unsafe" value="Feeling unsafe" />
                      <Picker.Item label="Other" value="Other" />
                    </Picker>
                  </View>

                  {/* Custom Reason Input (shown only if "Other" is selected) */}
                  {selectedReason === 'Other' && (
                    <View style={styles.customReasonContainer}>
                      <Ionicons name="pencil-outline" size={20} color="#1E90FF" style={styles.dropdownIcon} />
                      <Text style={styles.dropdownLabel}>Other Reason</Text>
                      <TextInput
                        style={styles.customReasonInput}
                        placeholder="Enter your reason"
                        value={customReason}
                        onChangeText={setCustomReason}
                        maxLength={100} // Limit the length of the custom reason
                      />
                    </View>
                  )}

                  {/* Duration Dropdown */}
                  <View style={styles.dropdownContainer}>
                    <Ionicons name="time-outline" size={20} color="#1E90FF" style={styles.dropdownIcon} />
                    <Text style={styles.dropdownLabel}>Duration</Text>
                    <Picker
                      selectedValue={selectedDuration}
                      style={styles.picker}
                      onValueChange={(itemValue) => setSelectedDuration(itemValue)}
                    >
                      <Picker.Item label="30 minutes" value="30 minutes" />
                      <Picker.Item label="1 hour" value="1 hour" />
                      <Picker.Item label="2 hours" value="2 hours" />
                      <Picker.Item label="4 hours" value="4 hours" />
                    </Picker>
                  </View>

                  {/* Description */}
                  <View style={styles.descriptionContainer}>
                    <Ionicons name="information-circle-outline" size={20} color="#1E90FF" style={styles.descriptionIcon} />
                    <Text style={styles.descriptionText}>
                      When you start a safety check, Location Sharing is started. Your real-time location stays private to you until Emergency Sharing starts.
                    </Text>
                  </View>

                  {/* Buttons */}
                  <View style={styles.modalButtonContainer}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.nextButton}
                      onPress={handleNext}
                    >
                      <Text style={styles.nextButtonText}>Next</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>

          <View style={styles.illustrationContainer}>
            <Image
              source={require('../assets/images/safesteps illustration.png')}
              style={styles.illustration}
            />
          </View>

          <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
              <Ionicons name="home" size={24} color="#666" />
              <Text style={styles.navText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SafeRoutes')}>
              <Ionicons name="navigate" size={24} color="#666" />
              <Text style={styles.navText}>Safe Routes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CallSign')}>
              <Ionicons name="call" size={24} color="#1E90FF" />
              <Text style={styles.navText}>Call Sign</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person" size={24} color="#666" />
              <Text style={styles.navText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
};


// Updated styles for the Safety Check feature
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontWeight: '700',
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
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  warningContainer: {
    marginBottom: 20,
  },
  warningCard: {
    backgroundColor: '#ffe6e6',
    padding: 15,
    borderRadius: 10,
    elevation: 6,
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
  // Updated Safety Check Button
  safetyCheckButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5', // Light blue background
    padding: 18,
    borderRadius: 14,
    marginVertical: 10,
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#e0e8f0',
  },
  safetyCheckIcon: {
    marginRight: 12,
    color: '#ff4444', // Keep consistent with app color scheme
  },
  safetyCheckText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'left',
    color: '#333',
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
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  // Improved Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker overlay for better contrast
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, // Increased radius for more modern look
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 24, // Increased padding
    width: '100%',
    height: '85%',
    elevation: 10, // Increased elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24, // Increased spacing
    paddingTop: 10,
  },
  modalIcon: {
    marginBottom: 12,
    backgroundColor: '#fff8e0', // Light yellow background for icon
    padding: 12,
    borderRadius: 50,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 22, // Larger font size
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modalDescription: {
    fontSize: 15,
    lineHeight: 22, // Added line height for better readability
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  linkText: {
    color: '#1E90FF',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0d0d0', // Slightly darker border
    borderRadius: 14, // Increased radius
    paddingHorizontal: 14,
    paddingVertical: 10, // More vertical padding
    marginBottom: 20, // More spacing between dropdowns
    backgroundColor: '#fafafa', // Light background
  },
  customReasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    backgroundColor: '#fafafa',
  },
  customReasonInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 5,
  },
  dropdownIcon: {
    marginRight: 12,
    color: '#1E90FF', // Blue icons
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: '500', // Medium weight
    color: '#444', // Darker text
    marginRight: 12,
    width: 70, // Fixed width for labels for alignment
  },
  picker: {
    flex: 1,
    height: 45, // Taller picker
    color: '#333',
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 30, // More space before buttons
    backgroundColor: '#f0f8ff', // Light blue background
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d0e0f0',
  },
  descriptionIcon: {
    marginRight: 12,
    marginTop: 2,
    color: '#1E90FF',
  },
  descriptionText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    lineHeight: 20, // Better readability
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5, // Thicker border
    borderColor: '#1E90FF',
    borderRadius: 25, // More rounded
    paddingVertical: 12, // Taller buttons
    alignItems: 'center',
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#1E90FF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#1E90FF',
    borderRadius: 25, // More rounded
    paddingVertical: 12, // Taller buttons
    alignItems: 'center',
    elevation: 3, // Add shadow to next button
    shadowColor: '#0066cc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PersonalSafetyScreen;