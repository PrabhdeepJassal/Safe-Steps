import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  PermissionsAndroid,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Contacts from 'react-native-contacts';
import DraggableFlatList from 'react-native-draggable-flatlist';

export default function EmergencyContactsScreen({ navigation }) {
  const [contacts, setContacts] = useState([
    { id: '1', name: 'P♥P', mobile: '98140 41698', photo: null },
    { id: '2', name: 'M♥M', mobile: '84370 07580', photo: null },
  ]);
  const [isReordering, setIsReordering] = useState(false);

  const handleAddContact = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Contacts Permission',
            message: 'This app needs access to your contacts to add emergency contacts.',
            buttonPositive: 'OK',
            buttonNegative: 'Cancel',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Cannot access contacts without permission.');
          return;
        }
      }

      Contacts.getAll((err, phoneContacts) => {
        if (err) {
          Alert.alert('Error', 'Failed to access contacts: ' + err.message);
          return;
        }

        if (phoneContacts.length > 0) {
          const selectedContact = phoneContacts[0];
          const newContact = {
            id: Date.now().toString(),
            name: selectedContact.givenName || 'Unknown',
            mobile: selectedContact.phoneNumbers[0]?.number || 'No number',
            photo: selectedContact.thumbnailPath || null,
          };
          setContacts([...contacts, newContact]);
        } else {
          Alert.alert('No Contacts', 'No contacts found on your device.');
        }
      });
    } catch (error) {
      Alert.alert('Error', 'An error occurred while accessing contacts: ' + error.message);
    }
  };

  const removeContact = (id) => {
    setContacts(contacts.filter(contact => contact.id !== id));
  };

  const toggleReorder = () => {
    setIsReordering(!isReordering);
  };

  const onDragEnd = ({ data }) => {
    setContacts(data);
  };

  const renderItem = ({ item, drag, isActive }) => {
    return (
      <TouchableOpacity
        style={[styles.contactItem, isActive && { backgroundColor: '#F0F0F0' }]}
        onLongPress={isReordering ? drag : undefined}
        disabled={!isReordering}
      >
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.contactIcon} />
        ) : (
          <View style={styles.contactIcon}>
            <Text style={styles.contactInitials}>
              {item.name
                .split(' ')
                .map(word => word.charAt(0))
                .join('')
                .toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactNumber}>Mobile • {item.mobile}</Text>
        </View>
        <TouchableOpacity onPress={() => removeContact(item.id)} disabled={isReordering}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Pass contacts back to PersonalSafetyScreen when navigating back
  const handleGoBack = () => {
    navigation.navigate('PersonalSafety', { contacts });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleReorder}>
          <Text style={styles.reorderText}>{isReordering ? 'DONE' : 'REORDER'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.headerTitle}>Emergency contacts</Text>
      </View>

      <DraggableFlatList
        data={contacts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        onDragEnd={onDragEnd}
        containerStyle={styles.contactList}
      />

      <TouchableOpacity style={styles.addButton} onPress={handleAddContact} disabled={isReordering}>
        <Ionicons name="add" size={24} color="#000" />
        <Text style={styles.addButtonText}>Add contact</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={24} color="#666" style={styles.infoIcon} />
        <View style={styles.infoContent}>
          <Text style={styles.infoText}>
            To help in an emergency, people can view and call these contacts without unlocking your device.
          </Text>
          <TouchableOpacity>
            <Text style={styles.changeSettingText}>Change setting</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  reorderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textTransform: 'uppercase',
  },
  titleContainer: {
    paddingHorizontal: 25,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#2a2a2a',
    textTransform: 'capitalize',
    marginBottom: 20,
  },
  contactList: {
    paddingHorizontal: 25,
    marginTop: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInitials: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
  },
  contactNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginLeft: 15,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
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
  changeSettingText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});