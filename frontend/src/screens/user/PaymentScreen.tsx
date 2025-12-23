import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';

export function PaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { restaurantId, cart, slot, arrivalEta, userLateBy } = route.params as any;

  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
  const [loading, setLoading] = useState(false);

  const totalAmount = cart.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  const partialAmount = totalAmount * 0.3; // 30% advance

  const handlePayment = async () => {
    setLoading(true);
    try {
      // First create the order
      const orderResponse = await axios.post('/orders', {
        restaurantId,
        items: cart.map((item: any) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
        arrivalEtaMinutes: arrivalEta,
        userLateByMinutes: userLateBy,
      });

      const order = orderResponse.data;

      // Then initiate payment
      const paymentResponse = await axios.post('/payments/initiate', {
        orderId: order.id,
        amount: paymentType === 'full' ? totalAmount : partialAmount,
        type: paymentType,
      });

      if (paymentResponse.data.success) {
        navigation.navigate('LiveOrderTracking', { orderId: order.id });
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Payment</Text>
        <Text style={styles.subtitle}>Order Total: ₹{totalAmount}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Payment Type</Text>
        <TouchableOpacity
          style={[styles.paymentOption, paymentType === 'full' && styles.paymentOptionSelected]}
          onPress={() => setPaymentType('full')}
        >
          <Text style={styles.paymentOptionText}>Full Payment</Text>
          <Text style={styles.paymentOptionAmount}>₹{totalAmount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.paymentOption, paymentType === 'partial' && styles.paymentOptionSelected]}
          onPress={() => setPaymentType('partial')}
        >
          <Text style={styles.paymentOptionText}>Partial Advance (30%)</Text>
          <Text style={styles.paymentOptionAmount}>₹{partialAmount}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.policyBox}>
        <Text style={styles.policyTitle}>Cancellation Policy</Text>
        <Text style={styles.policyText}>
          • Cancel up to 10 minutes before pickup: Full refund
        </Text>
        <Text style={styles.policyText}>
          • Cancel within 10 minutes: 50% refund
        </Text>
        <Text style={styles.policyText}>
          • No-show: No refund
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handlePayment}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Processing...' : `Pay ₹${paymentType === 'full' ? totalAmount : partialAmount}`}
        </Text>
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
    fontSize: 18,
    color: '#666',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  paymentOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  paymentOptionText: {
    fontSize: 16,
  },
  paymentOptionAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  policyBox: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  policyText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
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

