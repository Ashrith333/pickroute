import axios from 'axios';

export interface AddressSuggestion {
  display_name: string;
  lat: number;
  lon: number;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

/**
 * Search for addresses with autocomplete
 * Uses OpenStreetMap Nominatim for free, comprehensive address search
 */
export async function searchAddresses(
  query: string,
  limit: number = 5
): Promise<AddressSuggestion[]> {
  if (query.length < 3) {
    return [];
  }

  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        limit,
        addressdetails: 1,
        countrycodes: 'in', // Prioritize India
        dedupe: 1, // Remove duplicates
      },
      headers: {
        'User-Agent': 'PickRoute/1.0',
      },
      timeout: 5000,
    });

    if (!response.data || response.data.length === 0) {
      return [];
    }

    return response.data.map((item: any) => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      address: item.address || {},
    }));
  } catch (error: any) {
    console.error('Address search error:', error.message);
    return [];
  }
}

/**
 * Reverse geocode coordinates to address
 */
export async function getAddressFromCoordinates(
  lat: number,
  lon: number
): Promise<AddressSuggestion | null> {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat,
        lon,
        format: 'json',
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'PickRoute/1.0',
      },
      timeout: 5000,
    });

    if (!response.data || !response.data.address) {
      return null;
    }

    return {
      display_name: response.data.display_name,
      lat: parseFloat(response.data.lat),
      lon: parseFloat(response.data.lon),
      address: response.data.address || {},
    };
  } catch (error: any) {
    console.error('Reverse geocoding error:', error.message);
    return null;
  }
}

