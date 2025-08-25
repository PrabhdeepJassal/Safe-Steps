//maybe blank testing screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PushNotification from 'react-native-push-notification';

const EmergencySharing = ({ navigation, route }) => {
  const [modalVisible, setModalVisible] = useState(true);
  const [reason, setReason] = useState('');
  const [selectedContacts, setSelectedContacts] = useState({});

  const contacts = route.params?.contacts || [];

  const toggleContactSelection = (id) => {
    setSelectedContacts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Configure the notification
  const configureNotification = () => {
    PushNotification.configure({
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
      },
      requestPermissions: true,
    });

    // Create a permanent notification
    PushNotification.localNotification({
      channelId: "emergency-channel", // Required for Android
      title: "Emergency Sharing Active",
      message: "Your location is being shared with emergency contacts.",
      ongoing: true, // Makes the notification permanent (cannot be dismissed)
      id: 1, // Unique ID for the notification
    });
  };

  const handleShare = () => {
    console.log('Sharing with:', selectedContacts, 'Reason:', reason);
    setModalVisible(false);

    // Trigger the permanent notification
    configureNotification();

    // Navigate to the new screen
    navigation.replace('EmergencyActive', { selectedContacts, reason });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          navigation.goBack();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.header}>my Safety</Text>

            <View style={styles.iconContainer}>
              <Ionicons name="location" size={24} color="#ff4444" />
            </View>

            <Text style={styles.title}>Share status and real-time location?</Text>
            <Text style={styles.description}>
              Status updates and location will be shared with emergency contacts for 24h or until you stop sharing.{' '}
              <Text style={styles.linkText}>Change settings</Text>
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Reason for sharing (optional)"
              placeholderTextColor="#999"
              value={reason}
              onChangeText={setReason}
              maxLength={40}
            />
            <Text style={styles.charCount}>{reason.length}/40</Text>

            <Text style={styles.shareWithLabel}>Share with</Text>
            {contacts.length > 0 ? (
              contacts.map((contact) => (
                <TouchableOpacity
                  key={contact.id}
                  style={styles.contactItem}
                  onPress={() => toggleContactSelection(contact.id)}
                >
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
                    <Text style={styles.contactNumber}>{contact.mobile}</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleContactSelection(contact.id)}>
                    <Ionicons
                      name={selectedContacts[contact.id] ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={selectedContacts[contact.id] ? '#007AFF' : '#666'}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noContactsText}>No emergency contacts available.</Text>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton} 
              
              onPress={() => navigation.navigate('emergencyactivescreen')}>
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  iconContainer: {
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  linkText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    padding: 10,
    fontSize: 16,
    marginBottom: 5,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  shareWithLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
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
  contactNumber: {
    fontSize: 14,
    color: '#666',
  },
  noContactsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  shareButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  shareButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default EmergencySharing;