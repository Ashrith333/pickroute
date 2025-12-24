# Fix: "This page can't load Google Maps correctly"

## Quick Fix

The error occurs because **Places API** or **Geocoding API** is not enabled. Here's how to fix it:

### Step 1: Enable Required APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **"APIs & Services"** → **"Library"**
4. Search and enable these APIs:
   - ✅ **Maps JavaScript API** (should already be enabled)
   - ✅ **Places API** (REQUIRED for search)
   - ✅ **Geocoding API** (REQUIRED for address display)

### Step 2: Check API Key Restrictions

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click on your API key
3. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Add these APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API

### Step 3: Wait & Restart

- Wait 1-2 minutes for API changes to propagate
- Restart your Expo app:
  ```bash
  # Stop the app (Ctrl+C)
  # Then restart:
  cd frontend
  npm start
  ```

## What Changed

I've updated the code to:
- ✅ Remove `libraries=places` from the script (we use REST API instead)
- ✅ Add better error handling
- ✅ Show helpful error messages if APIs aren't enabled
- ✅ Gracefully handle missing APIs

## Verify It's Working

After enabling the APIs:
1. Open the map picker
2. You should see Google Maps loading (no error popup)
3. Type in the search bar - you should see suggestions
4. Tap a suggestion - map should move to that location
5. Pan the map - marker should stay centered

## Still Getting Errors?

Check the console logs for specific error messages. Common issues:

- **"Places API is not enabled"** → Enable Places API in Google Cloud Console
- **"Geocoding API is not enabled"** → Enable Geocoding API in Google Cloud Console
- **"API key not valid"** → Check your API key in `.env` file
- **"This API project is not authorized"** → Enable billing (required even for free tier)

## Cost Note

These APIs are still within the free tier:
- Places API: $2.83 per 1,000 requests (~70,600/month free)
- Geocoding API: $5 per 1,000 requests (~40,000/month free)
- Total: Well within $200/month free credit

