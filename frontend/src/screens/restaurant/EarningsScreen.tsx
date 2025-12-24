import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';

export function EarningsScreen() {
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<any>(null);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    loadEarnings();
  }, [period]);

  const loadEarnings = async () => {
    try {
      // This would call a backend endpoint for earnings
      // For now, showing placeholder structure
      setEarnings({
        total: 0,
        commission: 0,
        net: 0,
        orders: [],
      });
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, period === 'today' && styles.periodButtonActive]}
            onPress={() => setPeriod('today')}
          >
            <Text style={[styles.periodButtonText, period === 'today' && styles.periodButtonTextActive]}>
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, period === 'week' && styles.periodButtonActive]}
            onPress={() => setPeriod('week')}
          >
            <Text style={[styles.periodButtonText, period === 'week' && styles.periodButtonTextActive]}>
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
            onPress={() => setPeriod('month')}
          >
            <Text style={[styles.periodButtonText, period === 'month' && styles.periodButtonTextActive]}>
              Month
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Earnings</Text>
        <Text style={styles.summaryAmount}>₹{earnings?.total || 0}</Text>
        <View style={styles.summaryBreakdown}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryRowLabel}>Commission (15%)</Text>
            <Text style={styles.summaryRowValue}>-₹{earnings?.commission || 0}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryRowLabel}>Net Earnings</Text>
            <Text style={[styles.summaryRowValue, styles.netEarnings]}>
              ₹{earnings?.net || 0}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {earnings?.orders && earnings.orders.length > 0 ? (
          earnings.orders.map((order: any) => (
            <View key={order.id} style={styles.orderRow}>
              <View>
                <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={styles.orderAmount}>
                <Text style={styles.orderAmountText}>₹{order.amount}</Text>
                <Text style={styles.orderCommissionText}>
                  -₹{order.commission} (15%)
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No orders in this period</Text>
        )}
      </View>

      <TouchableOpacity style={styles.downloadButton}>
        <Text style={styles.downloadButtonText}>Download Report (CSV)</Text>
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  summaryBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryRowLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  summaryRowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  netEarnings: {
    fontSize: 18,
    color: '#34C759',
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
    marginBottom: 16,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#6c757d',
  },
  orderAmount: {
    alignItems: 'flex-end',
  },
  orderAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  orderCommissionText: {
    fontSize: 12,
    color: '#6c757d',
  },
  emptyText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    padding: 20,
  },
  downloadButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

