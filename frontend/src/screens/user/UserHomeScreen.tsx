import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { AuthContext } from '../../context/AuthContext';
import { reverseGeocode } from '../../services/location.service';
import axios from 'axios';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  cuisines?: string;
  avgPrepTimeMinutes: number;
  imageUrl?: string;
  location: string;
  distance?: number;
}

export function UserHomeScreen() {
  const navigation = useNavigation();
  const { user } = React.useContext(AuthContext);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);

  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    if (location) {
      loadNearbyRestaurants();
    }
  }, [location]);

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

  const loadNearbyRestaurants = async () => {
    if (!location) return;

    setLoadingRestaurants(true);
    try {
      // Fetch nearby restaurants using current location
      // Using on-route endpoint with same from/to for nearby search
      const response = await axios.post('/restaurants/on-route', {
        polyline: '', // Empty for nearby search
        fromLat: location.lat,
        fromLng: location.lng,
        toLat: location.lat + 0.01, // Small offset to create a route
        toLng: location.lng + 0.01,
        maxDetourKm: 5, // 5km radius for nearby
        maxWaitTimeMinutes: 30,
        transportMode: 'car',
      });

      // Calculate distance for each restaurant
      const restaurantsWithDistance = response.data.map((restaurant: Restaurant) => {
        const locationMatch = restaurant.location?.match(/POINT\(([^ ]+) ([^ ]+)\)/);
        if (locationMatch) {
          const restLat = parseFloat(locationMatch[2]);
          const restLng = parseFloat(locationMatch[1]);
          const distance = calculateDistance(
            location.lat,
            location.lng,
            restLat,
            restLng
          );
          return { ...restaurant, distance };
        }
        return restaurant;
      });

      // Sort by distance
      restaurantsWithDistance.sort((a: Restaurant, b: Restaurant) => {
        const distA = a.distance || 999;
        const distB = b.distance || 999;
        return distA - distB;
      });

      setRestaurants(restaurantsWithDistance.slice(0, 10)); // Show top 10
    } catch (error: any) {
      console.error('Error loading restaurants:', error);
      // If API fails, show empty state
      setRestaurants([]);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={styles.restaurantCard}
      onPress={() => navigation.navigate('RestaurantMenu', { restaurantId: item.id })}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.restaurantImage} />
      ) : (
        <View style={styles.restaurantImagePlaceholder}>
          <Text style={styles.restaurantImagePlaceholderText}>🍽️</Text>
        </View>
      )}
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{item.name}</Text>
        {item.cuisines && (
          <Text style={styles.restaurantCuisine}>{item.cuisines}</Text>
        )}
        <View style={styles.restaurantMeta}>
          <Text style={styles.restaurantMetaText}>
            📍 {item.distance ? `${item.distance.toFixed(1)} km` : 'Nearby'}
          </Text>
          <Text style={styles.restaurantMetaText}>
            ⏱️ {item.avgPrepTimeMinutes} min
          </Text>
        </View>
        {item.address && (
          <Text style={styles.restaurantAddress} numberOfLines={1}>
            {item.address}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Hello! 👋</Text>
            {locationName && (
              <Text style={styles.locationName} numberOfLines={1}>
                📍 {locationName}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Route Option Card */}
        <TouchableOpacity
          style={styles.routeCard}
          onPress={() => navigation.navigate('RouteSetup', { mode: 'route' })}
        >
          <View style={styles.routeCardContent}>
            <View style={styles.routeIconContainer}>
              <Text style={styles.routeIcon}>🗺️</Text>
            </View>
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeTitle}>Pick up on my route</Text>
              <Text style={styles.routeSubtitle}>
                Plan your route and discover restaurants along the way
              </Text>
            </View>
            <Text style={styles.routeArrow}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Nearby Restaurants Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Restaurants</Text>
            {loadingRestaurants && <ActivityIndicator size="small" color="#007AFF" />}
          </View>

          {loadingRestaurants ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Finding restaurants...</Text>
            </View>
          ) : restaurants.length > 0 ? (
            <FlatList
              data={restaurants}
              renderItem={renderRestaurant}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🍽️</Text>
              <Text style={styles.emptyText}>No restaurants found nearby</Text>
              <Text style={styles.emptySubtext}>
                Try the "Pick up on my route" option to find more restaurants
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
    marginRight: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  locationName: {
    fontSize: 14,
    color: '#6c757d',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 22,
  },
  scrollView: {
    flex: 1,
  },
  routeCard: {
    margin: 20,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  routeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  routeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  routeIcon: {
    fontSize: 28,
  },
  routeTextContainer: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  routeSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  routeArrow: {
    fontSize: 24,
    color: '#007AFF',
    marginLeft: 10,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6c757d',
    fontSize: 14,
  },
  restaurantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  restaurantImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f0f0f0',
  },
  restaurantImagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantImagePlaceholderText: {
    fontSize: 48,
  },
  restaurantInfo: {
    padding: 15,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  restaurantCuisine: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  restaurantMeta: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 12,
  },
  restaurantMetaText: {
    fontSize: 13,
    color: '#495057',
  },
  restaurantAddress: {
    fontSize: 12,
    color: '#adb5bd',
    marginTop: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
});
