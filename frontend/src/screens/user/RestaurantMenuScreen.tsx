import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export function RestaurantMenuScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { restaurantId } = route.params as { restaurantId: string };

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/restaurants/${restaurantId}/menu`);
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: any) => {
    const existingItem = cart.find((ci) => ci.menuItemId === item.id);
    if (existingItem) {
      setCart(
        cart.map((ci) =>
          ci.menuItemId === item.id
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci,
        ),
      );
    } else {
      setCart([...cart, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }]);
    }
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(cart.filter((item) => item.menuItemId !== menuItemId));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleProceed = async () => {
    if (cart.length === 0) return;

    try {
      // Validate cart
      const response = await axios.post('/orders/validate-cart', {
        restaurantId,
        items: cart.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      });

      navigation.navigate('PickupTimeConfirmation', {
        restaurantId,
        cart,
        cartValidation: response.data,
      });
    } catch (error: any) {
      console.error('Cart validation error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const groupedMenu = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <View style={styles.container}>
      <FlatList
        data={Object.entries(groupedMenu)}
        keyExtractor={([category]) => category}
        renderItem={({ item: [category, items] }) => (
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {items.map((menuItem) => (
              <TouchableOpacity
                key={menuItem.id}
                style={styles.menuItem}
                onPress={() => addToCart(menuItem)}
              >
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemName}>{menuItem.name}</Text>
                  <Text style={styles.menuItemDescription}>
                    {menuItem.description}
                  </Text>
                  <View style={styles.menuItemFooter}>
                    <Text style={styles.menuItemPrice}>₹{menuItem.price}</Text>
                    <Text style={styles.menuItemPrepTime}>
                      ⏱️ {menuItem.prepTimeMinutes} min
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />

      {cart.length > 0 && (
        <View style={styles.cartBar}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartTotal}>₹{getTotal()}</Text>
            <Text style={styles.cartItems}>{cart.length} items</Text>
          </View>
          <TouchableOpacity style={styles.proceedButton} onPress={handleProceed}>
            <Text style={styles.proceedButtonText}>Proceed</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  menuItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  menuItemPrepTime: {
    fontSize: 14,
    color: '#666',
  },
  cartBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  cartInfo: {
    flex: 1,
  },
  cartTotal: {
    fontSize: 20,
    fontWeight: '600',
  },
  cartItems: {
    fontSize: 14,
    color: '#666',
  },
  proceedButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

