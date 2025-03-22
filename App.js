import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'react-native';
import LoginScreen from './screens/login';
import HomeScreen from './screens/homescreen';
import SafeRoutesScreen from './screens/saferoutes';
import ProfileScreen from './screens/Profilescreen';
import CallSignScreen from './screens/Callscreen';
import SignupScreen from './screens/SignupScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
          } else if (route.name === 'Call Sign') {
            iconName = focused ? 'call' : 'call-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: -10, // Changed from 25 to 0 to sit at the bottom
          left: 20,
          right: 20,
          elevation: 0,
          backgroundColor: '#ffffff',
          borderRadius: 30, // Still applies to top corners
          height: 85,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.25,
          shadowRadius: 5.5,
          elevation: 4,
          paddingBottom: 0, // Removed paddingBottom to align content closer to bottom
        },
        tabBarLabelStyle: { paddingBottom: 5 },
      })}
      tabBarOptions={{
        activeTintColor: 'black',
        inactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Safe Routes" component={SafeRoutesScreen} />
      <Tab.Screen name="Call Sign" component={CallSignScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const RootStack = () => {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="signup"
        component={SignupScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Main" 
        component={TabNavigator} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <RootStack />
    </NavigationContainer>
  );
}