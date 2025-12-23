#!/bin/bash
# Fix for EMFILE: too many open files error on macOS

echo "Fixing file limit for Metro bundler..."

# Increase limit for current session
ulimit -n 4096

# Check if limit was set
echo "Current file limit: $(ulimit -n)"

# Instructions for permanent fix
echo ""
echo "For a permanent fix, run these commands in your terminal:"
echo "  echo 'kern.maxfiles=65536' | sudo tee -a /etc/sysctl.conf"
echo "  echo 'kern.maxfilesperproc=65536' | sudo tee -a /etc/sysctl.conf"
echo "  sudo sysctl -w kern.maxfiles=65536"
echo "  sudo sysctl -w kern.maxfilesperproc=65536"
echo ""
echo "Or add to ~/.zshrc:"
echo "  ulimit -n 4096"
