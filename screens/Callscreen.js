import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, Platform, ScrollView, Linking, ActivityIndicator, RefreshControl, Modal, TextInput, Alert, Switch
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import * as IntentLauncher from 'expo-intent-launcher';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PersonalSafetyScreen = ({ navigation }) => {
  const [isLocationOn, setIsLocationOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedContacts, setSelectedContacts] = useState([]);

  const isMounted = useRef(true);

  const loadContacts = async () => {
    try {
      const stored = await AsyncStorage.getItem('emergencyContacts');
      console.log('Raw AsyncStorage data for emergencyContacts:', stored);
      let loadedContacts = stored ? JSON.parse(stored) : [];
      loadedContacts = Array.isArray(loadedContacts) ? loadedContacts : [];
      
      loadedContacts = loadedContacts
        .filter(contact => contact?.id && contact?.name && contact?.mobile)
        .reduce((acc, contact) => {
          if (!acc.find(c => c.id === contact.id)) {
            acc.push(contact);
          }
          return acc;
        }, []);

      console.log('Processed contacts from AsyncStorage:', loadedContacts);
      
      if (isMounted.current) {
        setContacts(loadedContacts);
        setSelectedContacts(loadedContacts.map(contact => ({ ...contact, selected: false })));
        console.log('Updated state - contacts:', loadedContacts);
        console.log('Updated state - selectedContacts:', loadedContacts.map(contact => ({ ...contact, selected: false })));
      }
    } catch (error) {
      console.error('Error loading contacts from AsyncStorage:', error);
      if (isMounted.current) {
        setContacts([]);
        setSelectedContacts([]);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    loadContacts();

    const unsubscribe = navigation.addListener('focus', () => {
      console.log('PersonalSafetyScreen focused');
      loadContacts();
    });

    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, [navigation]);

  useEffect(() => {
    isMounted.current = true;
    checkLocation();

    const focusListener = navigation.addListener('focus', () => {
      checkLocation();
    });

    return () => {
      isMounted.current = false;
      focusListener();
    };
  }, [navigation]);

  useEffect(() => {
    const validateForm = () => {
      if (selectedReason === 'Other') {
        return customReason.trim().length > 0 && selectedDuration !== '';
      }
      return selectedReason !== '' && selectedDuration !== '';
    };
    setIsFormValid(validateForm());
  }, [selectedReason, customReason, selectedDuration]);

  const checkLocation = async () => {
    if (!isMounted.current) return;

    setLoading(true);

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLocationOn(false);
        setLoading(false);
        return;
      }

      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        setIsLocationOn(false);
        setLoading(false);
        return;
      }

      await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 5000,
        maximumAge: 1000
      });

      if (!isMounted.current) return;
      setIsLocationOn(true);
      setLoading(false);
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
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          checkLocation();
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
    
    Linking.openURL(phoneNumber)
      .then(() => {
        console.log('Call initiated successfully');
      })
      .catch((error) => {
        console.error('Call failed:', error);
        Alert.alert(
          'Emergency Call',
          'Unable to make call automatically. Please dial 112 manually.',
          [{ text: 'OK' }]
        );
      });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    checkLocation();
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

  const debugAsyncStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem('emergencyContacts');
      console.log('Debug - AsyncStorage emergencyContacts:', stored);
      Alert.alert('AsyncStorage Contents', stored || 'No contacts found');
    } catch (error) {
      console.error('Error debugging AsyncStorage:', error);
      Alert.alert('Error', 'Failed to read AsyncStorage');
    }
  };

  const handleNext = () => {
    if (!isFormValid) return;
    if (contacts.length === 0) {
      Alert.alert('No Contacts', 'Please add at least one emergency contact before starting a safety check.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add Contact', onPress: () => navigation.navigate('EmergencyContacts', { contacts }) }
      ]);
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleConfirm = () => {
    const selectedCount = selectedContacts.filter(contact => contact.selected).length;
    if (selectedCount === 0) {
      Alert.alert('Error', 'Please select at least one contact to share with.');
      return;
    }

    const finalReason = selectedReason === 'Other' ? customReason : selectedReason;
    const contactsToShare = selectedContacts.filter(contact => contact.selected);
    console.log('Starting location sharing with:', { contacts: contactsToShare, reason: finalReason, duration: selectedDuration });
    setModalVisible(false);
    setStep(1);
    setSelectedReason('');
    setCustomReason('');
    setSelectedDuration('');
    navigation.navigate('LiveSharing', { contacts: contactsToShare, reason: finalReason, duration: selectedDuration });
  };

  const toggleContactSelection = (index) => {
    setSelectedContacts(prev =>
      prev.map((contact, i) =>
        i === index ? { ...contact, selected: !contact.selected } : contact
      )
    );
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
              onPress={() => navigation.navigate('emergencycontact', { contacts })}
            >
              <Ionicons name="warning" size={24} color="#ff4444" style={styles.icon} />
              <Text style={styles.buttonText}>Emergency Contacts</Text>
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
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="shield-checkmark" size={24} color="#ff4444" style={styles.safetyCheckIcon} />
            <Text style={styles.safetyCheckText}>Safety Check</Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
              setModalVisible(false);
              setStep(1);
              setSelectedReason('');
              setCustomReason('');
              setSelectedDuration('');
            }}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <ScrollView contentContainerStyle={styles.modalScrollContent}>
                  <View style={styles.modalHeader}>
                    <Ionicons name="shield-checkmark" size={40} color="#ffcc00" style={styles.modalIcon} />
                    <Text style={styles.modalTitle}>Safety Check</Text>
                    <Text style={styles.stepText}>Step {step} of 2</Text>
                  </View>

                  {step === 1 ? (
                    <>
                      <Text style={styles.modalDescription}>
                        Let Personal Safety know your situation and when to check that you're safe.{' '}
                        <Text style={styles.linkText}>See how it works</Text>
                      </Text>

                      <View style={styles.dropdownContainer}>
                        <Ionicons name="person-outline" size={20} color="#1E90FF" style={styles.dropdownIcon} />
                        <Text style={styles.dropdownLabel}>Reason</Text>
                        <View style={styles.pickerWrapper}>
                          <Picker
                            selectedValue={selectedReason}
                            style={styles.picker}
                            onValueChange={(itemValue) => {
                              setSelectedReason(itemValue);
                              if (itemValue !== 'Other') {
                                setCustomReason('');
                              }
                            }}
                            dropdownIconColor="#1E90FF"
                          >
                            <Picker.Item label="Select a reason" value="" enabled={false} />
                            <Picker.Item label="Walking alone" value="Walking alone" />
                            <Picker.Item label="Traveling late" value="Traveling late" />
                            <Picker.Item label="Meeting someone new" value="Meeting someone new" />
                            <Picker.Item label="Feeling unsafe" value="Feeling unsafe" />
                            <Picker.Item label="Other" value="Other" />
                          </Picker>
                        </View>
                      </View>

                      {selectedReason === 'Other' && (
                        <View style={[
                          styles.customReasonContainer,
                          !customReason.trim() && styles.invalidInput
                        ]}>
                          <Ionicons name="pencil-outline" size={20} color="#1E90FF" style={styles.dropdownIcon} />
                          <Text style={styles.dropdownLabel}>Other Reason</Text>
                          <TextInput
                            style={styles.customReasonInput}
                            placeholder="Enter your reason"
                            placeholderTextColor="#999"
                            value={customReason}
                            onChangeText={setCustomReason}
                            maxLength={100}
                          />
                        </View>
                      )}

                      <View style={styles.dropdownContainer}>
                        <Ionicons name="time-outline" size={20} color="#1E90FF" style={styles.dropdownIcon} />
                        <Text style={styles.dropdownLabel}>Duration</Text>
                        <View style={styles.pickerWrapper}>
                          <Picker
                            selectedValue={selectedDuration}
                            style={styles.picker}
                            onValueChange={setSelectedDuration}
                            dropdownIconColor="#1E90FF"
                          >
                            <Picker.Item label="Select duration" value="" enabled={false} />
                            <Picker.Item label="30 minutes" value="30 minutes" />
                            <Picker.Item label="1 hour" value="1 hour" />
                            <Picker.Item label="2 hours" value="2 hours" />
                            <Picker.Item label="4 hours" value="4 hours" />
                          </Picker>
                        </View>
                      </View>

                      <View style={styles.descriptionContainer}>
                        <Ionicons name="information-circle-outline" size={20} color="#1E90FF" style={styles.descriptionIcon} />
                        <Text style={styles.descriptionText}>
                          When you start a safety check, Location Sharing is started. Your real-time location stays private to you until Emergency Sharing starts.
                        </Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.modalDescription}>
                        Select at least one contact to share your location with.{' '}
                        <Text style={styles.linkText}>Learn more about sharing</Text>
                      </Text>

                      <View style={styles.contactsContainer}>
                        {selectedContacts.length === 0 ? (
                          <Text style={styles.noContactsText}>No emergency contacts added. Please add contacts first.</Text>
                        ) : (
                          selectedContacts.map((contact, index) => (
                            <TouchableOpacity
                              key={contact.id}
                              style={styles.contactItem}
                              onPress={() => toggleContactSelection(index)}
                            >
                              <View style={[styles.checkbox, contact.selected && styles.checkboxSelected]}>
                                {contact.selected && <Ionicons name="checkmark" size={20} color="#fff" />}
                              </View>
                              <Image
                                source={{ uri: contact.photo || 'https://via.placeholder.com/40' }}
                                style={styles.contactImage}
                              />
                              <View style={styles.contactInfo}>
                                <Text style={styles.contactName}>{contact.name}</Text>
                                <Text style={styles.contactNumber}>{contact.mobile}</Text>
                              </View>
                            </TouchableOpacity>
                          ))
                        )}
                      </View>

                      <View style={styles.notifyContainer}>
                        <Text style={styles.notifyText}>
                          Notify selected contacts when sharing starts
                        </Text>
                        <Switch
                          trackColor={{ false: '#767577', true: '#81b0ff' }}
                          thumbColor={'#f4f3f4'}
                          ios_backgroundColor="#3e3e3e"
                          value={true}
                          onValueChange={() => {}}
                        />
                      </View>
                    </>
                  )}

                  <View style={styles.modalButtonContainer}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        if (step === 2) {
                          handleBack();
                        } else {
                          setModalVisible(false);
                          setStep(1);
                          setSelectedReason('');
                          setCustomReason('');
                          setSelectedDuration('');
                        }
                      }}
                    >
                      <Text style={styles.cancelButtonText}>{step === 2 ? 'Back' : 'Cancel'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.nextButton,
                        (step === 1 && !isFormValid) || (step === 2 && selectedContacts.every(contact => !contact.selected))
                          ? styles.nextButtonDisabled
                          : null
                      ]}
                      onPress={step === 1 ? handleNext : handleConfirm}
                      disabled={(step === 1 && !isFormValid) || (step === 2 && selectedContacts.every(contact => !contact.selected))}
                    >
                      <Text style={styles.nextButtonText}>{step === 1 ? 'Next' : 'Confirm'}</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>

          <View style={styles.illustrationContainer}>
            <Image
              source={require('../assets/images/safesteps illustration.png')}
              style={[styles.illustration, isLocationOn ? styles.largeIllustration : styles.smallIllustration]}
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
  debugButton: {
    backgroundColor: '#ffcc00',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  debugButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
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
  safetyCheckButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
    color: '#ff4444',
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
    resizeMode: 'contain',
  },
  largeIllustration: {
    marginTop: 50,
    width: 250,
    height: 250,
  },
  smallIllustration: {
    marginTop: -10,
    width: 270,
    height: 270,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 24,
    width: '100%',
    height: '85%',
    elevation: 10,
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
    marginBottom: 24,
    paddingTop: 10,
  },
  modalIcon: {
    marginBottom: 12,
    backgroundColor: '#fff8e0',
    padding: 12,
    borderRadius: 50,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modalDescription: {
    fontSize: 15,
    lineHeight: 22,
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
    borderColor: '#d0d0d0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    backgroundColor: '#fafafa',
  },
  pickerWrapper: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
  },
  picker: {
    flex: 1,
    height: 50,
    color: '#333',
    fontSize: 15,
  },
  customReasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    backgroundColor: '#fafafa',
  },
  invalidInput: {
    borderColor: '#ff4444',
  },
  customReasonInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  dropdownIcon: {
    marginRight: 12,
    color: '#1E90FF',
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
    marginRight: 12,
    width: 70,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 30,
    backgroundColor: '#f0f8ff',
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
    lineHeight: 20,
  },
  contactsContainer: {
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#1E90FF',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  // --- ADDED THIS STYLE ---
  checkboxSelected: {
    backgroundColor: '#1E90FF',
    borderColor: '#1E90FF',
  },
  contactImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
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
  notifyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  notifyText: {
    flex: 1,
    fontSize: 16,
    color: '#555',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#1E90FF',
    borderRadius: 25,
    paddingVertical: 12,
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
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#0066cc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  nextButtonDisabled: {
    backgroundColor: '#cccccc',
    elevation: 0,
    shadowOpacity: 0,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PersonalSafetyScreen;