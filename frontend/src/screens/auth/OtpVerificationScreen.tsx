import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import * as Device from 'expo-device';
import { AuthContext } from '../../context/AuthContext';

export function OtpVerificationScreen() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { phone } = route.params as { phone: string };
  const { signIn } = React.useContext(AuthContext);
  const otpInputRefs = useRef<(TextInput | null)[]>([]);
  const isVerifyingRef = useRef(false);

  const handleVerifyOtp = React.useCallback(async () => {
    if (!otp || otp.length !== 6 || isVerifyingRef.current) {
      return;
    }

    isVerifyingRef.current = true;
    setLoading(true);
    try {
      const deviceId = Device.modelId || 'unknown';
      const response = await axios.post('/auth/verify-otp', {
        phone,
        otp,
        deviceId,
      });

      if (response.data.success) {
        await signIn(response.data.token, response.data.user);
        // Navigation will automatically switch to role-based stack
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Invalid OTP');
      // Clear OTP on error so user can retry
      setOtp('');
      otpInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
      isVerifyingRef.current = false;
    }
  }, [otp, phone, signIn]);

  // Auto-verify when OTP is complete
  React.useEffect(() => {
    if (otp.length === 6 && !loading && !isVerifyingRef.current) {
      handleVerifyOtp();
    }
  }, [otp, loading, handleVerifyOtp]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to {phone}
      </Text>

      <View style={styles.otpContainer}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              otpInputRefs.current[index] = ref;
            }}
            style={styles.otpInput}
            value={otp[index] || ''}
            onChangeText={(text) => {
              // Handle paste (when text length > 1)
              if (text.length > 1) {
                const pastedOtp = text.replace(/\D/g, '').slice(0, 6);
                setOtp(pastedOtp);
                // Focus the last input if all 6 digits are pasted
                if (pastedOtp.length === 6) {
                  setTimeout(() => otpInputRefs.current[5]?.focus(), 0);
                } else if (pastedOtp.length > 0) {
                  setTimeout(() => otpInputRefs.current[pastedOtp.length]?.focus(), 0);
                }
                return;
              }

              // Handle single character input
              const digit = text.replace(/\D/g, '');
              if (digit) {
                const newOtp = otp.split('');
                newOtp[index] = digit;
                const updatedOtp = newOtp.join('');
                setOtp(updatedOtp);
                
                // Auto-focus next input
                if (index < 5 && digit) {
                  setTimeout(() => otpInputRefs.current[index + 1]?.focus(), 0);
                }
              } else {
                // Handle backspace - clear current and move to previous
                const newOtp = otp.split('');
                newOtp[index] = '';
                setOtp(newOtp.join(''));
                if (index > 0) {
                  setTimeout(() => otpInputRefs.current[index - 1]?.focus(), 0);
                }
              }
            }}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
                otpInputRefs.current[index - 1]?.focus();
              }
            }}
            keyboardType="number-pad"
            maxLength={6}
            selectTextOnFocus
            autoFocus={index === 0}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerifyOtp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Verifying...' : 'Verify'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.resendText}>Resend OTP</Text>
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 10,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    width: 50,
    height: 60,
    textAlign: 'center',
    fontSize: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
  },
  resendText: {
    color: '#007AFF',
    fontSize: 16,
  },
});

