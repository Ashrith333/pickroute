import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { GOOGLE_MAPS_API_KEY } from '../config';

interface Marker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  color?: string;
}

interface MapViewProps {
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers?: Marker[];
  style?: any;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectable?: boolean;
}

export function MapView({ initialRegion, markers = [], style, onLocationSelect, selectable = false }: MapViewProps) {
  const { latitude, longitude, latitudeDelta, longitudeDelta } = initialRegion;
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiKey = GOOGLE_MAPS_API_KEY;

  // Calculate zoom level from delta (approximate)
  const zoomLevel = Math.round(Math.log2(360 / longitudeDelta));

  // Prepare markers for Google Maps
  const markersJs = markers.map((marker, index) => {
    const color = marker.color || '#FF0000';
    return `
      new google.maps.Marker({
        position: { lat: ${marker.latitude}, lng: ${marker.longitude} },
        map: map,
        title: "${marker.title.replace(/"/g, '\\"')}",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "${color}",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2
        }
      });
    `;
  }).join('\n      ');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            margin: 0;
            padding: 0;
          }
          #map {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
          }
          .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
            color: #666;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 16px;
            background: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="loading" id="loading">Loading map...</div>
        <script src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry"></script>
        <script>
          var map;
          var selectionMarker = null;
          
          function initMap() {
            try {
              // Hide loading
              var loadingEl = document.getElementById('loading');
              if (loadingEl) {
                loadingEl.style.display = 'none';
              }
              
              // Initialize map
              map = new google.maps.Map(document.getElementById('map'), {
                center: { lat: ${latitude}, lng: ${longitude} },
                zoom: ${zoomLevel},
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                gestureHandling: 'greedy'
              });
              
              ${selectable ? `
              // Make map selectable
              map.addListener('click', function(e) {
                var lat = e.latLng.lat();
                var lng = e.latLng.lng();
                
                // Remove previous selection marker
                if (selectionMarker) {
                  selectionMarker.setMap(null);
                }
                
                // Add new selection marker (blue pin)
                selectionMarker = new google.maps.Marker({
                  position: { lat: lat, lng: lng },
                  map: map,
                  draggable: true,
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 12,
                    fillColor: '#007AFF',
                    fillOpacity: 1,
                    strokeColor: '#fff',
                    strokeWeight: 3
                  },
                  zIndex: 1000
                });
                
                // Send location to React Native
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'locationSelected',
                    lat: lat,
                    lng: lng
                  }));
                }
                
                // Make marker draggable
                selectionMarker.addListener('dragend', function(e) {
                  var pos = selectionMarker.getPosition();
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'locationSelected',
                      lat: pos.lat(),
                      lng: pos.lng()
                    }));
                  }
                });
              });
              ` : ''}
              
              // Add existing markers
              ${markersJs}
              
              // Fit bounds to show all markers if any
              if (${markers.length} > 0) {
                var bounds = new google.maps.LatLngBounds();
                ${markers.map(m => `bounds.extend(new google.maps.LatLng(${m.latitude}, ${m.longitude}));`).join('\n                ')}
                map.fitBounds(bounds);
              }
              
              // Notify React Native that map is ready
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'mapReady'
                }));
              }
              
            } catch (error) {
              console.error('Map initialization error:', error);
              var loadingEl = document.getElementById('loading');
              if (loadingEl) {
                loadingEl.textContent = 'Error: ' + (error.message || 'Failed to load map');
                loadingEl.style.color = '#ff3b30';
              }
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'mapError',
                  error: error.message || 'Failed to load map'
                }));
              }
            }
          }
          
          // Initialize map when Google Maps API loads
          if (typeof google !== 'undefined' && google.maps) {
            initMap();
          } else {
            // Wait for Google Maps to load
            window.addEventListener('load', function() {
              if (typeof google !== 'undefined' && google.maps) {
                initMap();
              } else {
                var checkInterval = setInterval(function() {
                  if (typeof google !== 'undefined' && google.maps) {
                    clearInterval(checkInterval);
                    initMap();
                  }
                }, 100);
                
                // Timeout after 10 seconds
                setTimeout(function() {
                  clearInterval(checkInterval);
                  if (typeof google === 'undefined' || !google.maps) {
                    var loadingEl = document.getElementById('loading');
                    if (loadingEl) {
                      loadingEl.textContent = 'Failed to load Google Maps. Please check your API key.';
                      loadingEl.style.color = '#ff3b30';
                    }
                    if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'mapError',
                        error: 'Failed to load Google Maps API'
                      }));
                    }
                  }
                }, 10000);
              }
            });
          }
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady') {
        setLoading(false);
        setError(null);
      } else if (data.type === 'mapError') {
        setLoading(false);
        setError(data.error || 'Failed to load map');
      } else if (data.type === 'locationSelected' && onLocationSelect) {
        onLocationSelect(data.lat, data.lng);
      }
    } catch (error) {
      console.error('Error parsing map message:', error);
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    setLoading(false);
    setError('Failed to load map. Please check your internet connection and API key.');
  };

  const handleLoadEnd = () => {
    console.log('WebView load ended');
    // Fallback: hide loading after 10 seconds if mapReady never comes
    setTimeout(() => {
      if (loading) {
        console.log('Map ready timeout - hiding loading anyway');
        setLoading(false);
      }
    }, 10000);
  };

  if (!apiKey) {
    return (
      <View style={[styles.container, style, styles.errorContainer]}>
        <Text style={styles.errorText}>Google Maps API Key Required</Text>
        <Text style={styles.errorSubtext}>
          Please set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorSubtext}>Please check your API key and internet connection</Text>
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={false}
        mixedContentMode="always"
        originWhitelist={['*']}
        onMessage={handleMessage}
        onError={handleError}
        onLoadEnd={handleLoadEnd}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        cacheEnabled={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
        onLoadStart={() => console.log('WebView load started')}
        onLoadProgress={(e) => console.log('WebView load progress:', e.nativeEvent.progress)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    zIndex: 10,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
