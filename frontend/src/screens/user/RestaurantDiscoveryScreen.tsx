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
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';

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
      const response = await axios.post('/restaurants/on-route', {
        polyline: routeData.routeData?.polyline || 'mock',
        fromLat: routeData.fromLat,
        fromLng: routeData.fromLng,
        toLat: routeData.toLat,
        toLng: routeData.toLng,
        viaLat: routeData.viaLat,
        viaLng: routeData.viaLng,
        maxDetourKm: routeData.maxDetourKm || 5,
        maxWaitTimeMinutes: routeData.maxWaitTime || 10,
        transportMode: routeData.transportMode,
        filters,
      });

      setRestaurants(response.data);
    } catch (error: any) {
      console.error('Error loading restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (filter: string) => {
    const newFilters = filters.includes(filter)
      ? filters.filter((f) => f !== filter)
      : [...filters, filter];
    setFilters(newFilters);
    // Reload with new filters
    setTimeout(loadRestaurants, 100);
  };

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
          initialRegion={{
            latitude: routeData.fromLat || 37.78825,
            longitude: routeData.fromLng || -122.4324,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          {restaurants.map((restaurant) => {
            const locationMatch = restaurant.location?.match(/POINT\(([^ ]+) ([^ ]+)\)/);
            if (!locationMatch) return null;
            return (
              <Marker
                key={restaurant.id}
                coordinate={{
                  latitude: parseFloat(locationMatch[2]),
                  longitude: parseFloat(locationMatch[1]),
                }}
                title={restaurant.name}
              />
            );
          })}
        </MapView>
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
            <Text>Ready ≤10 min</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filters.includes('same_side') && styles.filterButtonActive,
            ]}
            onPress={() => toggleFilter('same_side')}
          >
            <Text>Same side</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filters.includes('parking') && styles.filterButtonActive,
            ]}
            onPress={() => toggleFilter('parking')}
          >
            <Text>Parking</Text>
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
              🚗 {item.detourKm} km detour • ⏱️ Ready in {item.avgPrepTimeMinutes} min
            </Text>
            <Text style={styles.restaurantInfo}>
              🎯 {item.pickupConfidence}% confidence
            </Text>
            <Text style={styles.restaurantPrice}>₹{item.avgPrepTimeMinutes * 10}</Text>
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
    height: 250,
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
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  restaurantCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 8,
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
  },
  restaurantInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  restaurantPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 5,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
});

