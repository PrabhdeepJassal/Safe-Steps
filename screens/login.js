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

  const handleLogin = () => {
    if (email && password) {
      navigation.replace('Main');
    } else {
      alert('Please enter email and password');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.logoContainer}>
        <Image source={require('../assets/images/toes.png')} style={styles.logo} />
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

        <TouchableOpacity style={styles.forgotPassword}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  title: {
    fontFamily: 'arsenal',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 10,
  },
  subtitle: {
    fontFamily: 'radley',
    fontSize: 14,
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    height: 50,
    width: '95%',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  passwordContainer: {
    width: '95%',
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  eyeIcon: {
    fontSize: 18,
    marginLeft: 10,
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
    backgroundColor: '#000',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: 'rgba(0, 0, 0, 1)',
    shadowOffset: { width: 8, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButton: {
    width: '95%',
    marginLeft: 10,
    backgroundColor: '#f5f5f5',
    height: 50,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleLogo: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginRight: 20,
  },
  googleButtonText: {
    fontSize: 17,
    color: '#000',
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