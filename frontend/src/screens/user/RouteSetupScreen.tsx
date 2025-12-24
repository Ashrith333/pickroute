import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import axios from 'axios';
import { reverseGeocode } from '../../services/location.service';
import { searchAddresses, getAddressFromCoordinates, AddressSuggestion } from '../../services/address.service';
import { MapView } from '../../components/MapView';
import { MapPicker } from '../../components/MapPicker';

interface Stop {
  id: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
  isFrom: boolean;
  isTo: boolean;
}

export function RouteSetupScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { mode } = route.params as { mode: 'route' | 'nearby' };

  const [stops, setStops] = useState<Stop[]>([]);
  const [transportMode, setTransportMode] = useState<'car' | 'bike' | 'walk'>('car');
  const [maxDetourKm, setMaxDetourKm] = useState(5);
  const [maxWaitTime, setMaxWaitTime] = useState(10);
  const [loading, setLoading] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState<string | null>(null);
  const [editingStopId, setEditingStopId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showMapPicker, setShowMapPicker] = useState<string | null>(null);
  const [mapPickerLocation, setMapPickerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeStops();
  }, []);

  useEffect(() => {
    // Debounce address search
    if (searchQuery.length >= 3 && editingStopId) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        performAddressSearch(searchQuery);
      }, 500);
    } else {
      setAddressSuggestions([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, editingStopId]);

  const initializeStops = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is required to set your starting point');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;

      const address = await reverseGeocode(lat, lng);
      const fromAddress = address?.formattedAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      setStops([
        {
          id: 'from',
          lat,
          lng,
          address: fromAddress,
          isFrom: true,
          isTo: false,
        },
        {
          id: 'to',
          lat: null,
          lng: null,
          address: null,
          isFrom: false,
          isTo: true,
        },
      ]);
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get your location. Please enable location services.');
    }
  };

  const performAddressSearch = async (query: string) => {
    if (!editingStopId) return;

    try {
      console.log('Searching addresses for:', query);
      const suggestions = await searchAddresses(query, 8);
      console.log('Found suggestions:', suggestions.length);
      setAddressSuggestions(suggestions);
    } catch (error) {
      console.error('Address search error:', error);
      setAddressSuggestions([]);
    }
  };

  const handleAddressSelect = async (suggestion: AddressSuggestion) => {
    if (!editingStopId) return;

    setStops((prev) =>
      prev.map((stop) =>
        stop.id === editingStopId
          ? {
              ...stop,
              lat: suggestion.lat,
              lng: suggestion.lon,
              address: suggestion.display_name,
            }
          : stop
      )
    );
    setSearchQuery('');
    setAddressSuggestions([]);
    setEditingStopId(null);
    Keyboard.dismiss();
  };

  const handleMapSelection = async (lat: number, lng: number) => {
    if (!showMapPicker) return;

    // Update map picker location in real-time
    setMapPickerLocation({ lat, lng });
  };

  const confirmMapSelection = async () => {
    if (!showMapPicker || !mapPickerLocation) return;

    const { lat, lng } = mapPickerLocation;
    
    // Get address for selected location
    const address = await getAddressFromCoordinates(lat, lng);
    const addressText = address?.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    setStops((prev) =>
      prev.map((stop) =>
        stop.id === showMapPicker
          ? {
              ...stop,
              lat,
              lng,
              address: addressText,
            }
          : stop
      )
    );

    setShowMapPicker(null);
    setMapPickerLocation(null);
  };

  const addStop = () => {
    const newStop: Stop = {
      id: `stop-${Date.now()}`,
      lat: null,
      lng: null,
      address: null,
      isFrom: false,
      isTo: false,
    };
    setStops([...stops, newStop]);
    setEditingStopId(newStop.id);
  };

  const removeStop = (stopId: string) => {
    if (stops.length <= 2) {
      Alert.alert('Cannot Remove', 'You need at least From and To locations');
      return;
    }
    setStops(stops.filter((stop) => stop.id !== stopId));
  };

  const handlePreview = async () => {
    const fromStop = stops.find((s) => s.isFrom);
    const toStop = stops.find((s) => s.isTo);
    const viaStops = stops.filter((s) => !s.isFrom && !s.isTo);

    if (!fromStop?.lat || !fromStop?.lng || !toStop?.lat || !toStop?.lng) {
      Alert.alert('Error', 'Please set both From and To locations');
      return;
    }

    setLoading(true);
    try {
      const viaStop = viaStops.length > 0 ? viaStops[0] : null;

      const response = await axios.post('/routes/preview', {
        fromLat: fromStop.lat,
        fromLng: fromStop.lng,
        toLat: toStop.lat,
        toLng: toStop.lng,
        viaLat: viaStop?.lat || null,
        viaLng: viaStop?.lng || null,
        transportMode,
        maxDetourKm,
        maxWaitTimeMinutes: maxWaitTime,
      });

      navigation.navigate('RestaurantDiscovery', {
        routeData: response.data,
        fromLat: fromStop.lat,
        fromLng: fromStop.lng,
        toLat: toStop.lat,
        toLng: toStop.lng,
        viaLat: viaStop?.lat || null,
        viaLng: viaStop?.lng || null,
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
    const fromStop = stops.find((s) => s.isFrom);
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Finding restaurants near you...</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            if (fromStop?.lat && fromStop?.lng) {
              navigation.navigate('RestaurantDiscovery', {
                mode: 'nearby',
                fromLat: fromStop.lat,
                fromLng: fromStop.lng,
              });
            }
          }}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fromStop = stops.find((s) => s.isFrom);
  const toStop = stops.find((s) => s.isTo);
  const viaStops = stops.filter((s) => !s.isFrom && !s.isTo);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Plan Your Route</Text>

      {/* From Location */}
      <View style={styles.section}>
        <Text style={styles.label}>From</Text>
        <View style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <Text style={styles.locationIconText}>📍</Text>
          </View>
          <View style={styles.locationContent}>
            {fromStop?.address ? (
              <Text style={styles.locationText}>{fromStop.address}</Text>
            ) : (
              <Text style={styles.locationPlaceholder}>Getting your location...</Text>
            )}
            {fromStop?.lat && fromStop?.lng && (
              <Text style={styles.coordsText}>
                {fromStop.lat.toFixed(6)}, {fromStop.lng.toFixed(6)}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => {
              if (fromStop?.lat && fromStop?.lng) {
                setMapPickerLocation({ lat: fromStop.lat, lng: fromStop.lng });
                setShowMapPicker('from');
              }
            }}
          >
            <Text style={styles.mapButtonText}>🗺️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* To Location */}
      <View style={styles.section}>
        <Text style={styles.label}>To *</Text>
        {editingStopId === 'to' ? (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search destination address..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setEditingStopId(null);
                setSearchQuery('');
                setAddressSuggestions([]);
              }}
            >
              <Text style={styles.cancelButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.locationCard}>
            <View style={styles.locationIcon}>
              <Text style={styles.locationIconText}>🎯</Text>
            </View>
            <View style={styles.locationContent}>
              {toStop?.address ? (
                <TouchableOpacity onPress={() => setEditingStopId('to')}>
                  <Text style={styles.locationText}>{toStop.address}</Text>
                  {toStop.lat && toStop.lng && (
                    <Text style={styles.coordsText}>
                      {toStop.lat.toFixed(6)}, {toStop.lng.toFixed(6)}
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setEditingStopId('to')}>
                  <Text style={styles.locationPlaceholder}>Tap to search or select on map</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => {
                const initialLat = toStop?.lat || fromStop?.lat || 28.6139;
                const initialLng = toStop?.lng || fromStop?.lng || 77.2090;
                setMapPickerLocation({ lat: initialLat, lng: initialLng });
                setShowMapPicker('to');
              }}
            >
              <Text style={styles.mapButtonText}>🗺️</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Address Suggestions */}
        {editingStopId === 'to' && addressSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {addressSuggestions.map((item, index) => (
              <TouchableOpacity
                key={`${item.lat}-${item.lon}-${index}`}
                style={styles.suggestionItem}
                onPress={() => handleAddressSelect(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionIcon}>📍</Text>
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {item.display_name}
                  </Text>
                  {(item.address.city || item.address.state) && (
                    <Text style={styles.suggestionSubtext}>
                      {[item.address.city, item.address.state].filter(Boolean).join(', ')}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Via Stops */}
      {viaStops.map((stop) => (
        <View key={stop.id} style={styles.section}>
          <View style={styles.stopHeader}>
            <Text style={styles.label}>Stop</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeStop(stop.id)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
          {editingStopId === stop.id ? (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search stop location..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditingStopId(null);
                  setSearchQuery('');
                  setAddressSuggestions([]);
                }}
              >
                <Text style={styles.cancelButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.locationCard}>
              <View style={styles.locationIcon}>
                <Text style={styles.locationIconText}>🚩</Text>
              </View>
              <View style={styles.locationContent}>
                {stop.address ? (
                  <TouchableOpacity onPress={() => setEditingStopId(stop.id)}>
                    <Text style={styles.locationText}>{stop.address}</Text>
                    {stop.lat && stop.lng && (
                      <Text style={styles.coordsText}>
                        {stop.lat.toFixed(6)}, {stop.lng.toFixed(6)}
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => setEditingStopId(stop.id)}>
                    <Text style={styles.locationPlaceholder}>Tap to search or select on map</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => {
                  const initialLat = stop.lat || fromStop?.lat || 28.6139;
                  const initialLng = stop.lng || fromStop?.lng || 77.2090;
                  setMapPickerLocation({ lat: initialLat, lng: initialLng });
                  setShowMapPicker(stop.id);
                }}
              >
                <Text style={styles.mapButtonText}>🗺️</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Address Suggestions for Via */}
          {editingStopId === stop.id && addressSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {addressSuggestions.map((item, index) => (
                <TouchableOpacity
                  key={`${item.lat}-${item.lon}-${index}`}
                  style={styles.suggestionItem}
                  onPress={() => handleAddressSelect(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionIcon}>📍</Text>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionText} numberOfLines={2}>
                      {item.display_name}
                    </Text>
                    {(item.address.city || item.address.state) && (
                      <Text style={styles.suggestionSubtext}>
                        {[item.address.city, item.address.state].filter(Boolean).join(', ')}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}

      {/* Add Stop Button */}
      <TouchableOpacity style={styles.addStopButton} onPress={addStop}>
        <Text style={styles.addStopIcon}>+</Text>
        <Text style={styles.addStopText}>Add Stop</Text>
      </TouchableOpacity>

      {/* Transport Mode */}
      <View style={styles.section}>
        <Text style={styles.label}>Transport Mode</Text>
        <View style={styles.transportContainer}>
          <TouchableOpacity
            style={[
              styles.transportButton,
              transportMode === 'car' && styles.transportButtonActive,
            ]}
            onPress={() => setTransportMode('car')}
          >
            <Text style={styles.transportIcon}>🚗</Text>
            <Text
              style={[
                styles.transportText,
                transportMode === 'car' && styles.transportTextActive,
              ]}
            >
              Car
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.transportButton,
              transportMode === 'bike' && styles.transportButtonActive,
            ]}
            onPress={() => setTransportMode('bike')}
          >
            <Text style={styles.transportIcon}>🚴</Text>
            <Text
              style={[
                styles.transportText,
                transportMode === 'bike' && styles.transportTextActive,
              ]}
            >
              Bike
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.transportButton,
              transportMode === 'walk' && styles.transportButtonActive,
            ]}
            onPress={() => setTransportMode('walk')}
          >
            <Text style={styles.transportIcon}>🚶</Text>
            <Text
              style={[
                styles.transportText,
                transportMode === 'walk' && styles.transportTextActive,
              ]}
            >
              Walk
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Max Detour */}
      <View style={styles.section}>
        <Text style={styles.label}>Max Detour: {maxDetourKm} km</Text>
        <View style={styles.sliderContainer}>
          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() => setMaxDetourKm(Math.max(0, maxDetourKm - 1))}
          >
            <Text style={styles.sliderButtonText}>−</Text>
          </TouchableOpacity>
          <View style={styles.sliderValue}>
            <Text style={styles.sliderValueText}>{maxDetourKm} km</Text>
          </View>
          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() => setMaxDetourKm(Math.min(50, maxDetourKm + 1))}
          >
            <Text style={styles.sliderButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Max Wait Time */}
      <View style={styles.section}>
        <Text style={styles.label}>Max Wait Time: {maxWaitTime} min</Text>
        <View style={styles.sliderContainer}>
          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() => setMaxWaitTime(Math.max(0, maxWaitTime - 1))}
          >
            <Text style={styles.sliderButtonText}>−</Text>
          </TouchableOpacity>
          <View style={styles.sliderValue}>
            <Text style={styles.sliderValueText}>{maxWaitTime} min</Text>
          </View>
          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() => setMaxWaitTime(Math.min(60, maxWaitTime + 1))}
          >
            <Text style={styles.sliderButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Find Restaurants Button */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handlePreview}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Find Restaurants</Text>
        )}
      </TouchableOpacity>

      {/* Map Picker Modal - Uber-style */}
      <Modal
        visible={showMapPicker !== null}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowMapPicker(null)}
      >
        <MapPicker
          initialLocation={
            mapPickerLocation
              ? { lat: mapPickerLocation.lat, lng: mapPickerLocation.lng }
              : fromStop?.lat && fromStop?.lng
              ? { lat: fromStop.lat, lng: fromStop.lng }
              : undefined
          }
          onLocationSelect={(lat, lng, address) => {
            handleMapSelection(lat, lng);
            // Update address if provided
            if (address && showMapPicker) {
              setStops((prev) =>
                prev.map((stop) =>
                  stop.id === showMapPicker
                    ? { ...stop, lat, lng, address }
                    : stop
                )
              );
            }
            setShowMapPicker(null);
            setMapPickerLocation(null);
          }}
          onClose={() => {
            setShowMapPicker(null);
            setMapPickerLocation(null);
          }}
          title={
            showMapPicker === 'from'
              ? 'Select From Location'
              : showMapPicker === 'to'
              ? 'Select To Location'
              : 'Select Stop Location'
          }
        />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationIconText: {
    fontSize: 20,
  },
  locationContent: {
    flex: 1,
  },
  locationText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
    marginBottom: 4,
  },
  locationPlaceholder: {
    fontSize: 15,
    color: '#adb5bd',
    fontStyle: 'italic',
  },
  coordsText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  mapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  mapButtonText: {
    fontSize: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    paddingVertical: 14,
  },
  cancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 18,
    color: '#666',
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'visible',
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'flex-start',
  },
  suggestionIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
    marginBottom: 4,
  },
  suggestionSubtext: {
    fontSize: 13,
    color: '#6c757d',
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeButtonText: {
    color: '#ff3b30',
    fontSize: 14,
    fontWeight: '500',
  },
  addStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addStopIcon: {
    fontSize: 24,
    color: '#007AFF',
    marginRight: 8,
    fontWeight: '300',
  },
  addStopText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  transportContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  transportButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  transportButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  transportIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  transportText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
  },
  transportTextActive: {
    color: '#007AFF',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
  },
  sliderButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: '300',
  },
  sliderValue: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  sliderValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Map Modal Styles
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  mapModalCloseButton: {
    padding: 8,
  },
  mapModalCloseText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  mapModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  mapModalPlaceholder: {
    width: 60,
  },
  mapModalMapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  mapModalFooter: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  mapModalInstruction: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 15,
  },
  mapModalConfirmButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  mapModalConfirmButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  mapModalConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
