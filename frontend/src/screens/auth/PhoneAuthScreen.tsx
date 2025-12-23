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

const COUNTRY_CODE = '+91';
const INDIAN_PHONE_LENGTH = 10;

// Validate Indian phone number
const validateIndianPhone = (phoneNumber: string): boolean => {
  // Remove any spaces, dashes, or other characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Should be exactly 10 digits
  if (cleaned.length !== INDIAN_PHONE_LENGTH) {
    return false;
  }
  
  // Indian mobile numbers start with 6, 7, 8, or 9
  const firstDigit = cleaned[0];
  if (!['6', '7', '8', '9'].includes(firstDigit)) {
    return false;
  }
  
  return true;
};

// Format phone number for display (adds +91 prefix)
const formatPhoneDisplay = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  if (cleaned.length === 0) return '';
  if (cleaned.length <= INDIAN_PHONE_LENGTH) {
    return `${COUNTRY_CODE} ${cleaned}`;
  }
  return `${COUNTRY_CODE} ${cleaned.slice(0, INDIAN_PHONE_LENGTH)}`;
};

export function PhoneAuthScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation();

  const handlePhoneChange = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Limit to 10 digits (Indian phone number length)
    const limited = cleaned.slice(0, INDIAN_PHONE_LENGTH);
    
    setPhone(limited);
    setError('');
    
    // Validate as user types
    if (limited.length > 0 && limited.length < INDIAN_PHONE_LENGTH) {
      if (limited.length === 1 && !['6', '7', '8', '9'].includes(limited[0])) {
        setError('Indian mobile numbers start with 6, 7, 8, or 9');
      } else {
        setError('');
      }
    } else if (limited.length === INDIAN_PHONE_LENGTH) {
      if (!validateIndianPhone(limited)) {
        setError('Invalid phone number');
      } else {
        setError('');
      }
    }
  };

  const handleSendOtp = async () => {
    // Validate phone number
    if (!phone || phone.length !== INDIAN_PHONE_LENGTH) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (!validateIndianPhone(phone)) {
      Alert.alert('Error', 'Please enter a valid Indian mobile number (starts with 6, 7, 8, or 9)');
      return;
    }

    setLoading(true);
    try {
      const deviceId = Device.modelId || 'unknown';
      // Send phone number with country code
      const phoneWithCountryCode = `${COUNTRY_CODE}${phone}`;
      
      const response = await axios.post('/auth/send-otp', {
        phone: phoneWithCountryCode,
        deviceId,
      });

      if (response.data.success) {
        navigation.navigate('OtpVerification', { phone: phoneWithCountryCode });
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

      <View style={styles.phoneContainer}>
        <View style={styles.countryCodeContainer}>
          <Text style={styles.countryCode}>{COUNTRY_CODE}</Text>
        </View>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholder="10-digit mobile number"
          value={phone}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
          maxLength={INDIAN_PHONE_LENGTH}
          autoFocus
        />
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : phone.length === INDIAN_PHONE_LENGTH && validateIndianPhone(phone) ? (
        <Text style={styles.successText}>✓ Valid phone number</Text>
      ) : null}

      <TouchableOpacity
        style={[
          styles.button,
          (loading || phone.length !== INDIAN_PHONE_LENGTH || !validateIndianPhone(phone)) &&
            styles.buttonDisabled,
        ]}
        onPress={handleSendOtp}
        disabled={loading || phone.length !== INDIAN_PHONE_LENGTH || !validateIndianPhone(phone)}
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
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  countryCodeContainer: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: '#ddd',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    padding: 15,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: 10,
    marginTop: -5,
  },
  successText: {
    color: '#34c759',
    fontSize: 14,
    marginBottom: 20,
    marginTop: -5,
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

