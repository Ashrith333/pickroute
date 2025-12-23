import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Route } from './entities/route.entity';
import { PreviewRouteDto } from './dto/route.dto';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(Route)
    private routeRepository: Repository<Route>,
    private configService: ConfigService,
  ) {}

  async previewRoute(userId: string, dto: PreviewRouteDto) {
    const {
      fromLat,
      fromLng,
      toLat,
      toLng,
      viaLat,
      viaLng,
      transportMode = 'car',
      maxDetourKm = 5,
      maxWaitTimeMinutes = 10,
      arrivalFlexibilityMinutes = 5,
      scheduledStartTime,
    } = dto;

    try {
      // Call Maps API to get route polyline and ETA
      // This is a simplified version - in production, use Google Maps Directions API
      const mapsApiKey = this.configService.get('MAPS_API_KEY');
      
      // Build waypoints
      const waypoints = [];
      if (viaLat && viaLng) {
        waypoints.push(`${viaLat},${viaLng}`);
      }

      // For now, return mock data - replace with actual Maps API call
      const routeData = await this.getRouteFromMaps(
        `${fromLat},${fromLng}`,
        `${toLat},${toLng}`,
        waypoints,
        transportMode,
        mapsApiKey,
      );

      return {
        polyline: routeData.polyline,
        distanceKm: routeData.distanceKm,
        durationMinutes: routeData.durationMinutes,
        eta: routeData.eta,
        constraints: {
          maxDetourKm,
          maxWaitTimeMinutes,
          arrivalFlexibilityMinutes,
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to calculate route: ' + error.message);
    }
  }

  private async getRouteFromMaps(
    origin: string,
    destination: string,
    waypoints: string[],
    mode: string,
    apiKey: string,
  ) {
    // Mock implementation - replace with actual Google Maps Directions API
    // or your preferred routing service
    if (!apiKey || apiKey === 'your-maps-api-key') {
      // Return mock data for development
      return {
        polyline: 'mock_polyline_encoded_string',
        distanceKm: 15.5,
        durationMinutes: 25,
        eta: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
      };
    }

    // Actual API call would go here
    // const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
    //   params: { origin, destination, waypoints, mode, key: apiKey }
    // });
    
    return {
      polyline: 'mock_polyline_encoded_string',
      distanceKm: 15.5,
      durationMinutes: 25,
      eta: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
    };
  }

  async getUserRoutes(userId: string) {
    return this.routeRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  async findOne(id: string) {
    return this.routeRepository.findOne({ where: { id } });
  }
}

