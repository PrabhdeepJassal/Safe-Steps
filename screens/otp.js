import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';

const EnterOTPScreen = ({ navigation, route }) => {
  const { emailOrPhone } = route.params;
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = useRef([]);

  const handleOtpChange = (text, index) => {
    if (text.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputRefs.current[index + 1].focus();
    }
    if (!text && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleResendOtp = () => {
    alert(`OTP resent to ${emailOrPhone}`);
  };

  const handleResetPassword = () => {
    const otpCode = otp.join('');
    if (otpCode.length === 4) {
      alert('OTP verified! Proceed to reset password.');
      navigation.navigate('resetPassword', { emailOrPhone }); // Changed to 'resetPassword'
    } else {
      alert('Please enter a valid 4-digit OTP');
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
        <Text style={styles.headerText}>Enter OTP</Text>
        <Text style={styles.subHeaderText}>
          Enter the OTP code we just sent you on your registered Email/Phone number
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              style={styles.otpInput}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              keyboardType="numeric"
              maxLength={1}
              ref={(ref) => (inputRefs.current[index] = ref)}
              autoFocus={index === 0}
            />
          ))}
        </View>

        <TouchableOpacity 
          style={styles.resetButton}
          onPress={handleResetPassword}
        >
          <Text style={styles.resetButtonText}>Reset Password</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResendOtp}>
          <Text style={styles.resendText}>Didn't get OTP? <Text style={styles.resendLink}>Resend OTP</Text></Text>
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 40,
  },
  otpInput: {
    width: 50,
    height: 50,
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  resetButton: {
    width: '100%',
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendLink: {
    color: '#1E90FF',
    fontWeight: 'bold',
  },
});

export default EnterOTPScreen;