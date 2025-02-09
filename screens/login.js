import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isDarkMode, setDarkMode] = useState(false);

  const handleLogin = () => {
    if (email && password) {
      navigation.replace('Main');
    } else {
      alert('Please enter email and password');
    }
  };

  const themeStyles = isDarkMode ? darkTheme : lightTheme;

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.mainContainer}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/logologin.png')} // Replace this path with your actual image path
            // style={{ width: '10%', height: '100%' }} 
            style={styles.logoImage}

          />

          <Text style={[styles.logoTitle, themeStyles.text]}>Safe Steps</Text>
          <Text style={[styles.logoSubtitle, themeStyles.text]}>
            Because Every Step Matters
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <View style={[styles.inputContainer, themeStyles.inputContainer]}>
            <TextInput
              style={[styles.input, themeStyles.input]}
              placeholder="Email or Username"
              placeholderTextColor={themeStyles.placeholder.color}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputContainer, themeStyles.inputContainer]}>
            <TextInput
              style={[styles.input, themeStyles.input]}
              placeholder="Password"
              placeholderTextColor={themeStyles.placeholder.color}
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.visibilityToggle}
              onPress={() => setPasswordVisible(!isPasswordVisible)}
            >
              <Text style={[styles.visibilityText, themeStyles.text]}>👁️</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, themeStyles.button]}
            onPress={handleLogin}
          >
            <Text style={[styles.loginButtonText, themeStyles.buttonText]}>
              Log in
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, themeStyles.dividerLine]} />
            <Text style={[styles.dividerText, themeStyles.text]}>
              Or continue with
            </Text>
            <View style={[styles.dividerLine, themeStyles.dividerLine]} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, themeStyles.buttonSecondary]}
          >
            <Text style={[styles.googleButtonText, themeStyles.text]}>
              Log in with Google
            </Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={[styles.signupText, themeStyles.text]}>
              Not a member?{' '}
              <Text style={styles.signupLink}>Sign up</Text>
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const lightTheme = {
  container: {
    backgroundColor: '#f4f4f4',
  },
  text: {
    color: '#000',
  },
  inputContainer: {
    backgroundColor: '#fff',
  },
  input: {
    color: '#333',
  },
  placeholder: {
    color: '#bbb',
  },
  button: {
    backgroundColor: '#000',
  },
  buttonText: {
    color: '#fff',
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  dividerLine: {
    backgroundColor: '#ddd',
  },
};

const darkTheme = {
  container: {
    backgroundColor: '#121212',
  },
  text: {
    color: '#f4f4f4',
  },
  inputContainer: {
    backgroundColor: '#1e1e1e',
  },
  input: {
    color: '#fff',
  },
  placeholder: {
    color: '#666',
  },
  button: {
    backgroundColor: '#333',
  },
  buttonText: {
    color: '#f4f4f4',
  },
  buttonSecondary: {
    backgroundColor: '#1e1e1e',
    borderColor: '#444',
    borderWidth: 1,
  },
  dividerLine: {
    backgroundColor: '#444',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
    marginTop: -50,
    marginBottom: -60,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 5,
  },
  logoSubtitle: {
    fontSize: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  visibilityToggle: {
    padding: 10,
  },
  loginButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
  },
  googleButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  signupContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
  },
  signupLink: {
    fontWeight: 'bold',
  },
});

export default LoginScreen;
