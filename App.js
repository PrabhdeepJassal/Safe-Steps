import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StatusBar } from 'react-native';

// Import Material Icons from react-native-vector-icons
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Import screens from the screens folder
import LoginScreen from './screens/login'; // Assuming it's in the 'screens' folder
import HomeScreen from './screens/homescreen'; // Assuming it's in the 'screens' folder
import SafeRoutesScreen from './screens/saferoutes';  // Example screen
import ProfileScreen from './screens/Profilescreen'; // Example screen

// Create the Stack Navigator
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Create Bottom Tab Navigator with your screens
import Ionicons from 'react-native-vector-icons/Ionicons'; // Changed to Ionicons

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
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
      tabBarOptions={{
        activeTintColor: 'black',
        inactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: false }} // Hides the header for Home screen
      />
      <Tab.Screen name="Safe Routes" component={SafeRoutesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// App component with navigation setup
export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" hidden={true} /> {/* Hides the status bar */}
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} // Hides the header for Login screen
        />
        <Stack.Screen 
          name="Main" 
          component={TabNavigator} 
          options={{ headerShown: false }} // Hides the header for the TabNavigator
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
