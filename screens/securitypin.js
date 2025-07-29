import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Animated,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Key for storing the PIN in AsyncStorage
const PIN_STORAGE_KEY = '@user_security_pin';

// Reusable PIN Input Component
const PinInput = ({ label, pin, onPinChange, error }) => {
  const inputs = useRef([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (error) {
      shakeAnimation.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  const handlePinChange = (text, index) => {
    const newPin = pin.split('');
    newPin[index] = text;
    onPinChange(newPin.join(''));

    // Move to next input
    if (text && index < 3) {
      inputs.current[index + 1].focus();
    }
  };

  const handleBackspace = (e, index) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        inputs.current[index - 1].focus();
      }
    }
  };

  return (
    <Animated.View style={[styles.inputGroup, { transform: [{ translateX: shakeAnimation }] }]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pinContainer}>
        {[0, 1, 2, 3].map((index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputs.current[index] = ref)}
            style={[styles.pinInput, error ? styles.pinInputError : null]}
            keyboardType="numeric"
            maxLength={1}
            secureTextEntry
            value={pin[index] || ''}
            onChangeText={(text) => handlePinChange(text, index)}
            onKeyPress={(e) => handleBackspace(e, index)}
          />
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </Animated.View>
  );
};

export default function SecurityPinScreen() {
  const navigation = useNavigation();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isPinSet, setIsPinSet] = useState(false);
  
  // State for handling errors to trigger animations
  const [errorState, setErrorState] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    const loadPin = async () => {
      const storedPin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
      setIsPinSet(!!storedPin);
    };
    loadPin();
  }, []);

  const handleSetOrResetPin = async () => {
    // Clear previous errors
    setErrorState({ current: '', new: '', confirm: '' });

    // Validation
    if (isPinSet) {
        const storedPin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
        if (currentPin.length !== 4 || currentPin !== storedPin) {
            setErrorState(prev => ({ ...prev, current: 'Current PIN is incorrect.' }));
            return;
        }
    }
    if (newPin.length !== 4) {
      setErrorState(prev => ({ ...prev, new: 'PIN must be 4 digits.' }));
      return;
    }
    if (newPin !== confirmPin) {
      setErrorState(prev => ({ ...prev, confirm: 'PINs do not match.' }));
      return;
    }

    // Save the new PIN
    try {
      await AsyncStorage.setItem(PIN_STORAGE_KEY, newPin);
      Alert.alert(
        'Success!',
        `Your security PIN has been ${isPinSet ? 'reset' : 'set'} successfully.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setIsPinSet(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to save the PIN. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={28} color="#333" />
      </TouchableOpacity>
      
      <View style={styles.content}>
        <Text style={styles.title}>{isPinSet ? 'Reset Security PIN' : 'Set Security PIN'}</Text>
        <Text style={styles.subtitle}>
          {isPinSet ? 'Enter your old PIN and create a new one.' : 'Create a 4-digit PIN for account security.'}
        </Text>

        {isPinSet && (
          <PinInput
            label="Current PIN"
            pin={currentPin}
            onPinChange={setCurrentPin}
            error={errorState.current}
          />
        )}
        
        <PinInput
          label="New PIN"
          pin={newPin}
          onPinChange={setNewPin}
          error={errorState.new}
        />

        <PinInput
          label="Confirm New PIN"
          pin={confirmPin}
          onPinChange={setConfirmPin}
          error={errorState.confirm}
        />
        
        <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSetOrResetPin}>
              <Text style={styles.saveButtonText}>{isPinSet ? 'Reset PIN' : 'Set PIN'}</Text>
            </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// 🎨 New and improved StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 20 : 60,
    left: 20,
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginBottom: 12,
    fontWeight: '500',
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pinInput: {
    width: 60,
    height: 60,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  pinInputError: {
      borderColor: '#D93B3B', // Red border for error
  },
  errorText: {
      color: '#D93B3B',
      marginTop: 8,
      fontSize: 14,
  },
  buttonContainer: {
      marginTop: 30,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    // Shadow for iOS
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    // Elevation for Android
    elevation: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});