import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';

const ForgotPasswordScreen = ({ navigation }) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');

  const handleContinue = () => {
    if (emailOrPhone) {
      navigation.navigate('otp', { emailOrPhone });
    } else {
      alert('Please enter your Email ID or Mobile Number');
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
        <Text style={styles.headerText}>Forget Password</Text>
        <Text style={styles.subHeaderText}>
          Enter your email we'll send the OTP to reset your password
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email ID/Mobile Number"
          value={emailOrPhone}
          onChangeText={setEmailOrPhone}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
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
    marginBottom: 10,
    textAlign: 'center',
  },
  subHeaderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    backgroundColor: '#F5F7FA',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;