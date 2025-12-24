import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { MapView } from '../../components/MapView';

export function RestaurantDiscoveryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const routeData = route.params as any;

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<string[]>([]);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      // Validate route data
      if (!routeData.fromLat || !routeData.fromLng || !routeData.toLat || !routeData.toLng) {
        console.error('Missing required route coordinates');
        setRestaurants([]);
        setLoading(false);
        return;
      }

      console.log('Loading restaurants for route:', {
        from: { lat: routeData.fromLat, lng: routeData.fromLng },
        to: { lat: routeData.toLat, lng: routeData.toLng },
        via: routeData.viaLat && routeData.viaLng ? { lat: routeData.viaLat, lng: routeData.viaLng } : null,
      });

      const response = await axios.post('/restaurants/on-route', {
        polyline: routeData.routeData?.polyline || null,
        fromLat: routeData.fromLat,
        fromLng: routeData.fromLng,
        toLat: routeData.toLat,
        toLng: routeData.toLng,
        viaLat: routeData.viaLat || null,
        viaLng: routeData.viaLng || null,
        maxDetourKm: routeData.maxDetourKm || 5,
        maxWaitTimeMinutes: routeData.maxWaitTime || 10,
        transportMode: routeData.transportMode || 'driving',
        filters,
      });

      console.log(`Found ${response.data.length} restaurants on route`);
      setRestaurants(response.data);
    } catch (error: any) {
      console.error('Error loading restaurants:', error);
      console.error('Error details:', error.response?.data);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (filter: string) => {
    const newFilters = filters.includes(filter)
      ? filters.filter((f) => f !== filter)
      : [...filters, filter];
    setFilters(newFilters);
    setTimeout(loadRestaurants, 100);
  };

  // Calculate map region to show all points
  const calculateMapRegion = () => {
    const points: Array<{ lat: number; lng: number }> = [];

    if (routeData.fromLat && routeData.fromLng) {
      points.push({ lat: routeData.fromLat, lng: routeData.fromLng });
    }
    if (routeData.toLat && routeData.toLng) {
      points.push({ lat: routeData.toLat, lng: routeData.toLng });
    }
    if (routeData.viaLat && routeData.viaLng) {
      points.push({ lat: routeData.viaLat, lng: routeData.viaLng });
    }

    restaurants.forEach((restaurant) => {
      const locationMatch = restaurant.location?.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (locationMatch) {
        const lat = parseFloat(locationMatch[2]);
        const lng = parseFloat(locationMatch[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          points.push({ lat, lng });
        }
      }
    });

    if (points.length === 0) {
      return {
        latitude: routeData.fromLat || 28.6139,
        longitude: routeData.fromLng || 77.2090,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = Math.max(maxLat - minLat, 0.01) * 1.5;
    const lngDelta = Math.max(maxLng - minLng, 0.01) * 1.5;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  };

  const mapRegion = calculateMapRegion();

  // Prepare markers for map
  const markers: Array<{
    id: string;
    latitude: number;
    longitude: number;
    title: string;
    color?: string;
  }> = [];

  if (routeData.fromLat && routeData.fromLng) {
    markers.push({
      id: 'from',
      latitude: routeData.fromLat,
      longitude: routeData.fromLng,
      title: 'From - Starting point',
      color: '#007AFF', // Blue
    });
  }

  if (routeData.toLat && routeData.toLng) {
    markers.push({
      id: 'to',
      latitude: routeData.toLat,
      longitude: routeData.toLng,
      title: 'To - Destination',
      color: '#FF3B30', // Red
    });
  }

  if (routeData.viaLat && routeData.viaLng) {
    markers.push({
      id: 'via',
      latitude: routeData.viaLat,
      longitude: routeData.viaLng,
      title: 'Via - Stop point',
      color: '#FF9500', // Orange
    });
  }

  restaurants.forEach((restaurant) => {
    const locationMatch = restaurant.location?.match(/POINT\(([^ ]+) ([^ ]+)\)/);
    if (!locationMatch) return;
    const lat = parseFloat(locationMatch[2]);
    const lng = parseFloat(locationMatch[1]);
    if (isNaN(lat) || isNaN(lng)) return;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

    markers.push({
      id: restaurant.id,
      latitude: lat,
      longitude: lng,
      title: restaurant.name,
      color: '#34C759', // Green for restaurants
    });
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Finding restaurants...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={mapRegion}
          markers={markers}
        />
      </View>

      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filters:</Text>
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filters.includes('ready_under_10') && styles.filterButtonActive,
            ]}
            onPress={() => toggleFilter('ready_under_10')}
          >
            <Text style={styles.filterButtonText}>Ready ≤10 min</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filters.includes('same_side') && styles.filterButtonActive,
            ]}
            onPress={() => toggleFilter('same_side')}
          >
            <Text style={styles.filterButtonText}>Same side</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filters.includes('parking') && styles.filterButtonActive,
            ]}
            onPress={() => toggleFilter('parking')}
          >
            <Text style={styles.filterButtonText}>Parking</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.restaurantCard}
            onPress={() => navigation.navigate('RestaurantMenu', { restaurantId: item.id })}
          >
            <Text style={styles.restaurantName}>{item.name}</Text>
            <Text style={styles.restaurantInfo}>
              🚗 {item.detourKm || item.distance || 0} km • ⏱️ Ready in {item.avgPrepTimeMinutes} min
            </Text>
            {item.pickupConfidence && (
              <Text style={styles.restaurantInfo}>
                🎯 {item.pickupConfidence}% confidence
              </Text>
            )}
            <Text style={styles.restaurantPrice}>
              {item.address || item.cuisines?.join(', ') || ''}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>No restaurants found. Try relaxing your constraints.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: 300,
    backgroundColor: '#e5e5e5',
  },
  map: {
    flex: 1,
  },
  filtersContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#1a1a1a',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#666',
  },
  restaurantCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    color: '#1a1a1a',
  },
  restaurantInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  restaurantPrice: {
    fontSize: 13,
    color: '#999',
    marginTop: 5,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
});
