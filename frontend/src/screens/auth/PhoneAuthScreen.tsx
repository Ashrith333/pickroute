import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as Device from 'expo-device';

export function PhoneAuthScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const deviceId = Device.modelId || 'unknown';
      const response = await axios.post('/auth/send-otp', {
        phone,
        deviceId,
      });

      if (response.data.success) {
        navigation.navigate('OtpVerification', { phone });
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to PickRoute</Text>
      <Text style={styles.subtitle}>Enter your phone number to continue</Text>

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoFocus
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSendOtp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending...' : 'Send OTP'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
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

