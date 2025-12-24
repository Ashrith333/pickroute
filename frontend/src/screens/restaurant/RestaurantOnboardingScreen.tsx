import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { MapPicker } from '../../components/MapPicker';
import { Modal } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

export function RestaurantOnboardingScreen() {
  const navigation = useNavigation();
  const { user, signIn, signOut } = React.useContext(AuthContext);
  const [step, setStep] = useState<OnboardingStep>(1);
  const [loading, setLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Step 1: Account & Identity
  const [legalName, setLegalName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [fssaiNumber, setFssaiNumber] = useState('');
  const [primaryContactName, setPrimaryContactName] = useState('');

  // Step 2: Location
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [entryPickupPoint, setEntryPickupPoint] = useState('');
  const [landmark, setLandmark] = useState('');
  const [parkingAvailable, setParkingAvailable] = useState(false);

  // Step 3: Operating Hours
  const [operatingHours, setOperatingHours] = useState({
    monday: { open: '09:00', close: '22:00' },
    tuesday: { open: '09:00', close: '22:00' },
    wednesday: { open: '09:00', close: '22:00' },
    thursday: { open: '09:00', close: '22:00' },
    friday: { open: '09:00', close: '22:00' },
    saturday: { open: '09:00', close: '22:00' },
    sunday: { open: '09:00', close: '22:00' },
  });

  // Step 4: Menu (will be separate screen)
  // Step 5: Prep & Capacity
  const [defaultPrepTime, setDefaultPrepTime] = useState(15);
  const [maxOrders15Min, setMaxOrders15Min] = useState(5);
  const [maxOrders30Min, setMaxOrders30Min] = useState(10);
  const [holdTimeAfterReady, setHoldTimeAfterReady] = useState(10);
  const [peakHourBuffer, setPeakHourBuffer] = useState(5);
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(false);

  // Step 6: Bank Details
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');

  const [pickupInstructions, setPickupInstructions] = useState('');

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is required to set your restaurant location');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const coords = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      };
      
      setLocation(coords);
      
      // Get address for current location
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json&addressdetails=1`,
          {
            headers: { 'User-Agent': 'PickRoute/1.0' },
            timeout: 5000,
          }
        );
        
        if (response.data?.display_name) {
          setAddress(response.data.display_name);
        }
      } catch (error) {
        // Address fetch failed, but location is set
        console.log('Could not fetch address for location');
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get current location. Please try selecting on map.');
    } finally {
      setLoading(false);
    }
  };

  const getAddressFromLocation = async (lat: number, lng: number) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        {
          headers: { 'User-Agent': 'PickRoute/1.0' },
          timeout: 5000,
        }
      );
      
      if (response.data?.display_name) {
        setAddress(response.data.display_name);
      }
    } catch (error) {
      console.log('Could not fetch address for location');
    }
  };

  useEffect(() => {
    // Try to get current location on mount
    getCurrentLocation();
  }, []);

  const handleNext = () => {
    if (step < 6) {
      setStep((s) => (s + 1) as OnboardingStep);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as OnboardingStep);
    }
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 1:
        if (!legalName || !displayName || !primaryContactName) {
          Alert.alert('Validation Error', 'Please fill all required fields');
          return false;
        }
        return true;
      case 2:
        if (!address || !location) {
          Alert.alert('Validation Error', 'Please set restaurant location');
          return false;
        }
        return true;
      case 3:
        // Operating hours validation
        return true;
      case 5:
        // Prep & capacity validation
        return true;
      case 6:
        if (!bankAccountNumber || !bankIfscCode || !bankAccountName) {
          Alert.alert('Validation Error', 'Please fill all bank details');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    if (!user?.phone) {
      Alert.alert('Error', 'User phone number not found. Please login again.');
      return;
    }

    if (!location || !location.lat || !location.lng) {
      Alert.alert('Error', 'Please set restaurant location');
      return;
    }

    setLoading(true);
    try {
      // Ensure parkingAvailable is a boolean
      const parking = parkingAvailable === true || parkingAvailable === 'true';
      
      // Format operating hours to match DTO structure - ensure all days have open/close
      const formattedOperatingHours = {
        monday: {
          open: operatingHours.monday?.open || '09:00',
          close: operatingHours.monday?.close || '22:00',
        },
        tuesday: {
          open: operatingHours.tuesday?.open || '09:00',
          close: operatingHours.tuesday?.close || '22:00',
        },
        wednesday: {
          open: operatingHours.wednesday?.open || '09:00',
          close: operatingHours.wednesday?.close || '22:00',
        },
        thursday: {
          open: operatingHours.thursday?.open || '09:00',
          close: operatingHours.thursday?.close || '22:00',
        },
        friday: {
          open: operatingHours.friday?.open || '09:00',
          close: operatingHours.friday?.close || '22:00',
        },
        saturday: {
          open: operatingHours.saturday?.open || '09:00',
          close: operatingHours.saturday?.close || '22:00',
        },
        sunday: {
          open: operatingHours.sunday?.open || '09:00',
          close: operatingHours.sunday?.close || '22:00',
        },
      };

      // Submit registration - only include email if it's a valid email format
      const registrationPayload: any = {
        account: {
          legalName: legalName.trim(),
          displayName: displayName.trim(),
          phone: user.phone.trim(),
          primaryContactName: primaryContactName.trim(),
        },
        location: {
          address: address.trim(),
          location: {
            lat: Number(location.lat),
            lng: Number(location.lng),
          },
          parkingAvailable: parking,
        },
        operatingHours: formattedOperatingHours,
      };

      // Add optional fields only if they have values
      if (email && email.trim() && email.includes('@')) {
        registrationPayload.account.email = email.trim();
      }
      if (fssaiNumber && fssaiNumber.trim()) {
        registrationPayload.account.fssaiNumber = fssaiNumber.trim();
      }
      if (entryPickupPoint && entryPickupPoint.trim()) {
        registrationPayload.location.entryPickupPoint = entryPickupPoint.trim();
      }
      if (landmark && landmark.trim()) {
        registrationPayload.location.landmark = landmark.trim();
      }
      if (pickupInstructions && pickupInstructions.trim()) {
        registrationPayload.pickupInstructions = pickupInstructions.trim();
      }

      console.log('Registration payload:', JSON.stringify(registrationPayload, null, 2));

      const response = await axios.post('/restaurants/register', registrationPayload);

      if (!response.data || !response.data.id) {
        throw new Error('Registration failed - no restaurant ID returned');
      }

      // Update prep & capacity
      await axios.patch('/restaurants/owner/my-restaurant/prep-capacity', {
        defaultPrepTimeMinutes: defaultPrepTime,
        maxOrdersPer15Min: maxOrders15Min,
        maxOrdersPer30Min: maxOrders30Min,
        holdTimeAfterReadyMinutes: holdTimeAfterReady,
        peakHourBufferMinutes: peakHourBuffer,
        autoAcceptOrders,
      });

      // Update bank details
      await axios.post('/restaurants/owner/my-restaurant/bank-details', {
        bankAccountNumber,
        bankIfscCode,
        bankAccountName,
      });

      Alert.alert(
        'Success',
        'Restaurant registered successfully! You can now add menu items from the dashboard.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back - the RestaurantStack will automatically show dashboard
              // since restaurant is now registered
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to register restaurant. Please try again.';
      
      if (error.response?.data) {
        // Handle validation errors
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (Array.isArray(error.response.data)) {
          // Validation errors array
          errorMessage = error.response.data.map((err: any) => 
            err.constraints ? Object.values(err.constraints).join(', ') : err.message || err
          ).join('\n');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Account & Identity</Text>
      <Text style={styles.stepSubtitle}>Complete your restaurant profile</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Legal Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Restaurant legal name"
          value={legalName}
          onChangeText={setLegalName}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Display Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Name shown to customers"
          value={displayName}
          onChangeText={setDisplayName}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="restaurant@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>FSSAI Number (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="FSSAI license number"
          value={fssaiNumber}
          onChangeText={setFssaiNumber}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Primary Contact Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Contact person name"
          value={primaryContactName}
          onChangeText={setPrimaryContactName}
        />
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Location & Accessibility</Text>
      <Text style={styles.stepSubtitle}>Set your restaurant location</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Address *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Complete address"
          value={address}
          onChangeText={setAddress}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.locationButtons}>
        <TouchableOpacity
          style={[styles.locationButton, styles.currentLocationButton]}
          onPress={getCurrentLocation}
          disabled={loading}
        >
          <Text style={[styles.locationButtonText, styles.currentLocationButtonText]}>
            {loading ? '⏳ Getting location...' : '📍 Use Current Location'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.locationButton, styles.mapButton]}
          onPress={() => setShowMapPicker(true)}
        >
          <Text style={styles.locationButtonText}>🗺️ Select on Map</Text>
        </TouchableOpacity>
      </View>
      
      {location && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationInfoText}>
            📍 {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </Text>
          {address && (
            <Text style={styles.addressText} numberOfLines={2}>{address}</Text>
          )}
        </View>
      )}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Entry / Pickup Point</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Instructions for finding entry point"
          value={entryPickupPoint}
          onChangeText={setEntryPickupPoint}
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Landmark (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Nearby landmark"
          value={landmark}
          onChangeText={setLandmark}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Parking Available</Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setParkingAvailable(!parkingAvailable)}
        >
          <Text style={styles.toggleButtonText}>
            {parkingAvailable ? '✅ Yes' : '❌ No'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Operating Hours</Text>
      <Text style={styles.stepSubtitle}>Set your weekly schedule</Text>

      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
        <View key={day} style={styles.hoursRow}>
          <Text style={styles.dayLabel}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
          <View style={styles.hoursInputs}>
            <TextInput
              style={styles.timeInput}
              placeholder="09:00"
              value={operatingHours[day as keyof typeof operatingHours].open}
              onChangeText={(text) =>
                setOperatingHours({
                  ...operatingHours,
                  [day]: { ...operatingHours[day as keyof typeof operatingHours], open: text },
                })
              }
            />
            <Text style={styles.timeSeparator}>to</Text>
            <TextInput
              style={styles.timeInput}
              placeholder="22:00"
              value={operatingHours[day as keyof typeof operatingHours].close}
              onChangeText={(text) =>
                setOperatingHours({
                  ...operatingHours,
                  [day]: { ...operatingHours[day as keyof typeof operatingHours], close: text },
                })
              }
            />
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderStep5 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Prep & Capacity Controls</Text>
      <Text style={styles.stepSubtitle}>Configure order management</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Default Prep Time (minutes)</Text>
        <View style={styles.numberInput}>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => setDefaultPrepTime(Math.max(1, defaultPrepTime - 1))}
          >
            <Text style={styles.numberButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.numberValue}>{defaultPrepTime}</Text>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => setDefaultPrepTime(Math.min(120, defaultPrepTime + 1))}
          >
            <Text style={styles.numberButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Max Orders per 15 min</Text>
        <View style={styles.numberInput}>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => setMaxOrders15Min(Math.max(1, maxOrders15Min - 1))}
          >
            <Text style={styles.numberButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.numberValue}>{maxOrders15Min}</Text>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => setMaxOrders15Min(Math.min(50, maxOrders15Min + 1))}
          >
            <Text style={styles.numberButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Max Orders per 30 min</Text>
        <View style={styles.numberInput}>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => setMaxOrders30Min(Math.max(1, maxOrders30Min - 1))}
          >
            <Text style={styles.numberButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.numberValue}>{maxOrders30Min}</Text>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => setMaxOrders30Min(Math.min(100, maxOrders30Min + 1))}
          >
            <Text style={styles.numberButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Hold Time After Ready (minutes)</Text>
        <View style={styles.numberInput}>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => setHoldTimeAfterReady(Math.max(0, holdTimeAfterReady - 1))}
          >
            <Text style={styles.numberButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.numberValue}>{holdTimeAfterReady}</Text>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => setHoldTimeAfterReady(Math.min(60, holdTimeAfterReady + 1))}
          >
            <Text style={styles.numberButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Peak Hour Buffer (minutes)</Text>
        <View style={styles.numberInput}>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => setPeakHourBuffer(Math.max(0, peakHourBuffer - 1))}
          >
            <Text style={styles.numberButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.numberValue}>{peakHourBuffer}</Text>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => setPeakHourBuffer(Math.min(30, peakHourBuffer + 1))}
          >
            <Text style={styles.numberButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Auto-Accept Orders</Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setAutoAcceptOrders(!autoAcceptOrders)}
        >
          <Text style={styles.toggleButtonText}>
            {autoAcceptOrders ? '✅ Enabled' : '❌ Disabled'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Pickup Instructions</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Instructions for customers picking up orders"
          value={pickupInstructions}
          onChangeText={setPickupInstructions}
          multiline
          numberOfLines={4}
        />
      </View>
    </ScrollView>
  );

  const renderStep6 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Bank Details</Text>
      <Text style={styles.stepSubtitle}>For payouts and earnings</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Account Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="Bank account number"
          value={bankAccountNumber}
          onChangeText={setBankAccountNumber}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>IFSC Code *</Text>
        <TextInput
          style={styles.input}
          placeholder="IFSC code"
          value={bankIfscCode}
          onChangeText={setBankIfscCode}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Account Holder Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Account holder name"
          value={bankAccountName}
          onChangeText={setBankAccountName}
        />
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / 6) * 100}%` }]} />
      </View>

      {/* Step Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Menu Management</Text>
          <Text style={styles.stepSubtitle}>Add menu items after registration</Text>
          <Text style={styles.infoText}>
            You can add menu items from the dashboard after completing registration.
          </Text>
        </View>
      )}
      {step === 5 && renderStep5()}
      {step === 6 && renderStep6()}

      {/* Navigation Buttons */}
      <View style={styles.navigation}>
        {step > 1 ? (
          <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={loading}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              Alert.alert(
                'Cancel Registration',
                'Are you sure you want to cancel? Your progress will be lost.',
                [
                  {
                    text: 'Continue Registration',
                    style: 'cancel',
                  },
                  {
                    text: 'Cancel',
                    style: 'destructive',
                    onPress: async () => {
                      // Switch role back to user and navigate to user mode
                      try {
                        setLoading(true);
                        const token = await SecureStore.getItemAsync('authToken');
                        if (token) {
                          const response = await axios.post(
                            '/auth/set-role',
                            { role: 'user', setAsDefault: false },
                            {
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                            }
                          );

                          if (response.data.success) {
                            await signIn(response.data.token, response.data.user);
                            // Navigation will automatically switch to UserStack
                          }
                        } else {
                          // No token, just navigate back
                          navigation.goBack();
                        }
                      } catch (error: any) {
                        console.error('Error switching role:', error);
                        // Even if role switch fails, try to navigate back
                        navigation.goBack();
                      } finally {
                        setLoading(false);
                      }
                    },
                  },
                ]
              );
            }}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, loading && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>
              {step === 6 ? 'Complete Registration' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Map Picker Modal */}
      <Modal
        visible={showMapPicker}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowMapPicker(false)}
      >
        <MapPicker
          initialLocation={location || { lat: 28.6139, lng: 77.2090 }}
          onLocationSelect={(lat, lng, addressText) => {
            console.log('MapPicker selected:', { lat, lng, addressText });
            setLocation({ lat, lng });
            if (addressText) {
              setAddress(addressText);
            } else {
              // If no address provided, try to reverse geocode
              getAddressFromLocation(lat, lng);
            }
            setShowMapPicker(false);
          }}
          onClose={() => setShowMapPicker(false)}
          title="Set Restaurant Location"
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e9ecef',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  locationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  locationButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  currentLocationButton: {
    borderColor: '#34C759',
    backgroundColor: '#f0fdf4',
  },
  mapButton: {
    borderStyle: 'dashed',
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  currentLocationButtonText: {
    color: '#34C759',
  },
  locationInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  locationInfoText: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  toggleButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  toggleButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  dayLabel: {
    width: 100,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  hoursInputs: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  timeSeparator: {
    marginHorizontal: 12,
    color: '#6c757d',
  },
  numberInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
  },
  numberButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: '300',
  },
  numberValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  infoText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 40,
  },
  navigation: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc3545',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

