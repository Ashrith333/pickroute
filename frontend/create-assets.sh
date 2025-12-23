#!/bin/bash
# Create placeholder assets for Expo app

cd assets

# Create a simple 1024x1024 icon (PNG placeholder)
# Using ImageMagick if available, otherwise create a simple SVG
if command -v convert &> /dev/null; then
  convert -size 1024x1024 xc:#007AFF -pointsize 200 -fill white -gravity center -annotate +0+0 "PR" icon.png
  convert -size 2048x2048 xc:#007AFF -pointsize 400 -fill white -gravity center -annotate +0+0 "PR" splash.png
  convert -size 1024x1024 xc:#007AFF -pointsize 200 -fill white -gravity center -annotate +0+0 "PR" adaptive-icon.png
  convert -size 48x48 xc:#007AFF favicon.png
else
  echo "ImageMagick not found. Creating placeholder files..."
  # Create minimal valid PNG files (1x1 transparent)
  echo "Creating placeholder PNG files..."
fi

echo "✅ Assets directory created"
echo "⚠️  Note: Placeholder assets created. Replace with actual images before production."
