import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const AUDIT_HISTORY_KEY = '@audit_history';

// --- Component for a single history item ---
const AuditHistoryItem = ({ item }) => {
  const { date, destination, audit } = item;

  return (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <Ionicons name="calendar-outline" size={20} color="#666" style={styles.itemIcon} />
        <Text style={styles.dateText}>
          {new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>
      <Text style={styles.destinationText}>
        Route to: {destination?.name || 'Unknown Destination'}
      </Text>
      <View style={styles.auditDetailsContainer}>
        {Object.entries(audit).map(([key, value]) => (
          <View key={key} style={styles.auditDetailRow}>
            <Text style={styles.auditKey}>{key}:</Text>
            <Text style={styles.auditValue}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// --- Main Screen Component ---
const AuditHistoryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load history from AsyncStorage when the screen is focused
  useFocusEffect(
    useCallback(() => {
      const loadHistory = async () => {
        setLoading(true);
        try {
          const storedHistory = await AsyncStorage.getItem(AUDIT_HISTORY_KEY);
          if (storedHistory) {
            const parsedHistory = JSON.parse(storedHistory);
            // Sort by most recent first
            setHistory(parsedHistory.sort((a, b) => new Date(b.date) - new Date(a.date)));
          } else {
            setHistory([]);
          }
        } catch (error) {
          console.error('Failed to load audit history:', error);
          Alert.alert('Error', 'Could not load your audit history.');
        } finally {
          setLoading(false);
        }
      };

      loadHistory();
    }, [])
  );

  const handleClearHistory = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to delete all your audit history? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(AUDIT_HISTORY_KEY);
              setHistory([]);
              Alert.alert("Success", "Your audit history has been cleared.");
            } catch (error) {
              Alert.alert("Error", "Failed to clear history.");
            }
          }
        }
      ]
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={60} color="#cccccc" />
      <Text style={styles.emptyText}>No Audit History Found</Text>
      <Text style={styles.emptySubText}>
        Complete a safety audit after a trip to see your history here.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Audit History</Text>
        {history.length > 0 ? (
          <TouchableOpacity onPress={handleClearHistory} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AuditHistoryItem item={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyComponent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40, // Adjusted from 10 to 40
    paddingBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECEE',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  clearButton: {
    padding: 5,
  },
  listContent: {
    padding: 20,
  },
  itemContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemIcon: {
    marginRight: 10,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  destinationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  auditDetailsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  auditDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  auditKey: {
    fontSize: 14,
    color: '#555',
  },
  auditValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#888',
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 40,
  },
});

export default AuditHistoryScreen;
