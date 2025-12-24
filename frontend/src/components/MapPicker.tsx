import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  FlatList,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { GOOGLE_MAPS_API_KEY } from '../config';

interface MapPickerProps {
  initialLocation?: { lat: number; lng: number };
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  onClose: () => void;
  title: string;
}

interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export function MapPicker({ initialLocation, onLocationSelect, onClose, title }: MapPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search for places using Google Places API
  const searchPlaces = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key not configured');
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${GOOGLE_MAPS_API_KEY}&components=country:in`
      );
      const data = await response.json();

      if (data.error_message) {
        console.error('Places API error:', data.error_message);
        // If Places API is not enabled, just show empty suggestions
        setSuggestions([]);
        return;
      }

      if (data.predictions) {
        setSuggestions(data.predictions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Place search error:', error);
      setSuggestions([]);
    }
  };

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        searchPlaces(searchQuery);
      }, 300);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Get place details and move map
  const selectPlace = async (place: PlaceSuggestion) => {
    setLoading(true);
    setSearchQuery(place.description);
    setSuggestions([]);

    if (!GOOGLE_MAPS_API_KEY) {
      Alert.alert('Error', 'Google Maps API key not configured');
      setLoading(false);
      return;
    }

    try {
      // Get place details
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${GOOGLE_MAPS_API_KEY}&fields=geometry,formatted_address`
      );
      const data = await response.json();

      if (data.error_message) {
        console.error('Places API error:', data.error_message);
        Alert.alert(
          'API Error',
          'Places API is not enabled. Please enable it in Google Cloud Console.'
        );
        setLoading(false);
        return;
      }

      if (data.result) {
        const { lat, lng } = data.result.geometry.location;
        const address = data.result.formatted_address;

        setSelectedLocation({ lat, lng });
        setSelectedAddress(address);

        // Move map to location
        if (webViewRef.current && mapReady) {
          webViewRef.current.postMessage(
            JSON.stringify({
              type: 'moveToLocation',
              lat,
              lng,
            })
          );
        }
      }
    } catch (error) {
      console.error('Place details error:', error);
      Alert.alert('Error', 'Failed to get place details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle map messages
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady') {
        setMapReady(true);
        setLoading(false);
        if (selectedLocation) {
          // Move to initial location
          setTimeout(() => {
            webViewRef.current?.postMessage(
              JSON.stringify({
                type: 'moveToLocation',
                lat: selectedLocation.lat,
                lng: selectedLocation.lng,
              })
            );
          }, 500);
        }
      } else if (data.type === 'locationChanged') {
        setSelectedLocation({ lat: data.lat, lng: data.lng });
        // Reverse geocode to get address
        reverseGeocode(data.lat, data.lng);
      } else if (data.type === 'mapError') {
        setLoading(false);
        Alert.alert(
          'Map Error',
          data.error || 'Failed to load Google Maps. Please check your API key and enabled APIs.',
          [
            {
              text: 'OK',
              onPress: () => onClose(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error parsing map message:', error);
    }
  };

  // Reverse geocode to get address
  const reverseGeocode = async (lat: number, lng: number) => {
    if (!GOOGLE_MAPS_API_KEY) {
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.error_message) {
        console.error('Geocoding API error:', data.error_message);
        // Silently fail - address is optional
        return;
      }

      if (data.results && data.results.length > 0) {
        setSelectedAddress(data.results[0].formatted_address);
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
      // Silently fail - address is optional
    }
  };

  const confirmSelection = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation.lat, selectedLocation.lng, selectedAddress);
    }
  };

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
          }
          #map {
            width: 100%;
            height: 100%;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}"></script>
        <script>
          var map;
          var marker;
          var isDragging = false;
          
          function initMap() {
            var initialLat = ${selectedLocation?.lat || 28.6139};
            var initialLng = ${selectedLocation?.lng || 77.2090};
            
            // Initialize map with native styling
            map = new google.maps.Map(document.getElementById('map'), {
              center: { lat: initialLat, lng: initialLng },
              zoom: 15,
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                },
                {
                  featureType: "transit",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                }
              ],
              disableDefaultUI: false,
              gestureHandling: 'greedy'
            });
            
            // Create draggable marker (Uber-style pin)
            marker = new google.maps.Marker({
              position: { lat: initialLat, lng: initialLng },
              map: map,
              draggable: true,
              animation: google.maps.Animation.DROP,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#007AFF',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 3
              },
              zIndex: 1000
            });
            
            // Add pin shadow effect
            var shadowMarker = new google.maps.Marker({
              position: { lat: initialLat, lng: initialLng },
              map: map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: '#000',
                fillOpacity: 0.2,
                strokeWeight: 0
              },
              zIndex: 999,
              optimized: false
            });
            
            // Update shadow position when marker moves
            marker.addListener('position_changed', function() {
              var pos = marker.getPosition();
              shadowMarker.setPosition(pos);
            });
            
            // Handle marker drag
            marker.addListener('dragstart', function() {
              isDragging = true;
            });
            
            marker.addListener('dragend', function() {
              isDragging = false;
              var pos = marker.getPosition();
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'locationChanged',
                  lat: pos.lat(),
                  lng: pos.lng()
                }));
              }
            });
            
            // Handle map drag (move marker to center)
            var idleListener = google.maps.event.addListener(map, 'idle', function() {
              if (!isDragging) {
                var center = map.getCenter();
                marker.setPosition(center);
                shadowMarker.setPosition(center);
                
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'locationChanged',
                    lat: center.lat(),
                    lng: center.lng()
                  }));
                }
              }
            });
            
            // Handle map click (move marker to clicked location)
            map.addListener('click', function(e) {
              var lat = e.latLng.lat();
              var lng = e.latLng.lng();
              marker.setPosition({ lat: lat, lng: lng });
              shadowMarker.setPosition({ lat: lat, lng: lng });
              
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'locationChanged',
                  lat: lat,
                  lng: lng
                }));
              }
            });
            
            // Listen for messages from React Native
            window.addEventListener('message', function(event) {
              try {
                var data = JSON.parse(event.data);
                if (data.type === 'moveToLocation') {
                  var newPos = { lat: data.lat, lng: data.lng };
                  map.setCenter(newPos);
                  map.setZoom(16);
                  marker.setPosition(newPos);
                  shadowMarker.setPosition(newPos);
                }
              } catch (e) {
                console.error('Error handling message:', e);
              }
            });
            
            // Notify React Native that map is ready
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapReady'
              }));
            }
          }
          
          // Initialize when Google Maps loads
          if (typeof google !== 'undefined' && google.maps) {
            initMap();
          } else {
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
              }
            });
          }
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                setSuggestions([]);
              }}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => selectPlace(item)}
                >
                  <Text style={styles.suggestionIcon}>📍</Text>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionMainText}>
                      {item.structured_formatting.main_text}
                    </Text>
                    <Text style={styles.suggestionSubText}>
                      {item.structured_formatting.secondary_text}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        )}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html }}
          style={styles.map}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={handleMessage}
          mixedContentMode="always"
          originWhitelist={['*']}
        />
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}
      </View>

      {/* Bottom Info & Confirm */}
      <View style={styles.bottomContainer}>
        {selectedAddress ? (
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Selected Location</Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {selectedAddress}
            </Text>
          </View>
        ) : (
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Move map to select location</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.confirmButton, !selectedLocation && styles.confirmButtonDisabled]}
          onPress={confirmSelection}
          disabled={!selectedLocation}
        >
          <Text style={styles.confirmButtonText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    backgroundColor: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    zIndex: 1000,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    padding: 0,
  },
  clearButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#999',
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionMainText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
    marginBottom: 2,
  },
  suggestionSubText: {
    fontSize: 14,
    color: '#666',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  bottomContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  addressContainer: {
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

