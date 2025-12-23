# Quick Fix for Network Error

## The Problem
`localhost:3000` doesn't work on physical devices or sometimes on simulators.

## Quick Solution

### Step 1: Find Your Computer's IP Address

**macOS/Linux:**
```bash
ipconfig getifaddr en0
# or
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

### Step 2: Update Frontend Config

Edit `frontend/src/config/index.ts`:

```typescript
export const API_BASE_URL = __DEV__
  ? 'http://YOUR_IP_HERE:3000'  // e.g., 'http://192.168.1.100:3000'
  : 'https://api.pickroute.com';
```

### Step 3: Restart Frontend

```bash
cd frontend
npm start
```

## Alternative: Use ngrok (For Testing)

If you want to test from anywhere:

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com

# Expose backend
ngrok http 3000

# Use the ngrok URL in frontend/src/config/index.ts
# e.g., 'https://abc123.ngrok.io'
```

## For Different Platforms

- **iOS Simulator**: `localhost:3000` usually works
- **Android Emulator**: Use `http://10.0.2.2:3000`
- **Physical Device**: Use your computer's local IP (e.g., `192.168.1.100:3000`)

## Verify Backend is Running

```bash
curl http://localhost:3000/app/config
# Should return: {"version":"1.0.0",...}
```

If this works, backend is running correctly!
