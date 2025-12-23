import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

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

  // Prepare markers for Leaflet (OpenStreetMap)
  const markersHtml = markers.map((marker, index) => {
    const color = marker.color || '#FF0000';
    
    return `
      L.circleMarker([${marker.latitude}, ${marker.longitude}], {
        radius: 10,
        fillColor: "${color}",
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(map)
        .bindPopup("${marker.title.replace(/"/g, '\\"')}");
    `;
  }).join('\n      ');

  // Selection marker (for map picker)
  let selectionMarker: string = '';
  if (selectable && markers.length > 0 && markers[0].id === 'picker') {
    const pickerMarker = markers[0];
    selectionMarker = `
      const selectionMarker = L.marker([${pickerMarker.latitude}, ${pickerMarker.longitude}], {
        draggable: true,
        icon: L.icon({
          iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIGZpbGw9IiMwMDdBRkYiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPg==',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        })
      }).addTo(map);
      
      selectionMarker.on('dragend', function(e) {
        const pos = e.target.getLatLng();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'locationSelected',
          lat: pos.lat,
          lng: pos.lng
        }));
      });
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; overflow: hidden; }
          #map { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          const map = L.map('map').setView([${latitude}, ${longitude}], ${Math.round(Math.log2(360 / longitudeDelta))});
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);

          ${selectable ? `
          // Make map selectable
          let selectionMarker = null;
          
          map.on('click', function(e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            // Remove previous selection marker
            if (selectionMarker) {
              map.removeLayer(selectionMarker);
            }
            
            // Add new selection marker
            selectionMarker = L.marker([lat, lng], {
              draggable: true,
              icon: L.icon({
                iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIGZpbGw9IiMwMDdBRkYiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPg==',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
              })
            }).addTo(map);
            
            // Send location to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'locationSelected',
              lat: lat,
              lng: lng
            }));
            
            // Make marker draggable
            selectionMarker.on('dragend', function(e) {
              const pos = e.target.getLatLng();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'locationSelected',
                lat: pos.lat,
                lng: pos.lng
              }));
            });
          });
          ` : ''}

          // Add existing markers
          ${markersHtml}
          ${selectionMarker}

          // Fit bounds to show all markers
          if (${markers.length} > 0) {
            const group = new L.featureGroup([${markers.map(m => `L.marker([${m.latitude}, ${m.longitude}])`).join(', ')}]);
            map.fitBounds(group.getBounds().pad(0.1));
          }
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'locationSelected' && onLocationSelect) {
        onLocationSelect(data.lat, data.lng);
      }
    } catch (error) {
      console.error('Error parsing map message:', error);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        mixedContentMode="always"
        originWhitelist={['*']}
        onMessage={handleMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
