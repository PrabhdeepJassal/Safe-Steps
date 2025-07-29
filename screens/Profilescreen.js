import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';

const ProfileScreen = ({ navigation, route }) => {
  // Simulate a user ID (in a real app, this would come from login/auth state)
  const userId = route?.params?.userId || 'user123'; // Replace with actual user ID from auth

  const [profilePicture, setProfilePicture] = useState(null);

  // Load the profile picture when the component mounts
  useEffect(() => {
    const loadProfilePicture = async () => {
      try {
        // For now, no persistent storage - starts fresh each time
        // You can implement a different storage solution later
        console.log('Profile picture will load from storage when implemented');
      } catch (error) {
        console.error('Error loading profile picture:', error);
      }
    };
    loadProfilePicture();
  }, [userId]);

  // Handle profile picture selection
  const handleSelectPicture = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Alert.alert('Error', 'Failed to select image: ' + response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const uri = response.assets[0].uri;
        setProfilePicture(uri);

        // Profile picture updated (no persistent storage for now)
        try {
          console.log('Profile picture updated:', uri);
          Alert.alert('Success', 'Profile picture updated!');
        } catch (error) {
          console.error('Error saving profile picture:', error);
          Alert.alert('Error', 'Failed to save profile picture');
        }
      }
    });
  };

  const handleLogout = () => {
    // Navigate back to the Login screen and reset the navigation stack
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>My Profile</Text>
        <TouchableOpacity style={styles.avatarContainer} onPress={handleSelectPicture}>
          {profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-circle-outline" size={80} color="#666666" />
              <Text style={styles.avatarText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Personal Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#888888"
          editable={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Address"
          placeholderTextColor="#888888"
          editable={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          placeholderTextColor="#888888"
          editable={false}
        />

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Emergency Info</Text>
        <TouchableOpacity style={styles.infoButton}
        onPress={() => navigation.navigate('medicalinfo')}>
          <Ionicons name="document-text-outline" size={20} color="#888888" style={styles.icon} />
          <Text style={styles.infoText}>Medical Information</Text>
        </TouchableOpacity>
        <TouchableOpacity 
        style={styles.infoButton} 
        onPress={() => navigation.navigate('emergencycontact')}
      >
        <Ionicons name="call-outline" size={20} color="#888888" style={styles.icon} />
        <Text style={styles.infoText}>Emergency Contacts</Text>
      </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
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
  headerContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
  },
  avatarContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 5,
  },
  formContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F5F7FA',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
    color: '#333333',
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 15,
  },
  icon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#333333',
  },
  logoutButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;