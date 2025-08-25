import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Create the context
const AuthContext = createContext();

// 2. Create a provider component
export const AuthProvider = ({ children }) => {
  const [authStatus, setAuthStatus] = useState(null); // Start as null to indicate loading
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This function runs when the provider mounts (app starts)
    const loadAuthStatus = async () => {
      try {
        // Try to get the auth status from storage
        const savedStatus = await AsyncStorage.getItem('authStatus');
        if (savedStatus) {
          // If we found a status, update our state
          setAuthStatus(savedStatus);
        } else {
          // No saved status, so user is logged out
          setAuthStatus('loggedOut');
        }
      } catch (error) {
        // An error occurred, default to logged out
        console.error("Failed to load auth status:", error);
        setAuthStatus('loggedOut');
      } finally {
        // We're done loading
        setIsLoading(false);
      }
    };

    loadAuthStatus();
  }, []); // The empty array ensures this effect runs only once

  const login = async () => {
    try {
      await AsyncStorage.setItem('authStatus', 'loggedIn');
      setAuthStatus('loggedIn');
    } catch (error) {
      console.error("Failed to save auth status:", error);
    }
  };

  const loginAsGuest = () => {
    // Guest status is temporary and should not be saved to storage
    setAuthStatus('guest');
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authStatus');
      setAuthStatus('loggedOut');
    } catch (error) {
      console.error("Failed to remove auth status:", error);
    }
  };

  const value = {
    authStatus,
    isLoading, // Expose the loading state
    login,
    loginAsGuest,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. Create a custom hook to use the context easily
export const useAuth = () => {
  return useContext(AuthContext);
};