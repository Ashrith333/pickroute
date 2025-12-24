import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

export function ProfileScreen() {
  const navigation = useNavigation();
  const { user, signOut, signIn } = React.useContext(AuthContext);
  const [switchingRole, setSwitchingRole] = useState(false);

  const handleSwitchRole = async () => {
    Alert.alert(
      'Switch Role',
      'Switch to Restaurant Owner mode?',
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
                { role: 'restaurant' },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (response.data.success) {
                await signIn(response.data.token, response.data.user);
                // Navigation will automatically switch to RestaurantStack
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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            // Navigation will automatically switch to AuthStack
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{user?.phone || 'N/A'}</Text>
        </View>

        {user?.name && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{user.name}</Text>
          </View>
        )}

        {user?.email && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>{user?.role || 'user'}</Text>
        </View>
        {user?.defaultRole && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Default Role</Text>
            <Text style={styles.value}>{user.defaultRole}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleSwitchRole}
          disabled={switchingRole}
        >
          <Text style={styles.menuText}>🔄 Switch to Restaurant Owner</Text>
          {switchingRole ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.menuArrow}>›</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuItem}
          onPress={async () => {
            try {
              const token = await SecureStore.getItemAsync('authToken');
              if (!token) return;
              
              await axios.post(
                '/auth/set-role',
                { role: 'user', setAsDefault: true },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              
              Alert.alert('Success', 'User mode set as default');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to set default role');
            }
          }}
        >
          <Text style={styles.menuText}>⭐ Set User as Default</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
          <Text style={styles.menuText}>📋 Order History</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
          <Text style={styles.menuText}>⚙️ Settings</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
          <Text style={styles.menuText}>ℹ️ About</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.menuItem, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={[styles.menuText, styles.logoutText]}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 16,
    color: '#000',
  },
  menuArrow: {
    fontSize: 20,
    color: '#999',
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
});

