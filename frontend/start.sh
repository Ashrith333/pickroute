#!/bin/bash
# Wrapper script to start Expo with proper file limits

# Increase file descriptor limit
ulimit -n 4096

# Verify the limit was set
echo "File descriptor limit set to: $(ulimit -n)"

# Start Expo
exec expo start "$@"

