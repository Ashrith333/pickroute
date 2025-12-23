import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import axios from 'axios';

export function PickupTimeConfirmationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { restaurantId, cart, cartValidation } = route.params as any;

  const [arrivalEta, setArrivalEta] = useState(25); // minutes
  const [userLateBy, setUserLateBy] = useState(0);
  const [slot, setSlot] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    lockSlot();
  }, []);

  const lockSlot = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/orders/lock-slot', {
        restaurantId,
        arrivalEtaMinutes: arrivalEta,
        userLateByMinutes: userLateBy,
      });
      setSlot(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to lock slot');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!slot || !slot.canProceed) {
      Alert.alert('Error', 'Cannot proceed with this time slot');
      return;
    }

    navigation.navigate('Payment', {
      restaurantId,
      cart,
      slot,
      arrivalEta,
      userLateBy,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Confirm Pickup Time</Text>
        <Text style={styles.subtitle}>
          Make sure the timing works for your route
        </Text>
      </View>

      {slot && (
        <>
          <View style={styles.timeCard}>
            <Text style={styles.timeLabel}>Estimated Arrival</Text>
            <Text style={styles.timeValue}>
              {new Date(slot.estimatedArrivalTime).toLocaleTimeString()}
            </Text>
          </View>

          <View style={styles.timeCard}>
            <Text style={styles.timeLabel}>Food Ready By</Text>
            <Text style={styles.timeValue}>
              {new Date(slot.estimatedReadyTime).toLocaleTimeString()}
            </Text>
          </View>

          <View style={styles.timeCard}>
            <Text style={styles.timeLabel}>Hold Window Until</Text>
            <Text style={styles.timeValue}>
              {new Date(slot.holdWindowEnd).toLocaleTimeString()}
            </Text>
          </View>
        </>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>I may be late by (minutes)</Text>
        <View style={styles.lateSelector}>
          <TouchableOpacity
            style={styles.lateButton}
            onPress={() => setUserLateBy(Math.max(0, userLateBy - 5))}
          >
            <Text>-</Text>
          </TouchableOpacity>
          <Text style={styles.lateValue}>{userLateBy} min</Text>
          <TouchableOpacity
            style={styles.lateButton}
            onPress={() => setUserLateBy(Math.min(30, userLateBy + 5))}
          >
            <Text>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          ⚠️ You must confirm this time slot before payment
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, (!slot || !slot.canProceed) && styles.buttonDisabled]}
        onPress={handleConfirm}
        disabled={!slot || !slot.canProceed || loading}
      >
        <Text style={styles.buttonText}>Confirm & Proceed to Payment</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  timeCard: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  lateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  lateButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lateValue: {
    fontSize: 20,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

