// For iOS Simulator, use localhost
// For Android Emulator, use 10.0.2.2
// For physical device, use your computer's local IP address
// Detected IP: 192.168.29.201
export const API_BASE_URL = __DEV__
  ? 'http://192.168.29.201:3000' // Your local IP - works on physical devices
  : 'https://api.pickroute.com';

export const MAPS_API_KEY = 'your-maps-api-key';

