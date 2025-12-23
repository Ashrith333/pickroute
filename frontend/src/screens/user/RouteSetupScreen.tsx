import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import axios from 'axios';
import { reverseGeocode, geocode } from '../../services/location.service';

export function RouteSetupScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { mode } = route.params as { mode: 'route' | 'nearby' };

  const [fromLat, setFromLat] = useState<number | null>(null);
  const [fromLng, setFromLng] = useState<number | null>(null);
  const [toLat, setToLat] = useState<number | null>(null);
  const [toLng, setToLng] = useState<number | null>(null);
  const [viaLat, setViaLat] = useState<number | null>(null);
  const [viaLng, setViaLng] = useState<number | null>(null);
  const [transportMode, setTransportMode] = useState('car');
  const [maxDetourKm, setMaxDetourKm] = useState(5);
  const [maxWaitTime, setMaxWaitTime] = useState(10);
  const [loading, setLoading] = useState(false);
  
  // Friendly location names
  const [fromAddress, setFromAddress] = useState<string | null>(null);
  const [toAddress, setToAddress] = useState<string | null>(null);
  const [viaAddress, setViaAddress] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setFromLat(lat);
      setFromLng(lng);

      // Get friendly address
      const address = await reverseGeocode(lat, lng);
      if (address) {
        setFromAddress(address.formattedAddress);
      }
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const handlePreview = async () => {
    if (!fromLat || !fromLng || !toLat || !toLng) {
      Alert.alert('Error', 'Please set both From and To locations');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/routes/preview', {
        fromLat,
        fromLng,
        toLat,
        toLng,
        viaLat,
        viaLng,
        transportMode,
        maxDetourKm,
        maxWaitTimeMinutes: maxWaitTime,
      });

      navigation.navigate('RestaurantDiscovery', {
        routeData: response.data,
        fromLat,
        fromLng,
        toLat,
        toLng,
        viaLat,
        viaLng,
        transportMode,
        maxDetourKm,
        maxWaitTime,
      });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to preview route');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'nearby') {
    // Simplified nearby mode - just go to discovery
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Finding restaurants near you...</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            if (fromLat && fromLng) {
              navigation.navigate('RestaurantDiscovery', {
                mode: 'nearby',
                fromLat,
                fromLng,
              });
            }
          }}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>From (A)</Text>
        <View style={styles.locationDisplay}>
          {fromAddress ? (
            <Text style={styles.locationText}>{fromAddress}</Text>
          ) : fromLat && fromLng ? (
            <Text style={styles.locationText}>
              {fromLat.toFixed(4)}, {fromLng.toFixed(4)}
            </Text>
          ) : (
            <Text style={styles.locationTextPlaceholder}>Getting location...</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>To (B) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter destination address (e.g., 123 Main St, City)"
          value={toAddress || ''}
          onChangeText={async (text) => {
            setToAddress(text);
            if (text.length > 5) {
              setLoadingAddress(true);
              const coords = await geocode(text);
              if (coords) {
                setToLat(coords.lat);
                setToLng(coords.lng);
                const address = await reverseGeocode(coords.lat, coords.lng);
                if (address) {
                  setToAddress(address.formattedAddress);
                }
              }
              setLoadingAddress(false);
            }
          }}
        />
        {toLat && toLng && (
          <Text style={styles.coordsHint}>
            📍 {toLat.toFixed(4)}, {toLng.toFixed(4)}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Via (C) - Optional</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter via point address (optional)"
          value={viaAddress || ''}
          onChangeText={async (text) => {
            setViaAddress(text);
            if (text.length > 5) {
              setLoadingAddress(true);
              const coords = await geocode(text);
              if (coords) {
                setViaLat(coords.lat);
                setViaLng(coords.lng);
                const address = await reverseGeocode(coords.lat, coords.lng);
                if (address) {
                  setViaAddress(address.formattedAddress);
                }
              }
              setLoadingAddress(false);
            }
          }}
        />
        {viaLat && viaLng && (
          <Text style={styles.coordsHint}>
            📍 {viaLat.toFixed(4)}, {viaLng.toFixed(4)}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Transport Mode</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[styles.radio, transportMode === 'car' && styles.radioSelected]}
            onPress={() => setTransportMode('car')}
          >
            <Text>🚗 Car</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.radio, transportMode === 'bike' && styles.radioSelected]}
            onPress={() => setTransportMode('bike')}
          >
            <Text>🚴 Bike</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Max Detour: {maxDetourKm} km</Text>
        <View style={styles.sliderContainer}>
          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() => setMaxDetourKm(Math.max(0, maxDetourKm - 1))}
          >
            <Text>-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() => setMaxDetourKm(Math.min(50, maxDetourKm + 1))}
          >
            <Text>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Max Wait Time: {maxWaitTime} min</Text>
        <View style={styles.sliderContainer}>
          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() => setMaxWaitTime(Math.max(0, maxWaitTime - 1))}
          >
            <Text>-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() => setMaxWaitTime(Math.min(60, maxWaitTime + 1))}
          >
            <Text>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handlePreview}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Calculating...' : 'Find Restaurants'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  locationDisplay: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  locationTextPlaceholder: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  coordsHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  radio: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  radioSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sliderContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  sliderButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
});

