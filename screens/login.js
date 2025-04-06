import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Platform,
  Animated,
} from 'react-native';
import * as Font from 'expo-font';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [translateYAnim] = useState(new Animated.Value(0)); // Start at center (0 relative to center)

  // Load fonts
  useEffect(() => {
    const loadFonts = async () => {
      await Font.loadAsync({
        'Arsenal-Regular': require('../assets/fonts/Arsenal/Arsenal-Bold.ttf'),
        'Radley-Regular': require('../assets/fonts/Radley/Radley-Regular.ttf'),
      });
      setFontsLoaded(true);
    };
    loadFonts();
  }, []);

  // Logo animation
  useEffect(() => {
    Animated.sequence([
      // Fade in at center
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Move up to final position
      Animated.timing(translateYAnim, {
        toValue: -220, // Adjust this value based on how far up you want it to move
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAnimationComplete(true);
    });
  }, [fadeAnim, translateYAnim]);

  const handleLogin = () => {
    if (email && password) {
      navigation.replace('Main');
    } else {
      alert('Please enter email and password');
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <Text>Loading fonts...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#FFFFFF"
        translucent={false}
      />
      <View style={styles.innerContainer}>
        {/* Logo starts centered and moves up */}
        <Animated.View 
          style={[
            styles.logoWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateYAnim }],
              position: 'absolute',
              top: '50%', // Center vertically
              alignSelf: 'center',
              marginTop: -75, // Half of logo height to truly center it
            },
          ]}
        >
          <Image 
            source={require('../assets/images/toes.png')} 
            style={styles.logo} 
          />
        </Animated.View>

        {/* Show title, subtitle, and form after animation */}
        {animationComplete && (
          <View style={styles.contentContainer}>
            <View style={styles.logoContainer}>
              <Image 
 source={{ uri: 'https://via.placeholder.com/250x150' }}                style={styles.logo} 
              />
              <Text style={styles.title}>Safe Steps</Text>
              <Text style={styles.subtitle}>BECAUSE EVERY STEP MATTERS</Text>
            </View>

            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setPasswordVisible(!isPasswordVisible)}>
                  <Text style={styles.eyeIcon}>👁️</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={() => navigation.navigate('forgot')}
              >
                <Text style={styles.forgotPasswordText}>Forget Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>Log In</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.googleButton}>
                <Image 
                  source={require('../assets/images/googlelogo.png')}
                  style={styles.googleLogo}
                />
                <Text style={styles.googleButtonText}>Log in with Google</Text>
              </TouchableOpacity>

              <Text style={styles.signupText}>
                Don’t have an account?{' '}
                <Text style={styles.signupLink} onPress={() => navigation.navigate('signup')}>
                  Sign Up
                </Text>
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  innerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrapper: {
    borderRadius: 75,
    backgroundColor: '#ffffff',
    padding: 10,
    zIndex: 1, // Ensure it stays above other elements during animation
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  title: {
    fontFamily: 'Arsenal-Regular',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 10,
  },
  subtitle: {
    fontFamily: 'Radley-Regular',
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  input: {
    height: 50,
    width: '95%',
    marginLeft: 10,
    backgroundColor: '#F5F7FA',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 16,
   marginBottom: 15,
  },
  passwordContainer: {
    width: '95%',
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  eyeIcon: {
    width: 20,
    height: 20,
    tintColor: '#888888',
  },
  forgotPassword: {
    marginRight: 10,
    alignSelf: 'flex-end',
    marginBottom: 15,
  },
  forgotPasswordText: {
    color: 'grey',
  },
  loginButton: {
    width: '95%',
    marginLeft: 10,
    marginTop: 40,
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButton: {
    width: '95%',
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FA',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  googleLogo: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  signupText: {
    textAlign: 'center',
    fontSize: 14,
  },
  signupLink: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
});

export default LoginScreen;