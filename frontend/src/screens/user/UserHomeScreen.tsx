import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { AuthContext } from '../../context/AuthContext';
import { reverseGeocode } from '../../services/location.service';

export function UserHomeScreen() {
  const navigation = useNavigation();
  const { user, signOut } = React.useContext(AuthContext);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      setLoadingLocation(true);
      const loc = await Location.getCurrentPositionAsync({});
      const coords = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      };
      setLocation(coords);

      // Get user-friendly address
      const address = await reverseGeocode(coords.lat, coords.lng);
      if (address) {
        setLocationName(address.formattedAddress);
      } else {
        setLocationName(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
      }
    } catch (error) {
      console.error('Location error:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hello! 👋</Text>
            <Text style={styles.subtitle}>Where would you like to pick up food?</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('RouteSetup', { mode: 'route' })}
        >
          <Text style={styles.ctaIcon}>🗺️</Text>
          <Text style={styles.ctaTitle}>Pick up on my route</Text>
          <Text style={styles.ctaSubtitle}>
            Plan a route and discover restaurants along the way
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('RouteSetup', { mode: 'nearby' })}
        >
          <Text style={styles.ctaIcon}>📍</Text>
          <Text style={styles.ctaTitle}>Pick near me</Text>
          <Text style={styles.ctaSubtitle}>
            Find restaurants close to your current location
          </Text>
        </TouchableOpacity>
      </View>

      {location && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationLabel}>📍 Current Location</Text>
          {loadingLocation ? (
            <Text style={styles.locationText}>Loading address...</Text>
          ) : (
            <Text style={styles.locationText}>
              {locationName || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  ctaContainer: {
    padding: 20,
  },
  ctaButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 5,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  locationInfo: {
    padding: 15,
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

