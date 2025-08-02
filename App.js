import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, SafeAreaView, StyleSheet } from 'react-native';
import LoginScreen from './screens/login/login';
import HomeScreen from './screens/homescreen';
import authorityno from './screens/emergency/authorityno';
import MapScreen from './screens/navigation/saferoutes';
import ProfileScreen from './screens/Profilescreen';
import CallSignScreen from './screens/Callscreen';
import SignupScreen from './screens/login/SignupScreen';
import ForgotPasswordScreen from './screens/login/forgot';
import OtpScreen from './screens/login/otp';
import ResetPasswordScreen from './screens/login/resetpass';
import EmergencyContactsScreen from './screens/emergency/emergencycontact';
import EmergencyActiveScreen from './screens/emergency/emergencyactivescreen';
import medicalinfo from './screens/medicalinfo';
import EmergencySharing from './screens/emergency/emergencysharing';
import NavigationScreen from './screens/navigation/navigationscreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LiveSharingScreen from './screens/emergency/livesharing';
import usernavigation from './screens/navigation/usernavigation';
import securitypin from './screens/securitypin';
import emergencyrecord from './screens/recordscreen';
import auditscreen from './screens/audit/auditscreen';
import audithistory from './screens/audit/audithistoryscreen';
import SOSActiveScreen from './screens/SOSscreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Safe Routes') {
            iconName = focused ? 'navigate' : 'navigate-outline';
          } else if (route.name === 'Call') {
            iconName = focused ? 'call' : 'call-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
        tabBarActiveTintColor: 'black',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          position: 'absolute',
          bottom: -15,
          left: 20,
          right: 20,
          elevation: 0,
          backgroundColor: '#ffffff',
          borderRadius: 30,
          height: 85,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.25,
          shadowRadius: 5.5,
          elevation: 4,
          paddingBottom: 0,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: { paddingBottom: 5 },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Safe Routes" component={MapScreen} />
      <Tab.Screen name="Call" component={CallSignScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const TabNavigatorWrapper = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <TabNavigator />
    </SafeAreaView>
  );
};

const RootStack = () => {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="signup" component={SignupScreen} options={{ headerShown: false }} />
      <Stack.Screen name="forgot" component={ForgotPasswordScreen} options={{ headerShown: false }} />
      <Stack.Screen name="otp" component={OtpScreen} options={{ headerShown: false }} />
      <Stack.Screen name="resetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
      <Stack.Screen name="emergencycontact" component={EmergencyContactsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="medicalinfo" component={medicalinfo} options={{ headerShown: false }} />
      <Stack.Screen name="emergencysharing" component={EmergencySharing} options={{ headerShown: false }} />
      <Stack.Screen name="emergencyactivescreen" component={EmergencyActiveScreen} options={{ headerShown: false }} />
      <Stack.Screen name="authorityno" component={authorityno} options={{ headerShown: false }} />
      <Stack.Screen name="NavigationScreen" component={NavigationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="usernavigation" component={usernavigation} options={{ headerShown: false }} />
      <Stack.Screen name="LiveSharing" component={LiveSharingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CallSignScreen" component={CallSignScreen} options={{ headerShown: false }} />
      <Stack.Screen name="securitypin" component={securitypin} options={{ headerShown: false }} />
      <Stack.Screen name="emergencyrecord" component={emergencyrecord} options={{ headerShown: false }} />
      <Stack.Screen name="auditscreen" component={auditscreen} options={{ headerShown: false }} />
      <Stack.Screen name="audithistory" component={audithistory} options={{ headerShown: false }} />
      <Stack.Screen name="SOSactive" component={SOSActiveScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Main" component={TabNavigatorWrapper} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView style={styles.safeArea}>
        <RootStack />
      </SafeAreaView>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});