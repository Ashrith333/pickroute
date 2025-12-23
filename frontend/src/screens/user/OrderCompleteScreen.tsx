import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';

export function OrderCompleteScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`/orders/${orderId}/rating`, {
        rating,
        comment,
      });

      Alert.alert('Thank you!', 'Your feedback has been recorded', [
        { text: 'OK', onPress: () => navigation.navigate('UserHome') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigation.navigate('UserHome');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Order Complete!</Text>
        <Text style={styles.successSubtitle}>
          Thank you for using PickRoute
        </Text>
      </View>

      <View style={styles.savingsCard}>
        <Text style={styles.savingsTitle}>You Saved</Text>
        <Text style={styles.savingsAmount}>₹50</Text>
        <Text style={styles.savingsSubtitle}>
          (No delivery charges + lower commission)
        </Text>
      </View>

      <View style={styles.ratingSection}>
        <Text style={styles.ratingTitle}>Rate Your Experience</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              style={styles.star}
              onPress={() => setRating(star)}
            >
              <Text style={styles.starText}>
                {star <= rating ? '⭐' : '☆'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.commentInput}
          placeholder="Optional: Tell us about your experience"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.buttonDisabled]}
          onPress={handleSubmitRating}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  successContainer: {
    backgroundColor: '#fff',
    padding: 40,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 10,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  savingsCard: {
    backgroundColor: '#34C759',
    padding: 30,
    margin: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  savingsTitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 5,
  },
  savingsAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  savingsSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  ratingSection: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 15,
    borderRadius: 8,
  },
  ratingTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10,
  },
  star: {
    padding: 5,
  },
  starText: {
    fontSize: 32,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: 15,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

