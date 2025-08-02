// API Configuration
import { Platform } from 'react-native';

const getApiUrl = () => {
  // Check if we're in development mode
  if (__DEV__) {
    // DEVELOPMENT: Local server
    // Update this IP when you change networks
    return 'http://192.168.29.111:3000';
  } else {
    // PRODUCTION: Render deployed backend
    // This URL works from anywhere in the world!
    return 'https://safesteps-api.onrender.com';
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
