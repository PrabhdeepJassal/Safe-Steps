import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DatePicker from 'react-native-date-picker';
import { Picker } from '@react-native-picker/picker';

export default function MedicalInformationScreen({ navigation }) {
  // State for medical information
  const [medicalInfo, setMedicalInfo] = useState({
    name: 'Prabhdeep singh jassal',
    dateOfBirth: '',
    bloodType: 'O+',
    height: '',
    weight: '75',
    allergies: 'Unknown',
    pregnancyStatus: 'Not pregnant',
    medications: 'Anxiety attack',
    address: 'Unknown',
    medicalNotes: '',
    organDonor: 'Unknown',
  });

  // State for date picker visibility
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  // State for modal visibility and input
  const [isModalVisible, setModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState('');
  const [tempInput, setTempInput] = useState('');

  // Blood type options
  const bloodTypeItems = [
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' },
  ];

  // Pregnancy status options
  const pregnancyStatusItems = [
    { label: 'Not pregnant', value: 'Not pregnant' },
    { label: 'Pregnant', value: 'Pregnant' },
    { label: 'Not applicable', value: 'Not applicable' },
  ];

  // Organ donor options
  const organDonorItems = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
    { label: 'Unknown', value: 'Unknown' },
  ];

  // Show date picker
  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  // Handle date selection
  const handleConfirmDate = (date) => {
    setMedicalInfo({ ...medicalInfo, dateOfBirth: date.toISOString().split('T')[0] });
    setDatePickerVisibility(false);
  };

  // Show modal for text input
  const showModal = (field, currentValue) => {
    setCurrentField(field);
    setTempInput(currentValue);
    setModalVisible(true);
  };

  // Handle modal OK button
  const handleModalOk = () => {
    setMedicalInfo({ ...medicalInfo, [currentField]: tempInput });
    setModalVisible(false);
  };

  // Handle modal Cancel button
  const handleModalCancel = () => {
    setModalVisible(false);
  };

  // Update medical info field (for Picker)
  const updateMedicalInfo = (field, value) => {
    setMedicalInfo({ ...medicalInfo, [field]: value });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Top Bar with Back Button */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Medical Information Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Medical information</Text>
        </View>

        {/* Medical Information List */}
        <View style={styles.infoList}>
          {/* Name */}
          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => showModal('name', medicalInfo.name)}
          >
            <Ionicons name="person-outline" size={24} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{medicalInfo.name}</Text>
            </View>
          </TouchableOpacity>

          {/* Date of Birth */}
          <TouchableOpacity style={styles.infoItem} onPress={showDatePicker}>
            <Ionicons name="calendar-outline" size={24} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date of birth</Text>
              <Text style={styles.infoValue}>
                {medicalInfo.dateOfBirth === 'Unknown' ? 'Select date' : medicalInfo.dateOfBirth}
              </Text>
            </View>
          </TouchableOpacity>
          {isDatePickerVisible && (
            <DatePicker
              date={new Date()}
              mode="date"
              onDateChange={handleConfirmDate}
              onCancel={() => setDatePickerVisibility(false)}
            />
          )}

          {/* Blood Type */}
          <View style={styles.infoItem}>
            <Ionicons name="water-outline" size={24} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Blood type</Text>
              <Picker
                selectedValue={medicalInfo.bloodType}
                onValueChange={(value) => updateMedicalInfo('bloodType', value)}
                style={styles.picker}
              >
                {bloodTypeItems.map((item) => (
                  <Picker.Item key={item.value} label={item.label} value={item.value} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Height */}
          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => showModal('height', medicalInfo.height)}
          >
            <Ionicons name="resize-outline" size={24} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Height</Text>
              <Text style={styles.infoValue}>{medicalInfo.height}</Text>
            </View>
          </TouchableOpacity>

          {/* Weight */}
          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => showModal('weight', medicalInfo.weight)}
          >
            <Ionicons name="barbell-outline" size={24} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Weight</Text>
              <Text style={styles.infoValue}>{medicalInfo.weight}</Text>
            </View>
          </TouchableOpacity>

          {/* Allergies */}
          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => showModal('allergies', medicalInfo.allergies)}
          >
            <Ionicons name="alert-circle-outline" size={24} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Allergies</Text>
              <Text style={styles.infoValue}>{medicalInfo.allergies}</Text>
            </View>
          </TouchableOpacity>

          {/* Pregnancy Status */}
          <View style={styles.infoItem}>
            <Ionicons name="female-outline" size={24} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Pregnancy status</Text>
              <Picker
                selectedValue={medicalInfo.pregnancyStatus}
                onValueChange={(value) => updateMedicalInfo('pregnancyStatus', value)}
                style={styles.picker}
              >
                {pregnancyStatusItems.map((item) => (
                  <Picker.Item key={item.value} label={item.label} value={item.value} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Medications */}
          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => showModal('medications', medicalInfo.medications)}
          >
            <Ionicons name="medkit-outline" size={24} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Medications</Text>
              <Text style={styles.infoValue}>{medicalInfo.medications}</Text>
            </View>
          </TouchableOpacity>

          {/* Address */}
          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => showModal('address', medicalInfo.address)}
          >
            <Ionicons name="home-outline" size={24} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{medicalInfo.address}</Text>
            </View>
          </TouchableOpacity>

          {/* Medical Notes */}
          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => showModal('medicalNotes', medicalInfo.medicalNotes)}
          >
            <Ionicons name="document-text-outline" size={24} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Medical notes</Text>
              <Text style={styles.infoValue}>{medicalInfo.medicalNotes}</Text>
            </View>
          </TouchableOpacity>

          {/* Organ Donor */}
          <View style={styles.infoItem}>
            <Ionicons name="heart-outline" size={24} color="#666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Organ donor</Text>
              <Picker
                selectedValue={medicalInfo.organDonor}
                onValueChange={(value) => updateMedicalInfo('organDonor', value)}
                style={styles.picker}
              >
                {organDonorItems.map((item) => (
                  <Picker.Item key={item.value} label={item.label} value={item.value} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        

        {/* Footer Text */}
        <Text style={styles.footerText}>This info is saved only on your device.</Text>
      </ScrollView>

      {/* Modal for Text Input */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{currentField.replace(/([A-Z])/g, ' $1').trim()}</Text>
            <TextInput
              style={styles.modalInput}
              value={tempInput}
              onChangeText={setTempInput}
              autoFocus={true}
              keyboardType={
                currentField === 'height' || currentField === 'weight' ? 'numeric' : 'default'
              }
              multiline={currentField === 'medicalNotes'}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={handleModalCancel}>
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonOk} onPress={handleModalOk}>
                <Text style={styles.modalButtonTextOk}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
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
  infoList: {
    paddingHorizontal: 25,
    marginTop: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  infoIcon: {
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#666',
    marginTop: 4,
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
  infoBoxContent: {
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
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 15,
    textTransform: 'capitalize',
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 20,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
  },
  modalButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  modalButtonOk: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  modalButtonTextCancel: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalButtonTextOk: {
    color: '#FFF',
    fontSize: 16,
  },
});