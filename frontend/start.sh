#!/bin/bash
# Wrapper script to start Expo with proper file limits

# Increase file descriptor limit
ulimit -n 4096

# Verify the limit was set
echo "File descriptor limit set to: $(ulimit -n)"
echo "🚀 Starting Expo development server..."

# Start Expo using npx (works even if expo CLI not globally installed)
exec npx expo start "$@" --clear

