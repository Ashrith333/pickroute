import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface GeocodeResult {
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  formattedAddress: string;
}

@Injectable()
export class LocationService {
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org';

  /**
   * Reverse geocode: Convert coordinates to address
   */
  async reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
    try {
      const response = await axios.get(`${this.nominatimUrl}/reverse`, {
        params: {
          lat,
          lon: lng,
          format: 'json',
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'PickRoute/1.0', // Required by Nominatim
        },
      });

      if (!response.data || !response.data.address) {
        return null;
      }

      const addr = response.data.address;
      const formattedAddress = this.formatAddress(addr);

      return {
        address: formattedAddress,
        city: addr.city || addr.town || addr.village || addr.municipality,
        state: addr.state || addr.region,
        country: addr.country,
        postalCode: addr.postcode,
        formattedAddress,
      };
    } catch (error: any) {
      console.error('Reverse geocoding error:', error.message);
      return null;
    }
  }

  /**
   * Geocode: Convert address to coordinates
   */
  async geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await axios.get(`${this.nominatimUrl}/search`, {
        params: {
          q: address,
          format: 'json',
          limit: 1,
        },
        headers: {
          'User-Agent': 'PickRoute/1.0',
        },
      });

      if (!response.data || response.data.length === 0) {
        return null;
      }

      return {
        lat: parseFloat(response.data[0].lat),
        lng: parseFloat(response.data[0].lon),
      };
    } catch (error: any) {
      console.error('Geocoding error:', error.message);
      return null;
    }
  }

  /**
   * Format address components into a readable string
   */
  private formatAddress(addr: any): string {
    const parts: string[] = [];

    if (addr.road || addr.street) {
      parts.push(addr.road || addr.street);
    }

    if (addr.house_number) {
      parts[0] = `${addr.house_number} ${parts[0] || ''}`.trim();
    }

    if (addr.suburb || addr.neighbourhood) {
      parts.push(addr.suburb || addr.neighbourhood);
    }

    if (addr.city || addr.town || addr.village) {
      parts.push(addr.city || addr.town || addr.village);
    }

    if (addr.state || addr.region) {
      parts.push(addr.state || addr.region);
    }

    if (addr.postcode) {
      parts.push(addr.postcode);
    }

    return parts.filter(Boolean).join(', ') || 'Unknown location';
  }
}

