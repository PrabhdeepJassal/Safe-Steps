import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PushNotification from 'react-native-push-notification';

const EmergencyActiveScreen = ({ navigation, route }) => {
  const { selectedContacts, reason } = route.params;

  // Function to stop sharing and cancel the notification
  const handleStopSharing = () => {
    // Cancel the permanent notification
    PushNotification.cancelLocalNotification({ id: '1' });

    // Navigate back to the previous screen or home
    navigation.navigate('PersonalSafety'); // Adjust the screen name as per your navigation stack
  };

  // Function to call 112
  const handleCallEmergency = () => {
    Linking.openURL('tel:112');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Emergency Sharing</Text>
      </View>

      <Text style={styles.shareWithLabel}>Sharing with</Text>
      {Object.keys(selectedContacts).length > 0 ? (
        Object.keys(selectedContacts)
          .filter((id) => selectedContacts[id])
          .map((id) => {
            const contact = route.params.contacts.find((c) => c.id === id);
            return (
              <View key={id} style={styles.contactItem}>
                {contact.photo ? (
                  <Image source={{ uri: contact.photo }} style={styles.contactIcon} />
                ) : (
                  <View style={styles.contactIcon}>
                    <Text style={styles.contactInitials}>
                      {contact.name
                        .split(' ')
                        .map(word => word.charAt(0))
                        .join('')
                        .toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                </View>
                <TouchableOpacity>
                  <Ionicons name="share-outline" size={24} color="#007AFF" />
                </TouchableOpacity>
              </View>
            );
          })
      ) : (
        <Text style={styles.noContactsText}>No contacts selected.</Text>
      )}

      <View style={styles.statusContainer}>
        <Ionicons name="location" size={24} color="#ff4444" style={styles.statusIcon} />
        <Text style={styles.statusText}>Started Emergency Sharing</Text>
        <Text style={styles.timeText}>1:15 pm</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.stopButton} onPress={handleStopSharing}>
          <Ionicons name="close" size={24} color="#FFF" />
          <Text style={styles.stopButtonText}>Stop</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.callButton} onPress={handleCallEmergency}>
          <Ionicons name="call" size={24} color="#000" />
          <Text style={styles.callButtonText}>Call 112</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  header: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 20,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  shareWithLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  noContactsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  statusIcon: {
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  stopButton: {
    backgroundColor: '#FF4444',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 5,
  },
  callButton: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  callButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 5,
  },
});

export default EmergencyActiveScreen;