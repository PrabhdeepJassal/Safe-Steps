import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Linking } from 'react-native';

// Static Indian emergency numbers
const indianEmergencyNumbers = {
  disaster: '1070', // National Disaster Helpline
  women: '1091',   // Women Helpline
  child: '1098',   // Child Helpline
  police: '112',   // National Emergency Number (Police)
  fire: '101',     // Fire and Rescue
  ambulance: '102', // Ambulance
};

const EmergencyContactsScreen = ({ navigation }) => {
  // Function to handle phone call
  const makeCall = (number) => {
    Linking.openURL(`tel:${number}`).catch((err) => console.error('Failed to make call:', err));
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button and Title */}
      <View style={styles.header}>
      <TouchableOpacity
  style={styles.backButton}
  onPress={() => navigation.goBack()} // Navigates back to the previous screen
>

          <Ionicons name="arrow-back-outline" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.contactsContainer}>
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => makeCall(indianEmergencyNumbers.disaster)}
          >
            <Ionicons name="alert-circle-outline" size={30} color="#ff4500" />
            <Text style={styles.contactText}>Disaster Helpline: {indianEmergencyNumbers.disaster}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => makeCall(indianEmergencyNumbers.women)}
          >
            <Ionicons name="woman-outline" size={30} color="#ff69b4" />
            <Text style={styles.contactText}>Women Helpline: {indianEmergencyNumbers.women}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => makeCall(indianEmergencyNumbers.child)}
          >
            <Ionicons name="happy-outline" size={30} color="#32cd32" />
            <Text style={styles.contactText}>Child Helpline: {indianEmergencyNumbers.child}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => makeCall(indianEmergencyNumbers.police)}
          >
            <Ionicons name="shield-outline" size={30} color="#1e90ff" />
            <Text style={styles.contactText}>Police: {indianEmergencyNumbers.police}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => makeCall(indianEmergencyNumbers.fire)}
          >
            <Ionicons name="flame-outline" size={30} color="#ff8c00" />
            <Text style={styles.contactText}>Fire and Rescue: {indianEmergencyNumbers.fire}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => makeCall(indianEmergencyNumbers.ambulance)}
          >
            <Ionicons name="medkit-outline" size={30} color="#ff0000" />
            <Text style={styles.contactText}>Ambulance: {indianEmergencyNumbers.ambulance}</Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={24} color="#666" style={styles.infoIcon} />
        <View style={styles.infoContent}>
          <Text style={styles.infoText}>
            To help in an emergency, Touch these contacts to call them directly.
          </Text>
          
        </View>
      </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Light gray background for a clean look
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 0,
    marginVertical: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40, // Space for status bar
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 15,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40, // Extra padding at the bottom
  },
  contactsContainer: {
    marginTop: 10,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contactText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 15,
    color: '#333',
  },
});

export default EmergencyContactsScreen;