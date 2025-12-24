import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';

export function PrepCapacityScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [defaultPrepTime, setDefaultPrepTime] = useState(15);
  const [maxOrders15Min, setMaxOrders15Min] = useState(5);
  const [maxOrders30Min, setMaxOrders30Min] = useState(10);
  const [holdTimeAfterReady, setHoldTimeAfterReady] = useState(10);
  const [peakHourBuffer, setPeakHourBuffer] = useState(5);
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get('/restaurants/owner/my-restaurant');
      const restaurant = response.data;
      setDefaultPrepTime(restaurant.defaultPrepTimeMinutes || 15);
      setMaxOrders15Min(restaurant.maxOrdersPer15Min || 5);
      setMaxOrders30Min(restaurant.maxOrdersPer30Min || 10);
      setHoldTimeAfterReady(restaurant.holdTimeAfterReadyMinutes || 10);
      setPeakHourBuffer(restaurant.peakHourBufferMinutes || 5);
      setAutoAcceptOrders(restaurant.autoAcceptOrders || false);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch('/restaurants/owner/my-restaurant/prep-capacity', {
        defaultPrepTimeMinutes: defaultPrepTime,
        maxOrdersPer15Min: maxOrders15Min,
        maxOrdersPer30Min: maxOrders30Min,
        holdTimeAfterReadyMinutes: holdTimeAfterReady,
        peakHourBufferMinutes: peakHourBuffer,
        autoAcceptOrders,
      });
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Prep Time</Text>
        <Text style={styles.sectionDescription}>
          Default preparation time for all items (can be overridden per item)
        </Text>
        <View style={styles.numberInput}>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => setDefaultPrepTime(Math.max(1, defaultPrepTime - 1))}
          >
            <Text style={styles.numberButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.numberValue}>{defaultPrepTime} minutes</Text>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => setDefaultPrepTime(Math.min(120, defaultPrepTime + 1))}
          >
            <Text style={styles.numberButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Capacity</Text>
        <Text style={styles.sectionDescription}>
          Maximum orders you can handle in a time window
        </Text>

        <View style={styles.capacityRow}>
          <Text style={styles.capacityLabel}>Max orders per 15 min</Text>
          <View style={styles.numberInput}>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() => setMaxOrders15Min(Math.max(1, maxOrders15Min - 1))}
            >
              <Text style={styles.numberButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.numberValue}>{maxOrders15Min}</Text>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() => setMaxOrders15Min(Math.min(50, maxOrders15Min + 1))}
            >
              <Text style={styles.numberButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.capacityRow}>
          <Text style={styles.capacityLabel}>Max orders per 30 min</Text>
          <View style={styles.numberInput}>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() => setMaxOrders30Min(Math.max(1, maxOrders30Min - 1))}
            >
              <Text style={styles.numberButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.numberValue}>{maxOrders30Min}</Text>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() => setMaxOrders30Min(Math.min(100, maxOrders30Min + 1))}
            >
              <Text style={styles.numberButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hold Time</Text>
        <Text style={styles.sectionDescription}>
          How long to hold order after it's ready (before marking as delayed)
        </Text>
        <View style={styles.numberInput}>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => setHoldTimeAfterReady(Math.max(0, holdTimeAfterReady - 1))}
          >
            <Text style={styles.numberButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.numberValue}>{holdTimeAfterReady} minutes</Text>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => setHoldTimeAfterReady(Math.min(60, holdTimeAfterReady + 1))}
          >
            <Text style={styles.numberButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Peak Hour Buffer</Text>
        <Text style={styles.sectionDescription}>
          Additional prep time added during peak hours
        </Text>
        <View style={styles.numberInput}>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => setPeakHourBuffer(Math.max(0, peakHourBuffer - 1))}
          >
            <Text style={styles.numberButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.numberValue}>{peakHourBuffer} minutes</Text>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => setPeakHourBuffer(Math.min(30, peakHourBuffer + 1))}
          >
            <Text style={styles.numberButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Auto-Accept Orders</Text>
        <Text style={styles.sectionDescription}>
          Automatically accept orders within capacity limits
        </Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setAutoAcceptOrders(!autoAcceptOrders)}
        >
          <Text style={styles.toggleButtonText}>
            {autoAcceptOrders ? '✅ Enabled' : '❌ Disabled'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Settings</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
  },
  capacityRow: {
    marginBottom: 20,
  },
  capacityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  numberInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 8,
  },
  numberButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: '300',
  },
  numberValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  toggleButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

