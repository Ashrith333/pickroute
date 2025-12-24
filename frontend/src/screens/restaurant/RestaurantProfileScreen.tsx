import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

export function RestaurantProfileScreen() {
  const navigation = useNavigation();
  const { signOut, signIn } = React.useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [restaurant, setRestaurant] = useState<any>(null);

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [acceptsOrders, setAcceptsOrders] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadRestaurant();
  }, []);

  const loadRestaurant = async () => {
    try {
      const response = await axios.get('/restaurants/owner/my-restaurant');
      const data = response.data;
      setRestaurant(data);
      setDisplayName(data.displayName || data.name || '');
      setDescription(data.description || '');
      setEmail(data.email || '');
      setPrimaryContactName(data.primaryContactName || '');
      setPickupInstructions(data.pickupInstructions || '');
      setAcceptsOrders(data.acceptsOrders || false);
      setStatus(data.status || 'draft');
    } catch (error) {
      console.error('Error loading restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('/restaurants/owner/my-restaurant', {
        displayName,
        description,
        email,
        primaryContactName,
        pickupInstructions,
        acceptsOrders,
      });
      Alert.alert('Success', 'Profile updated successfully');
      loadRestaurant();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePause = async () => {
    try {
      await axios.post('/restaurants/owner/my-restaurant/toggle-pause');
      loadRestaurant();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to toggle pause status');
    }
  };

  const handleSwitchRole = async () => {
    Alert.alert(
      'Switch Role',
      'Switch to User mode?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Switch',
          onPress: async () => {
            setSwitchingRole(true);
            try {
              const token = await SecureStore.getItemAsync('authToken');
              if (!token) {
                Alert.alert('Error', 'Session expired. Please login again.');
                await signOut();
                return;
              }

              const response = await axios.post(
                '/auth/set-role',
                { role: 'user' },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (response.data.success) {
                await signIn(response.data.token, response.data.user);
                // Navigation will automatically switch to UserStack
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to switch role');
            } finally {
              setSwitchingRole(false);
            }
          },
        },
      ],
    );
  };

  const handleSubmitForApproval = async () => {
    Alert.alert(
      'Submit for Approval',
      'Are you sure all information is complete?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              await axios.post('/restaurants/owner/my-restaurant/submit-for-approval');
              Alert.alert('Success', 'Restaurant submitted for approval');
              loadRestaurant();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to submit for approval');
            }
          },
        },
      ]
    );
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
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Status</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
          <Text style={styles.statusText}>{status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Restaurant Information</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Restaurant name"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Restaurant description"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="restaurant@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Primary Contact Name</Text>
          <TextInput
            style={styles.input}
            value={primaryContactName}
            onChangeText={setPrimaryContactName}
            placeholder="Contact person name"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Pickup Instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={pickupInstructions}
            onChangeText={setPickupInstructions}
            placeholder="Instructions for customers"
            multiline
            numberOfLines={4}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Settings</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Accept Orders</Text>
          <Switch
            value={acceptsOrders}
            onValueChange={setAcceptsOrders}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={acceptsOrders ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity
          style={[styles.actionButton, styles.switchRoleButton]}
          onPress={handleSwitchRole}
          disabled={switchingRole}
        >
          {switchingRole ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.actionButtonText}>🔄 Switch to User Mode</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.setDefaultButton]}
          onPress={async () => {
            try {
              const token = await SecureStore.getItemAsync('authToken');
              if (!token) return;
              
              await axios.post(
                '/auth/set-role',
                { role: 'restaurant', setAsDefault: true },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              
              Alert.alert('Success', 'Restaurant mode set as default');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to set default role');
            }
          }}
        >
          <Text style={styles.actionButtonText}>⭐ Set Restaurant as Default</Text>
        </TouchableOpacity>
        {status === 'draft' && (
          <TouchableOpacity style={styles.actionButton} onPress={handleSubmitForApproval}>
            <Text style={styles.actionButtonText}>Submit for Approval</Text>
          </TouchableOpacity>
        )}
        {(status === 'live' || status === 'paused') && (
          <TouchableOpacity
            style={[styles.actionButton, status === 'paused' && styles.actionButtonResume]}
            onPress={handleTogglePause}
          >
            <Text style={styles.actionButtonText}>
              {status === 'paused' ? 'Resume Orders' : 'Pause Orders'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'draft':
      return '#6c757d';
    case 'pending_approval':
      return '#FFC107';
    case 'live':
      return '#34C759';
    case 'paused':
      return '#FF9800';
    case 'suspended':
      return '#FF3B30';
    default:
      return '#6c757d';
  }
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
  statusCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    color: '#6c757d',
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
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonResume: {
    backgroundColor: '#34C759',
  },
  switchRoleButton: {
    backgroundColor: '#FF9500',
    marginBottom: 12,
  },
  setDefaultButton: {
    backgroundColor: '#5856D6',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 18,
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

