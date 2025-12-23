import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RestaurantDashboardScreen } from '../screens/restaurant/RestaurantDashboardScreen';
import { OrderDetailScreen } from '../screens/restaurant/OrderDetailScreen';
import { ProfileScreen } from '../screens/user/ProfileScreen';

const Stack = createNativeStackNavigator();

export function RestaurantStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RestaurantDashboard"
        component={RestaurantDashboardScreen}
        options={{ title: 'Restaurant Dashboard' }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Order Details' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
}

