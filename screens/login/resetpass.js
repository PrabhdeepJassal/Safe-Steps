import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // For the eye icon

const ResetPasswordScreen = ({ navigation, route }) => {
  const { emailOrPhone } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false); // Toggle for new password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Toggle for confirm password visibility
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for the button

  const handleResetPassword = () => {
    if (newPassword && confirmPassword) {
      if (newPassword === confirmPassword) {
        setIsSubmitting(true); // Show loading state
        // Simulate an API call to reset the password
        setTimeout(() => {
          setIsSubmitting(false);
          alert('Password reset successfully!');
          navigation.navigate('Login'); // Navigate back to Login screen
        }, 2000); // Simulate a 2-second delay
      } else {
        alert('Passwords do not match');
      }
    } else {
      alert('Please fill in both password fields');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <Text style={styles.headerText}>Reset Password</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="••••••"
            placeholderTextColor="#666"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowNewPassword(!showNewPassword)}
          >
            <Ionicons
              name={showNewPassword ? 'eye' : 'eye-off'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="••••••"
            placeholderTextColor="#666"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? 'eye' : 'eye-off'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.resetButton}
          onPress={handleResetPassword}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" style={styles.spinner} />
              <Text style={styles.resetButtonText}>Submitting...</Text>
            </>
          ) : (
            <Text style={styles.resetButtonText}>Reset Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  backButton: {
    marginTop: 40,
  },
  backIcon: {
    fontSize: 24,
    color: '#000',
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    backgroundColor: '#F5F7FA',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#1E90FF', // Blue border to match the design
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  resetButton: {
    width: '100%',
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  spinner: {
    marginRight: 10,
  },
});

export default ResetPasswordScreen;