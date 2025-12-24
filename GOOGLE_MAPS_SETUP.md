# Google Maps Setup Guide

## Overview
The app now uses Google Maps JavaScript API for map display and location selection. This provides reliable map rendering and minimal API calls.

## Setup Steps

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API** (required for map display)
   - **Places API** (required for location search/autocomplete)
   - **Geocoding API** (required for reverse geocoding addresses)
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

### 2. Configure API Key Restrictions (Recommended)

For security, restrict your API key:

1. Click on your API key in Google Cloud Console
2. Under "Application restrictions":
   - For development: Add your IP address or HTTP referrers
   - For production: Add your app's bundle identifier
3. Under "API restrictions":
   - Select "Restrict key"
   - Choose: "Maps JavaScript API", "Places API", and "Geocoding API"

### 3. Add API Key to Frontend

Create a `.env` file in the `frontend` directory:

```bash
cd frontend
touch .env
```

Add your API key:

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

**Important:** 
- The `EXPO_PUBLIC_` prefix is required for Expo to expose the variable
- Restart your Expo development server after adding the key
- Never commit the `.env` file to git (it's already in `.gitignore`)

### 4. Verify Setup

1. Restart your Expo development server:
   ```bash
   cd frontend
   npm start
   ```

2. Open the app and navigate to the route setup screen
3. Tap the map icon to open the map picker
4. You should see Google Maps loading

## API Usage & Costs

### Minimal API Calls
The implementation is optimized for minimal API usage:
- **Map Load**: 1 API call when map initializes
- **Tile Requests**: Standard map tile requests (cached by Google)
- **Location Search**: Only when user types (debounced, ~300ms delay)
- **Reverse Geocode**: Only when location changes (for address display)
- **Location Selection**: No additional API calls (handled client-side)

### Free Tier
Google Maps offers a free tier:
- **$200 free credit per month**
- Maps JavaScript API: $7 per 1,000 requests (~28,500 loads/month free)
- Places API (Autocomplete): $2.83 per 1,000 requests (~70,600 searches/month free)
- Geocoding API: $5 per 1,000 requests (~40,000 geocodes/month free)

### Cost Optimization Tips
1. **Enable caching**: Already implemented in WebView
2. **Restrict API key**: Prevents unauthorized usage
3. **Monitor usage**: Check Google Cloud Console regularly
4. **Set billing alerts**: Get notified before exceeding free tier

## Troubleshooting

### Map Not Loading
- Check that `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is set correctly
- Verify API key is enabled for "Maps JavaScript API"
- Check browser/device console for error messages
- Ensure internet connection is working

### API Key Errors
- Verify API key is correct (no extra spaces)
- Check API restrictions in Google Cloud Console
- Ensure "Maps JavaScript API" is enabled
- Check billing is enabled (required even for free tier)

### Map Shows but Can't Select Location
- Check that JavaScript is enabled in WebView
- Verify `onLocationSelect` callback is working
- Check console logs for errors

## Alternative: Using app.json (Not Recommended)

If you prefer to set the API key in `app.json` instead of `.env`:

```json
{
  "expo": {
    "extra": {
      "googleMapsApiKey": "YOUR_API_KEY_HERE"
    }
  }
}
```

However, using `.env` is recommended for security.

## Production Considerations

1. **API Key Security**: 
   - Use different API keys for development and production
   - Set strict restrictions on production keys
   - Never expose API keys in client-side code (already handled via environment variables)

2. **Billing**:
   - Set up billing alerts
   - Monitor usage in Google Cloud Console
   - Consider implementing usage limits

3. **Performance**:
   - Maps are cached by Google
   - WebView caching is enabled
   - Minimal API calls per user session

