import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList from 'react-native-draggable-flatlist';

export default function EmergencyContactsScreen({ navigation, route }) {
  const [contacts, setContacts] = useState([]);
  const [isReordering, setIsReordering] = useState(false);
  const [isContactPickerVisible, setContactPickerVisible] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactNumber, setNewContactNumber] = useState('');

  useEffect(() => {
    const loadContacts = async () => {
      try {
        // For now, no persistent storage - using route params or starting fresh
        let parsedContacts = [];

        // Only use route.params.contacts if explicitly provided and not empty
        const initialContacts = Array.isArray(route.params?.contacts) && route.params.contacts.length > 0 
          ? route.params.contacts 
          : [];

        // Use initial contacts for now (no persistent storage)
        const mergedContacts = initialContacts.filter(contact => contact?.id && contact?.name && contact?.mobile);

        console.log('Loaded contacts:', mergedContacts);
        setContacts(mergedContacts);
      } catch (error) {
        console.error('Load contacts error:', error);
        Alert.alert('Error', 'Failed to load contacts: ' + error.message);
      }
    };

    loadContacts();
  }, []); // Empty dependency array to run only once on mount

  useEffect(() => {
    const saveContacts = async () => {
      try {
        // Only save to navigation params for now (no persistent storage)
        if (contacts.length > 0) {
          navigation.setParams({ contacts });
          console.log('Updated navigation with contacts:', contacts);
        } else {
          console.log('Skipped saving empty contacts array');
        }
      } catch (error) {
        console.error('Save contacts error:', error);
        Alert.alert('Error', 'Failed to save contacts: ' + error.message);
      }
    };

    saveContacts();
  }, [contacts]); // Run only when contacts change

  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactNumber.trim()) {
      Alert.alert('Error', 'Please enter both name and phone number.');
      return;
    }

    const newContact = {
      id: Date.now().toString(),
      name: newContactName.trim(),
      mobile: newContactNumber.trim(),
      photo: null,
    };

    if (contacts.some(contact => contact.mobile === newContact.mobile)) {
      Alert.alert('Duplicate', 'This phone number is already added.');
      return;
    }

    setContacts([...contacts, newContact]);
    setContactPickerVisible(false);
    setNewContactName('');
    setNewContactNumber('');
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

  const renderContactItem = ({ item, drag, isActive }) => (
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

      {contacts.length === 0 ? (
        <Text style={styles.emptyText}>No emergency contacts added yet.</Text>
      ) : (
        <DraggableFlatList
          data={contacts}
          renderItem={renderContactItem}
          keyExtractor={item => item.id}
          onDragEnd={onDragEnd}
          containerStyle={styles.contactList}
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => setContactPickerVisible(true)} disabled={isReordering}>
        <Ionicons name="add" size={24} color="#000" />
        <Text style={styles.addButtonText}>Add contact</Text>
      </TouchableOpacity>

      <Modal
        visible={isContactPickerVisible}
        animationType="slide"
        onRequestClose={() => {
          setContactPickerVisible(false);
          setNewContactName('');
          setNewContactNumber('');
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Emergency Contact</Text>
            <TouchableOpacity
              onPress={() => {
                setContactPickerVisible(false);
                setNewContactName('');
                setNewContactNumber('');
              }}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Contact Name"
              value={newContactName}
              onChangeText={setNewContactName}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={newContactNumber}
              onChangeText={setNewContactNumber}
              keyboardType="phone-pad"
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleAddContact}>
              <Text style={styles.saveButtonText}>Save Contact</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

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
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  formContainer: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
    paddingHorizontal: 25,
  },
});