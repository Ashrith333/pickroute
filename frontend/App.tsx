import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

import { AuthContext } from './src/context/AuthContext';
import { AuthStack } from './src/navigation/AuthStack';
import { UserStack } from './src/navigation/UserStack';
import { RestaurantStack } from './src/navigation/RestaurantStack';
import { AdminStack } from './src/navigation/AdminStack';
import { API_BASE_URL } from './src/config';

const Stack = createNativeStackNavigator();

// Configure axios
axios.defaults.baseURL = API_BASE_URL;
axios.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    bootstrapApp();
  }, []);

  const bootstrapApp = async () => {
    try {
      // Get app config (with timeout and error handling)
      try {
        const configResponse = await axios.get('/app/config', {
          timeout: 5000, // 5 second timeout
        });
        console.log('App config:', configResponse.data);
      } catch (error: any) {
        console.warn('Could not connect to backend:', error.message);
        console.warn('Make sure backend is running on:', API_BASE_URL);
        // Continue anyway - user can still use the app
      }

      // Check for existing session
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        try {
          const sessionResponse = await axios.get('/auth/session', {
            timeout: 5000,
          });
          setUser(sessionResponse.data.user);
          setRole(sessionResponse.data.user.role);
        } catch (error) {
          // Token invalid or network error, clear it
          console.warn('Session check failed, clearing token');
          await SecureStore.deleteItemAsync('authToken');
        }
      }
    } catch (error: any) {
      console.error('Bootstrap error:', error.message);
      // Don't block app startup on network errors
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (token: string, userData: any) => {
    await SecureStore.setItemAsync('authToken', token);
    setUser(userData);
    setRole(userData.role);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('authToken');
    setUser(null);
    setRole(null);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, role, signIn, signOut }}>
      <NavigationContainer>
        {!user ? (
          <AuthStack />
        ) : role === 'user' ? (
          <UserStack />
        ) : role === 'restaurant' ? (
          <RestaurantStack />
        ) : role === 'admin' ? (
          <AdminStack />
        ) : (
          <AuthStack />
        )}
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

