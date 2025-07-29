import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = ({ navigation, route }) => {
  // In a real app, this would come from a global state (Context, Redux, etc.)
  const userId = route?.params?.userId || 'user123'; 

  const [profilePicture, setProfilePicture] = useState(null);

  // Load the profile picture from storage when the component mounts
  useEffect(() => {
    const loadProfilePicture = async () => {
      try {
        const storedPictureUri = await AsyncStorage.getItem(`profilePicture_${userId}`);
        if (storedPictureUri) {
          setProfilePicture(storedPictureUri);
        }
      } catch (error) {
        console.error('Error loading profile picture from storage:', error);
      }
    };
    loadProfilePicture();
  }, [userId]);

  /**
   * Shows an alert with options to take a photo or choose from the gallery.
   */
  const handleSelectPicture = () => {
    Alert.alert(
      "Update Profile Picture",
      "Choose an option to set your profile picture.",
      [
        {
          text: "Take Photo",
          onPress: () => openImagePicker('camera'),
        },
        {
          text: "Choose from Gallery",
          onPress: () => openImagePicker('library'),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  /**
   * Opens the device's camera or image library based on the selected type.
   * @param {'camera' | 'library'} type - The type of image picker to launch.
   */
  const openImagePicker = (type) => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      saveToPhotos: true,
    };

    const launch = type === 'camera' ? launchCamera : launchImageLibrary;

    launch(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Alert.alert('Image Picker Error', `Code: ${response.errorCode}, Message: ${response.errorMessage}`);
      } else if (response.assets && response.assets.length > 0) {
        const uri = response.assets[0].uri;
        setProfilePicture(uri);

        // Save the new image URI to AsyncStorage, associated with the user ID
        try {
          await AsyncStorage.setItem(`profilePicture_${userId}`, uri);
          Alert.alert('Success', 'Profile picture has been updated!');
        } catch (error) {
          console.error('Error saving profile picture to storage:', error);
          Alert.alert('Error', 'Failed to save the new profile picture.');
        }
      }
    });
  };

  /**
   * Handles user logout by resetting the navigation stack to the Login screen.
   */
  const handleLogout = () => {
    // Here you would also clear any user session data (tokens, etc.)
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
        {/* These inputs are placeholders. In a real app, they would be populated with user data. */}
        <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#888888" editable={false} />
        <TextInput style={styles.input} placeholder="Address" placeholderTextColor="#888888" editable={false} />
        <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#888888" editable={false} />

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Emergency & Security</Text>
        
        <TouchableOpacity style={styles.infoButton} onPress={() => navigation.navigate('medicalinfo')}>
          <Ionicons name="document-text-outline" size={20} color="#888888" style={styles.icon} />
          <Text style={styles.infoText}>Medical Information</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.infoButton} onPress={() => navigation.navigate('emergencycontact')}>
          <Ionicons name="call-outline" size={20} color="#888888" style={styles.icon} />
          <Text style={styles.infoText}>Emergency Contacts</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.infoButton} onPress={() => navigation.navigate('securitypin')}>
          <Ionicons name="settings-outline" size={20} color="#888888" style={styles.icon} />
          <Text style={styles.infoText}>Security PIN</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoButton} onPress={() => navigation.navigate('audithistory')}>
          <Ionicons name="settings-outline" size={20} color="#888888" style={styles.icon} />
          <Text style={styles.infoText}>Audit Screen History</Text>
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
