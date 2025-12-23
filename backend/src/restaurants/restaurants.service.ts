import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { MenuItem } from './entities/menu-item.entity';
import { OnRouteDto } from './dto/restaurant.dto';
import * as geolib from 'geolib';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    @InjectRepository(MenuItem)
    private menuItemRepository: Repository<MenuItem>,
  ) {}

  /**
   * Generate dummy restaurants near user location for testing
   */
  private generateDummyRestaurants(userLat: number, userLng: number) {
    const dummyRestaurants = [
      {
        id: 'dummy-1',
        name: 'Spice Garden',
        description: 'Authentic North Indian cuisine',
        address: '123 Main Street, Near Metro Station',
        city: 'Delhi',
        cuisines: ['North Indian', 'Vegetarian'],
        avgPrepTimeMinutes: 15,
        parkingAvailable: true,
        sameSideOfRoad: true,
        isActive: true,
        acceptsOrders: true,
      },
      {
        id: 'dummy-2',
        name: 'Pizza Corner',
        description: 'Fresh wood-fired pizzas',
        address: '456 Market Road',
        city: 'Delhi',
        cuisines: ['Italian', 'Fast Food'],
        avgPrepTimeMinutes: 20,
        parkingAvailable: false,
        sameSideOfRoad: true,
        isActive: true,
        acceptsOrders: true,
      },
      {
        id: 'dummy-3',
        name: 'Burger House',
        description: 'Gourmet burgers and fries',
        address: '789 Food Court',
        city: 'Delhi',
        cuisines: ['American', 'Fast Food'],
        avgPrepTimeMinutes: 10,
        parkingAvailable: true,
        sameSideOfRoad: false,
        isActive: true,
        acceptsOrders: true,
      },
      {
        id: 'dummy-4',
        name: 'Chinese Express',
        description: 'Quick Chinese meals',
        address: '321 Commercial Street',
        city: 'Delhi',
        cuisines: ['Chinese', 'Asian'],
        avgPrepTimeMinutes: 12,
        parkingAvailable: false,
        sameSideOfRoad: true,
        isActive: true,
        acceptsOrders: true,
      },
      {
        id: 'dummy-5',
        name: 'South Indian Delight',
        description: 'Traditional South Indian dishes',
        address: '654 Temple Road',
        city: 'Delhi',
        cuisines: ['South Indian', 'Vegetarian'],
        avgPrepTimeMinutes: 18,
        parkingAvailable: true,
        sameSideOfRoad: true,
        isActive: true,
        acceptsOrders: true,
      },
      {
        id: 'dummy-6',
        name: 'Cafe Mocha',
        description: 'Coffee, sandwiches, and desserts',
        address: '987 Mall Road',
        city: 'Delhi',
        cuisines: ['Cafe', 'Continental'],
        avgPrepTimeMinutes: 8,
        parkingAvailable: true,
        sameSideOfRoad: false,
        isActive: true,
        acceptsOrders: true,
      },
    ];

    // Generate locations near user (within 2-5km radius)
    return dummyRestaurants.map((rest, index) => {
      // Create locations in a circle around user
      const angle = (index * 60) * (Math.PI / 180); // 60 degrees apart
      const distanceKm = 2 + (index % 3) * 1; // 2-4 km away
      const distanceMeters = distanceKm * 1000;

      // Calculate offset (rough approximation)
      const latOffset = (distanceMeters / 111320) * Math.cos(angle);
      const lngOffset = (distanceMeters / (111320 * Math.cos(userLat * Math.PI / 180))) * Math.sin(angle);

      const restLat = userLat + latOffset;
      const restLng = userLng + lngOffset;

      return {
        ...rest,
        location: `POINT(${restLng} ${restLat})`,
      };
    });
  }

  async findOnRoute(dto: OnRouteDto) {
    const {
      polyline,
      fromLat,
      fromLng,
      toLat,
      toLng,
      maxDetourKm = 5,
      maxWaitTimeMinutes = 10,
      arrivalEta,
      filters = [],
    } = dto;

    // Get all active restaurants
    let restaurants = await this.restaurantRepository.find({
      where: { isActive: true, acceptsOrders: true },
    });

    // If no restaurants in database, use dummy data near user location
    if (restaurants.length === 0 && fromLat && fromLng) {
      restaurants = this.generateDummyRestaurants(fromLat, fromLng) as any;
    }

    // Filter restaurants based on route constraints
    const onRouteRestaurants = [];

    for (const restaurant of restaurants) {
      // Parse restaurant location (PostGIS point format: "POINT(lng lat)")
      const locationMatch = restaurant.location?.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (!locationMatch) continue;

      const restLng = parseFloat(locationMatch[1]);
      const restLat = parseFloat(locationMatch[2]);

      // Calculate distance from route
      const detourKm = this.calculateDetour(
        { lat: fromLat, lng: fromLng },
        { lat: toLat, lng: toLng },
        { lat: restLat, lng: restLng },
      );

      if (detourKm > maxDetourKm) continue;

      // Check filters
      if (filters.includes('ready_under_10') && restaurant.avgPrepTimeMinutes > 10) {
        continue;
      }

      if (filters.includes('same_side') && !restaurant.sameSideOfRoad) {
        continue;
      }

      if (filters.includes('parking') && !restaurant.parkingAvailable) {
        continue;
      }

      // Calculate ready time
      const readyByTime = new Date();
      readyByTime.setMinutes(readyByTime.getMinutes() + restaurant.avgPrepTimeMinutes);

      // Calculate pickup confidence (simplified)
      const pickupConfidence = this.calculatePickupConfidence(
        detourKm,
        restaurant.avgPrepTimeMinutes,
        arrivalEta,
      );

      // Calculate distance from user (for nearby search)
      const distanceFromUser = geolib.getDistance(
        { lat: fromLat, lng: fromLng },
        { lat: restLat, lng: restLng }
      ) / 1000; // km

      onRouteRestaurants.push({
        ...restaurant,
        detourKm: Math.round(detourKm * 10) / 10,
        distance: Math.round(distanceFromUser * 10) / 10, // Add distance for nearby
        readyByTime: readyByTime.toISOString(),
        pickupConfidence,
      });
    }

    // Sort by detour distance
    onRouteRestaurants.sort((a, b) => a.detourKm - b.detourKm);

    return onRouteRestaurants;
  }

  private calculateDetour(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    restaurant: { lat: number; lng: number },
  ): number {
    // Calculate direct distance
    const directDistance = geolib.getDistance(from, to) / 1000; // km

    // Calculate distance via restaurant
    const viaDistance =
      (geolib.getDistance(from, restaurant) + geolib.getDistance(restaurant, to)) / 1000; // km

    // Detour is the extra distance
    return viaDistance - directDistance;
  }

  private calculatePickupConfidence(
    detourKm: number,
    prepTimeMinutes: number,
    arrivalEta?: number,
  ): number {
    // Simplified confidence calculation
    let confidence = 100;

    // Reduce confidence for longer detours
    confidence -= detourKm * 5;

    // Reduce confidence if prep time doesn't align with arrival
    if (arrivalEta) {
      const timeDiff = Math.abs(arrivalEta - prepTimeMinutes);
      confidence -= timeDiff * 2;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  async findOne(id: string) {
    return this.restaurantRepository.findOne({ where: { id } });
  }

  async findAll() {
    return this.restaurantRepository.find({
      where: { isActive: true },
    });
  }

  async findNearby(lat: number, lng: number, radiusKm: number) {
    // Using PostGIS ST_DWithin for efficient spatial queries
    const restaurants = await this.restaurantRepository
      .createQueryBuilder('restaurant')
      .where('restaurant.isActive = :isActive', { isActive: true })
      .andWhere(
        `ST_DWithin(
          restaurant.location::geography,
          ST_MakePoint(:lng, :lat)::geography,
          :radius
        )`,
        { lng, lat, radius: radiusKm * 1000 },
      )
      .getMany();

    return restaurants;
  }

  async getMenu(restaurantId: string) {
    return this.menuItemRepository.find({
      where: { restaurantId, isAvailable: true },
      order: { category: 'ASC', name: 'ASC' },
    });
  }
}

