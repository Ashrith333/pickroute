import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { ProfileScreen } from '../screens/user/ProfileScreen';

const Stack = createNativeStackNavigator();

function AdminPlaceholder() {
  const navigation = useNavigation();
  const { user } = React.useContext(AuthContext);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.text}>Admin screens coming soon</Text>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AdminHome"
        component={AdminPlaceholder}
        options={{ title: 'Admin Dashboard' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  text: {
    fontSize: 18,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
});

