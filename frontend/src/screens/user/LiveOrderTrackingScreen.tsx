import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';

export function LiveOrderTrackingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadOrder = async () => {
    try {
      const response = await axios.get(`/orders/${orderId}`);
      setOrder(response.data);

      // Navigate to pickup if ready
      if (response.data.status === 'ready') {
        navigation.navigate('Pickup', { orderId });
      }
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const callRestaurant = () => {
    if (order?.restaurant?.phone) {
      Linking.openURL(`tel:${order.restaurant.phone}`);
    }
  };

  if (loading || !order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const statusSteps = [
    { key: 'pending', label: 'Order Placed' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'ready', label: 'Ready for Pickup' },
    { key: 'picked_up', label: 'Picked Up' },
  ];

  const currentStepIndex = statusSteps.findIndex(
    (step) => step.key === order.status,
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
        <Text style={styles.restaurantName}>{order.restaurant?.name}</Text>
      </View>

      <View style={styles.timeline}>
        {statusSteps.map((step, index) => (
          <View key={step.key} style={styles.timelineItem}>
            <View
              style={[
                styles.timelineDot,
                index <= currentStepIndex && styles.timelineDotActive,
              ]}
            />
            <Text
              style={[
                styles.timelineLabel,
                index <= currentStepIndex && styles.timelineLabelActive,
              ]}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Estimated Ready Time</Text>
        <Text style={styles.infoValue}>
          {new Date(order.estimatedReadyTime).toLocaleTimeString()}
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Estimated Arrival</Text>
        <Text style={styles.infoValue}>
          {new Date(order.estimatedArrivalTime).toLocaleTimeString()}
        </Text>
      </View>

      {order.delayReason && (
        <View style={styles.delayCard}>
          <Text style={styles.delayTitle}>⚠️ Delay Notice</Text>
          <Text style={styles.delayText}>{order.delayReason}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.callButton} onPress={callRestaurant}>
        <Text style={styles.callButtonText}>📞 Call Restaurant</Text>
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
  orderNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  restaurantName: {
    fontSize: 16,
    color: '#666',
  },
  timeline: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 15,
  },
  timelineDotActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timelineLabel: {
    fontSize: 16,
    color: '#666',
  },
  timelineLabelActive: {
    color: '#000',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  delayCard: {
    backgroundColor: '#fff3cd',
    padding: 15,
    margin: 15,
    borderRadius: 8,
  },
  delayTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  delayText: {
    fontSize: 14,
    color: '#856404',
  },
  callButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  callButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

