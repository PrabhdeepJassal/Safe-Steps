import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Alert,
  Modal,
  TextInput,
  Vibration,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';

const PIN_STORAGE_KEY = '@user_security_pin';
const DOUBLE_PRESS_DELAY = 500;

export default function SOSActiveScreen() {
  const navigation = useNavigation();
  const sound = useRef(new Audio.Sound());

  const [isSosActive, setIsSosActive] = useState(false);
  const [lastPress, setLastPress] = useState(0);
  const [storedPin, setStoredPin] = useState(null);
  const [enteredPin, setEnteredPin] = useState('');
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // This useEffect now only configures and loads the audio using expo-av
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeAndroid: 1,
          shouldDuckAndroid: false,
        });
        console.log("Audio mode configured for silent mode playback.");
      } catch (error) {
        console.error("Failed to configure audio mode", error);
      }
    };
    
    const loadSound = async () => {
      try {
        await sound.current.loadAsync(require('../assets/siren.mp3'), { isLooping: true });
        console.log("Siren sound loaded.");
      } catch (error) {
        console.error("Failed to load sound", error);
      }
    };

    const loadStoredPin = async () => {
      const pin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
      if (pin) {
          setStoredPin(pin)
      } else {
          Alert.alert('PIN Not Set', 'You must set a security PIN.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    };
    
    configureAudio();
    loadStoredPin();
    loadSound();

    return () => {
      sound.current.unloadAsync();
    };
  }, [navigation]);
  
  // Animation for the SOS button pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnimation, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnimation]);
  
  const handleSosPress = async () => {
    const timeNow = Date.now();
    if (timeNow - lastPress < DOUBLE_PRESS_DELAY) {
      setIsSosActive(true);
      setLastPress(0);
      Vibration.vibrate([0, 500, 200, 500]);
      
      try {
        // We now rely solely on replayAsync to play at max volume *relative to the media channel*
        await sound.current.replayAsync({ volume: 1.0, isLooping: true });
        console.log('SOS ACTIVATED, SIREN PLAYING');
      } catch (error) {
        console.error("Failed to play sound", error);
      }
      
    } else {
      setLastPress(timeNow);
      Vibration.vibrate(50);
    }
  };

  const handlePinSubmit = async () => {
    if (enteredPin === storedPin) {
      try {
        await sound.current.stopAsync();
        console.log('SOS DEACTIVATED, SIREN STOPPED');
      } catch (error) {
        console.error("Failed to stop sound", error);
      }

      Vibration.cancel();
      setIsSosActive(false);
      setEnteredPin('');
      Alert.alert('Siren Off', 'The alarm has been turned off.');

    } else {
      triggerShake();
      setEnteredPin('');
    }
  };
  
  const triggerShake = () => {
    Vibration.vibrate(200);
    shakeAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#333" />
      </TouchableOpacity>
      <View style={styles.inactiveContainer}>
        <Text style={styles.inactiveTitle}>Emergency SOS</Text>
        <Text style={styles.inactiveSubtitle}>Press the button twice quickly to activate the siren.</Text>
        <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
          <TouchableOpacity style={styles.sosButton} onPress={handleSosPress} activeOpacity={0.8}>
            <Text style={styles.sosButtonText}>SOS</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      <Modal transparent={true} animationType="fade" visible={isSosActive} onRequestClose={() => {}}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={48} color="#FF3B30" style={{ marginBottom: 15 }} />
            <Text style={styles.modalTitle}>Siren Activated</Text>
            <Text style={styles.modalMessage}>Enter your PIN to turn off the siren.</Text>
            <Animated.View style={{ transform: [{ translateX: shakeAnimation }], width: '100%' }}>
              <TextInput style={styles.pinInput} placeholder="* * * *" placeholderTextColor="#a0a0a0" keyboardType="numeric" maxLength={4} value={enteredPin} onChangeText={setEnteredPin} secureTextEntry={true} autoFocus={true} />
            </Animated.View>
            <TouchableOpacity style={styles.dismissButton} onPress={handlePinSubmit}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
              <Text style={styles.dismissButtonText}>Turn Off Siren</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F0F0' },
  backButton: { position: 'absolute', top: Platform.OS === 'android' ? 40 : 60, left: 20, zIndex: 10 },
  inactiveContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inactiveTitle: { fontSize: 32, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 10 },
  inactiveSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', paddingHorizontal: 40, marginBottom: 60 },
  sosButton: { width: 200, height: 200, borderRadius: 100, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 20 },
  sosButtonText: { color: '#FFFFFF', fontSize: 52, fontWeight: 'bold' },
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.75)' },
  modalContent: { width: '85%', maxWidth: 350, backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
  modalMessage: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 25 },
  pinInput: { width: '80%', alignSelf: 'center', height: 55, borderColor: '#ddd', borderWidth: 1, borderRadius: 12, textAlign: 'center', fontSize: 24, letterSpacing: 15, marginBottom: 20, backgroundColor: '#f9f9f9' },
  dismissButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#34C759', paddingVertical: 14, borderRadius: 12, width: '100%' },
  dismissButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 10 },
});