import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UserHomeScreen } from '../screens/user/UserHomeScreen';
import { RouteSetupScreen } from '../screens/user/RouteSetupScreen';
import { RestaurantDiscoveryScreen } from '../screens/user/RestaurantDiscoveryScreen';
import { RestaurantMenuScreen } from '../screens/user/RestaurantMenuScreen';
import { PickupTimeConfirmationScreen } from '../screens/user/PickupTimeConfirmationScreen';
import { PaymentScreen } from '../screens/user/PaymentScreen';
import { LiveOrderTrackingScreen } from '../screens/user/LiveOrderTrackingScreen';
import { PickupScreen } from '../screens/user/PickupScreen';
import { OrderCompleteScreen } from '../screens/user/OrderCompleteScreen';
import { ProfileScreen } from '../screens/user/ProfileScreen';

const Stack = createNativeStackNavigator();

export function UserStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="UserHome"
        component={UserHomeScreen}
        options={{ title: 'PickRoute' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="RouteSetup"
        component={RouteSetupScreen}
        options={{ title: 'Plan Your Route' }}
      />
      <Stack.Screen
        name="RestaurantDiscovery"
        component={RestaurantDiscoveryScreen}
        options={{ title: 'Restaurants on Route' }}
      />
      <Stack.Screen
        name="RestaurantMenu"
        component={RestaurantMenuScreen}
        options={{ title: 'Menu' }}
      />
      <Stack.Screen
        name="PickupTimeConfirmation"
        component={PickupTimeConfirmationScreen}
        options={{ title: 'Confirm Pickup Time' }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: 'Payment' }}
      />
      <Stack.Screen
        name="LiveOrderTracking"
        component={LiveOrderTrackingScreen}
        options={{ title: 'Order Tracking' }}
      />
      <Stack.Screen
        name="Pickup"
        component={PickupScreen}
        options={{ title: 'Pickup' }}
      />
      <Stack.Screen
        name="OrderComplete"
        component={OrderCompleteScreen}
        options={{ title: 'Order Complete' }}
      />
    </Stack.Navigator>
  );
}

