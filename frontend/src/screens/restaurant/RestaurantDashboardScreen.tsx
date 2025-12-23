import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

export function RestaurantDashboardScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const response = await axios.get('/orders/restaurant');
      setOrders(response.data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await axios.put(`/orders/${orderId}/status`, { status });
      loadOrders();
    } catch (error: any) {
      console.error('Error updating status:', error);
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Incoming Orders</Text>
          <Text style={styles.subtitle}>{orders.length} active orders</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              >
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>

            <Text style={styles.orderInfo}>
              {item.items?.length || 0} items • ₹{item.totalAmount}
            </Text>
            <Text style={styles.orderTime}>
              Ready by: {new Date(item.estimatedReadyTime).toLocaleTimeString()}
            </Text>

            <View style={styles.actionButtons}>
              {item.status === 'pending' && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => updateOrderStatus(item.id, 'confirmed')}
                >
                  <Text style={styles.actionButtonText}>Accept</Text>
                </TouchableOpacity>
              )}
              {item.status === 'confirmed' && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => updateOrderStatus(item.id, 'preparing')}
                >
                  <Text style={styles.actionButtonText}>Start Preparing</Text>
                </TouchableOpacity>
              )}
              {item.status === 'preparing' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.readyButton]}
                  onPress={() => updateOrderStatus(item.id, 'ready')}
                >
                  <Text style={styles.actionButtonText}>Mark Ready</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>No orders at the moment</Text>
          </View>
        }
      />
    </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 20,
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
  orderCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  orderInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  orderTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  readyButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
});

