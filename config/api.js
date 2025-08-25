// API Configuration
import { Platform } from 'react-native';

// Direct API URL - no complex logic that could fail
const API_BASE_URL = 'https://safe-steps-xo5s.onrender.com';

const API_CONFIG = {
  BASE_URL: API_BASE_URL,
};

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  HEALTH: `${API_BASE_URL}/api/health`,
  // Add more endpoints as needed
};

// Debug: Log the current API URL
console.log('🚀 API Configuration:', {
  Platform: Platform.OS,
  BaseURL: API_BASE_URL,
  LoginEndpoint: API_ENDPOINTS.LOGIN,
  isDev: __DEV__
});

export default API_CONFIG;
