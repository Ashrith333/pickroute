import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PhoneAuthScreen } from '../screens/auth/PhoneAuthScreen';
import { OtpVerificationScreen } from '../screens/auth/OtpVerificationScreen';

const Stack = createNativeStackNavigator();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
    </Stack.Navigator>
  );
}

