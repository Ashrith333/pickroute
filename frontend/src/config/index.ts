// For iOS Simulator, use localhost
// For Android Emulator, use 10.0.2.2
// For physical device, use your computer's local IP address
// Detected IP: 192.168.29.201
export const API_BASE_URL = __DEV__
  ? 'http://192.168.29.201:3000' // Your local IP - works on physical devices
  : 'https://api.pickroute.com';

// Google Maps API Key - set via EXPO_PUBLIC_GOOGLE_MAPS_API_KEY environment variable
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

