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
    const restaurants = await this.restaurantRepository.find({
      where: { isActive: true, acceptsOrders: true },
    });

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

      onRouteRestaurants.push({
        ...restaurant,
        detourKm: Math.round(detourKm * 10) / 10,
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

