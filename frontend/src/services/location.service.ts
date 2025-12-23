import axios from 'axios';

export interface GeocodeResult {
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  formattedAddress: string;
}

/**
 * Reverse geocode: Convert coordinates to user-friendly address
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<GeocodeResult | null> {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
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
    const formattedAddress = formatAddress(addr);

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
 * Improved with better error handling and accuracy
 */
export async function geocode(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    // Clean address for better results
    const cleanAddress = address.trim();
    if (cleanAddress.length < 3) {
      return null;
    }

    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: cleanAddress,
        format: 'json',
        limit: 5, // Get top 5 results for better accuracy
        addressdetails: 1,
        countrycodes: 'in', // Prioritize India for better results
      },
      headers: {
        'User-Agent': 'PickRoute/1.0', // Required by Nominatim
      },
      timeout: 10000, // 10 second timeout
    });

    if (!response.data || response.data.length === 0) {
      return null;
    }

    // Use the first result (most relevant)
    const result = response.data[0];
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      return null;
    }

    // Check if coordinates are within valid range
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return null;
    }

    return { lat, lng };
  } catch (error: any) {
    console.error('Geocoding error:', error.message);
    if (error.code === 'ECONNABORTED') {
      console.error('Geocoding timeout - address may be too vague');
    }
    return null;
  }
}

/**
 * Format address components into a readable string
 */
function formatAddress(addr: any): string {
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

