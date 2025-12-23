import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';

export function OrderDetailScreen() {
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };

  const [order, setOrder] = useState<any>(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
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

  const updateStatus = async (status: string, delayReason?: string) => {
    try {
      await axios.put(`/orders/${orderId}/status`, { status, delayReason });
      loadOrder();
      Alert.alert('Success', 'Order status updated');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 4) {
      Alert.alert('Error', 'Please enter the 4-digit OTP');
      return;
    }

    try {
      const response = await axios.post(`/orders/${orderId}/verify-otp`, { otp });
      if (response.data.success) {
        Alert.alert('Success', 'Order picked up successfully');
        loadOrder();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Invalid OTP');
    }
  };

  if (loading || !order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(order.status) },
          ]}
        >
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items?.map((item: any) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.itemName}</Text>
            <Text style={styles.itemQuantity}>x{item.quantity}</Text>
            <Text style={styles.itemPrice}>₹{item.subtotal}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>₹{order.totalAmount}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timing</Text>
        <Text style={styles.timingText}>
          Pickup ETA: {new Date(order.estimatedArrivalTime).toLocaleTimeString()}
        </Text>
        <Text style={styles.timingText}>
          Ready by: {new Date(order.estimatedReadyTime).toLocaleTimeString()}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        {order.status === 'pending' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => updateStatus('confirmed')}
          >
            <Text style={styles.actionButtonText}>Accept Order</Text>
          </TouchableOpacity>
        )}

        {order.status === 'confirmed' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => updateStatus('preparing')}
          >
            <Text style={styles.actionButtonText}>Start Preparing</Text>
          </TouchableOpacity>
        )}

        {order.status === 'preparing' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.readyButton]}
              onPress={() => updateStatus('ready')}
            >
              <Text style={styles.actionButtonText}>Mark Ready</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.delayButton]}
              onPress={() => {
                Alert.prompt(
                  'Delay Reason',
                  'Enter reason for delay',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Submit',
                      onPress: (reason) => updateStatus('preparing', reason),
                    },
                  ],
                  'plain-text',
                );
              }}
            >
              <Text style={styles.actionButtonText}>Report Delay</Text>
            </TouchableOpacity>
          </>
        )}

        {order.status === 'ready' && (
          <View style={styles.otpSection}>
            <Text style={styles.otpLabel}>Verify Pickup OTP</Text>
            <Text style={styles.otpValue}>{order.pickupOtp}</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="Or enter OTP manually"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={4}
            />
            <TouchableOpacity style={styles.verifyButton} onPress={verifyOtp}>
              <Text style={styles.verifyButtonText}>Verify & Complete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return '#FFC107';
    case 'confirmed':
      return '#2196F3';
    case 'preparing':
      return '#FF9800';
    case 'ready':
      return '#4CAF50';
    default:
      return '#9E9E9E';
  }
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
  },
  itemQuantity: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 10,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  timingText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  readyButton: {
    backgroundColor: '#34C759',
  },
  delayButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  otpSection: {
    marginTop: 10,
  },
  otpLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  otpValue: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 20,
    color: '#007AFF',
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
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

