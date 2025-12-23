import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import axios from 'axios';

export function PickupScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };

  const [order, setOrder] = useState<any>(null);
  const [otp, setOtp] = useState('');
  const [nearLocation, setNearLocation] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
    checkLocation();
    const interval = setInterval(checkLocation, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadOrder = async () => {
    try {
      const response = await axios.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({});
      // In production, calculate distance to restaurant
      // For now, just show OTP when near
      setNearLocation(true);
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 4) {
      Alert.alert('Error', 'Please enter the 4-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`/orders/${orderId}/verify-otp`, {
        otp,
      });

      if (response.data.success) {
        navigation.navigate('OrderComplete', { orderId });
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !order) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pickup Verification</Text>
        <Text style={styles.subtitle}>{order?.restaurant?.name}</Text>
      </View>

      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>Pickup Instructions</Text>
        <Text style={styles.instructionsText}>
          • Arrive at the restaurant
        </Text>
        <Text style={styles.instructionsText}>
          • Show the OTP to the staff
        </Text>
        <Text style={styles.instructionsText}>
          • Collect your order
        </Text>
      </View>

      {nearLocation ? (
        <View style={styles.otpCard}>
          <Text style={styles.otpLabel}>Your Pickup OTP</Text>
          <Text style={styles.otpValue}>{order?.pickupOtp || '----'}</Text>
          <Text style={styles.otpHint}>
            Show this code to the restaurant staff
          </Text>
        </View>
      ) : (
        <View style={styles.locationCard}>
          <Text style={styles.locationText}>
            📍 OTP will be revealed when you're near the restaurant
          </Text>
        </View>
      )}

      <View style={styles.manualOtpSection}>
        <Text style={styles.manualOtpLabel}>Or enter OTP manually:</Text>
        <TextInput
          style={styles.otpInput}
          placeholder="Enter 4-digit OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={4}
        />
        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.buttonDisabled]}
          onPress={handleVerifyOtp}
          disabled={loading}
        >
          <Text style={styles.verifyButtonText}>Verify OTP</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.arrivedButton}
        onPress={() => setNearLocation(true)}
      >
        <Text style={styles.arrivedButtonText}>I've Arrived</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  instructionsCard: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 15,
    borderRadius: 8,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  otpCard: {
    backgroundColor: '#007AFF',
    padding: 30,
    margin: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 10,
  },
  otpValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 8,
    marginBottom: 10,
  },
  otpHint: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  locationCard: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  manualOtpSection: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 15,
    borderRadius: 8,
  },
  manualOtpLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 15,
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  arrivedButton: {
    backgroundColor: '#34C759',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  arrivedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

