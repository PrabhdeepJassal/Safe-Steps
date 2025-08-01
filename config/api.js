// API Configuration
import { Platform } from 'react-native';

// Simple configuration - easier to debug
const getApiUrl = () => {
  // Check if we're in development mode
  if (__DEV__) {
    // For development, choose based on how you're testing:
    
    // Option 1: Android Emulator
    if (Platform.OS === 'android') {
      // Comment out this line and uncomment the IP line below if using Expo Go on physical device
      // return 'http://10.0.2.2:3000';
      
      // For Expo Go on physical Android device, use your computer's IP:
      return 'http://192.168.24.194:3000';
    }
    
    // Option 2: iOS Simulator or physical iOS device with Expo Go
    if (Platform.OS === 'ios') {
      // For iOS simulator, use localhost
      // return 'http://localhost:3000';
      
      // For Expo Go on physical iOS device, use your computer's IP:
      return 'http://192.168.24.194:3000';
    }
    
    // Default fallback - use your computer's IP for Expo Go
    return 'http://192.168.24.194:3000';
  } else {
    // Production mode
    return 'https://your-production-server.com';
  }
};

const API_CONFIG = {
  BASE_URL: getApiUrl(),
};

export const API_ENDPOINTS = {
  LOGIN: `${API_CONFIG.BASE_URL}/api/auth/login`,
  SIGNUP: `${API_CONFIG.BASE_URL}/api/auth/signup`,
  // Add more endpoints as needed
};

// Debug: Log the current API URL
console.log('API Configuration:', {
  Platform: Platform.OS,
  BaseURL: API_CONFIG.BASE_URL,
  isDev: __DEV__
});

export default API_CONFIG;
