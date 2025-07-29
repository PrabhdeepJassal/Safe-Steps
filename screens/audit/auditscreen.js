import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const AUDIT_HISTORY_KEY = '@audit_history';

// --- Reusable Hexagon Icon Component ---
const HexagonIcon = ({ name, size = 28, isSelected, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.hexagonContainer}>
      <View style={[styles.hexagon, isSelected && styles.hexagonSelected]}>
        <Ionicons 
          name={name} 
          size={size} 
          color={isSelected ? '#333' : '#888'} 
        />
      </View>
    </TouchableOpacity>
  );
};

// --- Reusable Audit Section Component (Now a controlled component) ---
const AuditSection = ({ title, description, options, selectedIndex, onSelect }) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{description}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <HexagonIcon
            key={index}
            name={option.icon}
            isSelected={selectedIndex === index}
            onPress={() => onSelect(index)}
          />
        ))}
      </View>
      <View style={styles.divider} />
    </View>
  );
};


// --- Main Screen Component ---
const SafetyAuditScreen = ({ navigation, route }) => {
  const { source, destination } = route.params || {};

  // State to hold all selections, lifted up from child components
  const [selections, setSelections] = useState({});

  const handleSelect = (sectionTitle, optionIndex) => {
    setSelections(prev => ({
      ...prev,
      [sectionTitle]: optionIndex,
    }));
  };

  const auditData = [
    {
      title: 'Lightning',
      description: 'Availability of enough light to see all around you.',
      options: [
        { icon: 'flash-off-outline', label: 'Poor' },
        { icon: 'bulb-outline', label: 'Adequate' },
        { icon: 'sunny-outline', label: 'Excellent' },
      ],
    },
    {
      title: 'Well-trodden',
      description: 'Either a pavement or a road with space to walk.',
      options: [
        { icon: 'remove-circle-outline', label: 'No Path' },
        { icon: 'footsteps-outline', label: 'Pavement' },
        { icon: 'trail-sign-outline', label: 'Clear Road' },
      ],
    },
    {
      title: 'Visibility',
      description: 'Vandals, shops, building entrances, windows/balconies from where you can be seen.',
      options: [
        { icon: 'eye-off-outline', label: 'Low' },
        { icon: 'eye-outline', label: 'Moderate' },
        { icon: 'scan-outline', label: 'High' },
      ],
    },
    {
      title: 'Openness',
      description: 'Ability to see and move in all directions.',
      options: [
        { icon: 'contract-outline', label: 'Confined' },
        { icon: 'expand-outline', label: 'Open' },
        { icon: 'move-outline', label: 'Very Open' },
      ],
    },
    {
      title: 'Connection',
      description: 'Internet connectivity.',
      options: [
        { icon: 'wifi-outline', label: 'None' },
        { icon: 'bar-chart-outline', label: 'Weak' },
        { icon: 'cellular-outline', label: 'Strong' },
      ],
    },
  ];

  const handleDone = async () => {
    try {
      // 1. Get existing history from AsyncStorage
      const existingHistoryRaw = await AsyncStorage.getItem(AUDIT_HISTORY_KEY);
      const existingHistory = existingHistoryRaw ? JSON.parse(existingHistoryRaw) : [];

      // 2. Format the selections into a readable object
      const formattedSelections = {};
      auditData.forEach(section => {
        const selectedIndex = selections[section.title];
        if (selectedIndex !== undefined) {
          // Store the descriptive label for the selected option
          formattedSelections[section.title] = section.options[selectedIndex].label;
        } else {
          formattedSelections[section.title] = 'Not Rated';
        }
      });

      // 3. Create the new history entry
      const newAuditEntry = {
        id: new Date().toISOString(),
        date: new Date().toISOString(),
        source: source || { name: 'Unknown Source' },
        destination: destination || { name: 'Unknown Destination' },
        audit: formattedSelections,
      };

      // 4. Add the new entry to the history array and save it
      const updatedHistory = [...existingHistory, newAuditEntry];
      await AsyncStorage.setItem(AUDIT_HISTORY_KEY, JSON.stringify(updatedHistory));

      Alert.alert("Audit Saved", "Your safety feedback has been saved successfully.");
      navigation.goBack();

    } catch (error) {
      console.error("Failed to save audit history:", error);
      Alert.alert("Error", "Could not save your audit. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Audit</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={20} color="#555" />
          <Text style={styles.locationText} numberOfLines={1}>
            Route to: {destination?.name || 'Unknown Location'}
          </Text>
        </View>

        {auditData.map((item, index) => (
          <AuditSection
            key={index}
            title={item.title}
            description={item.description}
            options={item.options}
            selectedIndex={selections[item.title]}
            onSelect={(optionIndex) => handleSelect(item.title, optionIndex)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for the footer
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  locationText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 10,
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
  },
  hexagonContainer: {
    width: 60,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hexagon: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    transform: [{ rotate: '90deg' }],
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#e0e0e0',
  },
  hexagonSelected: {
    backgroundColor: '#c8e6c9', // A light green color for selection
    borderColor: '#81c784',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30, // For safe area on iOS
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  doneButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SafetyAuditScreen;
