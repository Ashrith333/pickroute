import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

export function RoleSelectionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { token, userData, isNewUser } = route.params as {
    token: string;
    userData: any;
    isNewUser: boolean;
  };
  const { signIn } = React.useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'user' | 'restaurant' | null>(null);
  const [setAsDefault, setSetAsDefault] = useState(false);

  const handleRoleSelect = async (role: 'user' | 'restaurant') => {
    if (loading) return;

    setSelectedRole(role);
    setLoading(true);

    try {
      // Update user's role (works for both new and existing users)
      const response = await axios.post(
        '/auth/set-role',
        { role, setAsDefault },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        await signIn(response.data.token, response.data.user);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to set role');
      setLoading(false);
      setSelectedRole(null);
    }
  };

  // Pre-select current role if user already has one
  useEffect(() => {
    if (userData?.role && (userData.role === 'user' || userData.role === 'restaurant')) {
      setSelectedRole(userData.role);
    }
  }, [userData]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Account Type</Text>
      <Text style={styles.subtitle}>
        Select how you want to use PickRoute
      </Text>

      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedRole === 'user' && styles.roleCardSelected,
            loading && styles.roleCardDisabled,
          ]}
          onPress={() => handleRoleSelect('user')}
          disabled={loading}
        >
          <View style={styles.roleIcon}>
            <Text style={styles.roleIconText}>👤</Text>
          </View>
          <Text style={styles.roleTitle}>User</Text>
          <Text style={styles.roleDescription}>
            Order food and pick up on your route
          </Text>
          {selectedRole === 'user' && loading && (
            <ActivityIndicator color="#007AFF" style={styles.loadingSpinner} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedRole === 'restaurant' && styles.roleCardSelected,
            loading && styles.roleCardDisabled,
          ]}
          onPress={() => handleRoleSelect('restaurant')}
          disabled={loading}
        >
          <View style={styles.roleIcon}>
            <Text style={styles.roleIconText}>🍽️</Text>
          </View>
          <Text style={styles.roleTitle}>Restaurant Owner</Text>
          <Text style={styles.roleDescription}>
            Manage your restaurant and accept orders
          </Text>
          {selectedRole === 'restaurant' && loading && (
            <ActivityIndicator color="#007AFF" style={styles.loadingSpinner} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.defaultOption}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setSetAsDefault(!setAsDefault)}
        >
          <Text style={styles.checkbox}>{setAsDefault ? '☑️' : '☐'}</Text>
          <Text style={styles.checkboxLabel}>Set as default role</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        {userData?.role 
          ? `Current role: ${userData.role}. You can switch anytime.`
          : 'You can switch between roles later in settings'
        }
      </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 40,
    textAlign: 'center',
  },
  roleContainer: {
    gap: 20,
    marginBottom: 30,
  },
  roleCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#e9ecef',
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  roleCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  roleCardDisabled: {
    opacity: 0.6,
  },
  roleIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleIconText: {
    fontSize: 40,
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingSpinner: {
    marginTop: 12,
  },
  defaultOption: {
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  checkbox: {
    fontSize: 20,
    marginRight: 10,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  note: {
    fontSize: 12,
    color: '#adb5bd',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

