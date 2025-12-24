import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { MenuItem } from './entities/menu-item.entity';
import { OnRouteDto } from './dto/restaurant.dto';
import {
  RestaurantRegistrationDto,
  UpdateRestaurantDto,
  UpdatePrepCapacityDto,
  Step6BankDetailsDto,
} from './dto/restaurant-registration.dto';
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
      viaLat,
      viaLng,
      maxDetourKm = 5,
      maxWaitTimeMinutes = 10,
      arrivalEta,
      filters = [],
    } = dto;

    console.log('Finding restaurants on route:', { fromLat, fromLng, toLat, toLng, viaLat, viaLng, maxDetourKm });

    // Validate required coordinates
    if (!fromLat || !fromLng || !toLat || !toLng) {
      console.warn('Missing required coordinates for route search');
      return [];
    }

    // Get all active restaurants (including those in draft/pending status for testing)
    // In production, you might want to filter by status: 'live'
    let restaurants = await this.restaurantRepository.find({
      where: { isActive: true },
      // Don't filter by acceptsOrders for now - let all active restaurants show
    });

    console.log(`Found ${restaurants.length} active restaurants in database`);

    // If no restaurants in database, use dummy data near user location
    if (restaurants.length === 0 && fromLat && fromLng) {
      console.log('No restaurants in database, generating dummy data');
      restaurants = this.generateDummyRestaurants(fromLat, fromLng) as any;
    }

    // Filter restaurants based on route constraints
    const onRouteRestaurants = [];

    // Use via point if provided, otherwise use direct route
    const routeTo = viaLat && viaLng ? { lat: viaLat, lng: viaLng } : { lat: toLat, lng: toLng };

    for (const restaurant of restaurants) {
      // Parse restaurant location (PostGIS point format: "POINT(lng lat)")
      const locationMatch = restaurant.location?.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (!locationMatch) {
        console.warn(`Restaurant ${restaurant.id} has invalid location format: ${restaurant.location}`);
        continue;
      }

      const restLng = parseFloat(locationMatch[1]);
      const restLat = parseFloat(locationMatch[2]);

      if (isNaN(restLat) || isNaN(restLng)) {
        console.warn(`Restaurant ${restaurant.id} has invalid coordinates`);
        continue;
      }

      // Calculate distance from route
      const detourKm = this.calculateDetour(
        { lat: fromLat, lng: fromLng },
        routeTo,
        { lat: restLat, lng: restLng },
      );

      if (detourKm > maxDetourKm) {
        continue;
      }

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

  async getMenu(restaurantId: string, includeUnavailable: boolean = false) {
    const whereCondition: any = { restaurantId };
    if (!includeUnavailable) {
      whereCondition.isAvailable = true;
    }
    
    return this.menuItemRepository.find({
      where: whereCondition,
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async getMenuForOwner(restaurantId: string) {
    // Restaurant owners see all items regardless of availability
    return this.getMenu(restaurantId, true);
  }

  // Restaurant owner methods
  async registerRestaurant(ownerId: string, dto: RestaurantRegistrationDto) {
    const { account, location, operatingHours, pickupInstructions } = dto;

    console.log('Registering restaurant for owner:', ownerId);
    console.log('Registration data:', JSON.stringify({ account, location: { ...location, location: '***' }, operatingHours, pickupInstructions }, null, 2));

    // Check if restaurant already exists for this owner
    const existing = await this.restaurantRepository.findOne({
      where: { ownerId },
    });

    if (existing) {
      throw new BadRequestException('Restaurant already registered for this account');
    }

    // Validate required fields
    if (!account?.legalName || !account?.displayName || !account?.phone || !account?.primaryContactName) {
      throw new BadRequestException('Missing required account information');
    }

    if (!location?.address || !location?.location?.lat || !location?.location?.lng) {
      throw new BadRequestException('Missing required location information');
    }

    if (!operatingHours) {
      throw new BadRequestException('Missing operating hours');
    }

    // Create restaurant - use raw SQL for PostGIS POINT
    const queryRunner = this.restaurantRepository.manager.connection.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Prepare values
      const values = [
        account.displayName, // $1 - name
        account.legalName, // $2 - legalName
        account.displayName, // $3 - displayName
        account.phone, // $4 - phone
        account.email || null, // $5 - email
        account.fssaiNumber || null, // $6 - fssaiNumber
        account.primaryContactName, // $7 - primaryContactName
        location.address, // $8 - address
        location.entryPickupPoint || null, // $9 - entryPickupPoint
        location.landmark || null, // $10 - landmark
        location.parkingAvailable || false, // $11 - parkingAvailable
        JSON.stringify(operatingHours), // $12 - operatingHours
        pickupInstructions || null, // $13 - pickupInstructions
        'draft', // $14 - status
        ownerId, // $15 - ownerId
        false, // $16 - isActive
        false, // $17 - acceptsOrders
        15, // $18 - defaultPrepTimeMinutes
        5, // $19 - maxOrdersPer15Min
        10, // $20 - maxOrdersPer30Min
        10, // $21 - holdTimeAfterReadyMinutes
        5, // $22 - peakHourBufferMinutes
        false, // $23 - autoAcceptOrders
        location.location.lng, // $24 - longitude for ST_MakePoint
        location.location.lat, // $25 - latitude for ST_MakePoint
      ];

      console.log('Executing SQL with values:', values.map((v, i) => `$${i + 1}: ${typeof v === 'string' && v.length > 50 ? v.substring(0, 50) + '...' : v}`));

      // Insert restaurant with location using ST_MakePoint and cast to point type
      const result = await queryRunner.query(
        `INSERT INTO restaurants (
          name, "legalName", "displayName", phone, email, "fssaiNumber", 
          "primaryContactName", address, "entryPickupPoint", landmark, 
          "parkingAvailable", "operatingHours", "pickupInstructions", 
          status, "ownerId", "isActive", "acceptsOrders", 
          "defaultPrepTimeMinutes", "maxOrdersPer15Min", "maxOrdersPer30Min", 
          "holdTimeAfterReadyMinutes", "peakHourBufferMinutes", "autoAcceptOrders",
          location
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23,
          ST_MakePoint($24, $25)::point
        ) RETURNING id`,
        values
      );

      console.log('Insert result:', result);

      await queryRunner.commitTransaction();
      
      // Return the created restaurant
      const restaurant = await this.restaurantRepository.findOne({
        where: { id: result[0].id },
      });

      if (!restaurant) {
        throw new Error('Restaurant was created but could not be retrieved');
      }

      console.log('Restaurant registered successfully:', restaurant.id);
      return restaurant;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      console.error('Error registering restaurant:', error);
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
      
      // Provide more helpful error messages
      if (error.code === '23505') { // Unique constraint violation
        throw new BadRequestException('A restaurant with this information already exists');
      } else if (error.code === '23502') { // Not null constraint violation
        throw new BadRequestException(`Missing required field: ${error.column}`);
      } else if (error.message?.includes('ST_MakePoint')) {
        throw new BadRequestException('Invalid location coordinates');
      } else if (error.message) {
        throw new BadRequestException(error.message);
      } else {
        throw new BadRequestException('Failed to register restaurant. Please try again.');
      }
    } finally {
      await queryRunner.release();
    }
  }

  async getRestaurantByOwner(ownerId: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { ownerId },
      relations: ['menuItems'],
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async updateRestaurant(ownerId: string, dto: UpdateRestaurantDto) {
    const restaurant = await this.getRestaurantByOwner(ownerId);

    Object.assign(restaurant, dto);
    return this.restaurantRepository.save(restaurant);
  }

  async updateOperatingHours(ownerId: string, operatingHours: any) {
    const restaurant = await this.getRestaurantByOwner(ownerId);
    restaurant.operatingHours = operatingHours;
    return this.restaurantRepository.save(restaurant);
  }

  async updatePrepCapacity(ownerId: string, dto: UpdatePrepCapacityDto) {
    const restaurant = await this.getRestaurantByOwner(ownerId);
    Object.assign(restaurant, dto);
    return this.restaurantRepository.save(restaurant);
  }

  async updateBankDetails(ownerId: string, dto: Step6BankDetailsDto) {
    const restaurant = await this.getRestaurantByOwner(ownerId);
    restaurant.bankAccountNumber = dto.bankAccountNumber;
    restaurant.bankIfscCode = dto.bankIfscCode;
    restaurant.bankAccountName = dto.bankAccountName;
    return this.restaurantRepository.save(restaurant);
  }

  async submitForApproval(ownerId: string) {
    const restaurant = await this.getRestaurantByOwner(ownerId);

    // Check if all required fields are filled
    const requiredFields = [
      restaurant.legalName,
      restaurant.displayName,
      restaurant.phone,
      restaurant.primaryContactName,
      restaurant.address,
      restaurant.location,
      restaurant.operatingHours,
      restaurant.pickupInstructions,
      restaurant.bankAccountNumber,
      restaurant.bankIfscCode,
      restaurant.bankAccountName,
    ];

    const hasMenu = (await this.menuItemRepository.count({ where: { restaurantId: restaurant.id } })) > 0;

    if (!requiredFields.every(field => field) || !hasMenu) {
      throw new BadRequestException('Please complete all required fields before submitting for approval');
    }

    restaurant.status = 'pending_approval';
    return this.restaurantRepository.save(restaurant);
  }

  async togglePause(ownerId: string) {
    const restaurant = await this.getRestaurantByOwner(ownerId);
    
    if (restaurant.status === 'live') {
      restaurant.status = 'paused';
      restaurant.acceptsOrders = false;
    } else if (restaurant.status === 'paused') {
      restaurant.status = 'live';
      restaurant.acceptsOrders = true;
    }

    return this.restaurantRepository.save(restaurant);
  }

  // Menu management methods
  async createMenuItem(restaurantId: string, dto: any) {
    const menuItem = this.menuItemRepository.create({
      ...dto,
      restaurantId,
    });
    return this.menuItemRepository.save(menuItem);
  }

  async updateMenuItem(restaurantId: string, itemId: string, dto: any) {
    const menuItem = await this.menuItemRepository.findOne({
      where: { id: itemId, restaurantId },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    Object.assign(menuItem, dto);
    return this.menuItemRepository.save(menuItem);
  }

  async deleteMenuItem(restaurantId: string, itemId: string) {
    const result = await this.menuItemRepository.delete({
      id: itemId,
      restaurantId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Menu item not found');
    }

    return { success: true };
  }
}

