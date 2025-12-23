import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';

export function ProfileScreen() {
  const navigation = useNavigation();
  const { user, signOut } = React.useContext(AuthContext);

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
      </View>

      <View style={styles.section}>
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

