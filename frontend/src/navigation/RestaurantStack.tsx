import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { RestaurantDashboardScreen } from '../screens/restaurant/RestaurantDashboardScreen';
import { RestaurantOnboardingScreen } from '../screens/restaurant/RestaurantOnboardingScreen';
import { OrderDetailScreen } from '../screens/restaurant/OrderDetailScreen';
import { MenuManagementScreen } from '../screens/restaurant/MenuManagementScreen';
import { PrepCapacityScreen } from '../screens/restaurant/PrepCapacityScreen';
import { EarningsScreen } from '../screens/restaurant/EarningsScreen';
import { RestaurantProfileScreen } from '../screens/restaurant/RestaurantProfileScreen';
import { ProfileScreen } from '../screens/user/ProfileScreen';
import axios from 'axios';

const Stack = createNativeStackNavigator();

export function RestaurantStack() {
  const [hasRestaurant, setHasRestaurant] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkRestaurant();
  }, []);

  const checkRestaurant = async () => {
    try {
      await axios.get('/restaurants/owner/my-restaurant');
      setHasRestaurant(true);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setHasRestaurant(false);
      } else {
        // Network error or other issue - assume no restaurant for now
        setHasRestaurant(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {!hasRestaurant ? (
        <Stack.Screen
          name="RestaurantOnboarding"
          component={RestaurantOnboardingScreen}
          options={{ title: 'Register Restaurant', headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="RestaurantDashboard"
            component={RestaurantDashboardScreen}
            options={{ title: 'Orders' }}
          />
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{ title: 'Order Details' }}
          />
          <Stack.Screen
            name="MenuManagement"
            component={MenuManagementScreen}
            options={{ title: 'Menu' }}
          />
          <Stack.Screen
            name="PrepCapacity"
            component={PrepCapacityScreen}
            options={{ title: 'Prep & Capacity' }}
          />
          <Stack.Screen
            name="Earnings"
            component={EarningsScreen}
            options={{ title: 'Earnings' }}
          />
          <Stack.Screen
            name="RestaurantProfile"
            component={RestaurantProfileScreen}
            options={{ title: 'Profile & Settings' }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Account' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

