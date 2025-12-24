import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import axios from 'axios';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  prepTimeMinutes: number;
  isAvailable: boolean;
  isVeg: boolean;
  isFastPickup: boolean;
}

export function MenuManagementScreen() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(15);
  const [isVeg, setIsVeg] = useState(true);
  const [isFastPickup, setIsFastPickup] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      // Use the owner-specific endpoint that returns all items (including unavailable)
      const menuResponse = await axios.get('/restaurants/owner/my-restaurant/menu');
      setMenuItems(menuResponse.data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(menuResponse.data.map((item: MenuItem) => item.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !price || !category) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    try {
      const restaurant = await axios.get('/restaurants/owner/my-restaurant');
      
      if (editingItem) {
        // Update existing item
        await axios.put(`/restaurants/${restaurant.data.id}/menu/${editingItem.id}`, {
          name,
          description,
          price: parseFloat(price),
          category,
          prepTimeMinutes,
          isVeg,
          isFastPickup,
          isAvailable,
        });
      } else {
        // Create new item
        await axios.post(`/restaurants/${restaurant.data.id}/menu`, {
          name,
          description,
          price: parseFloat(price),
          category,
          prepTimeMinutes,
          isVeg,
          isFastPickup,
          isAvailable,
        });
      }

      setShowAddModal(false);
      resetForm();
      loadMenu();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save menu item');
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || '');
    setPrice(item.price.toString());
    setCategory(item.category);
    setPrepTimeMinutes(item.prepTimeMinutes);
    setIsVeg(item.isVeg);
    setIsFastPickup(item.isFastPickup);
    setIsAvailable(item.isAvailable);
    setShowAddModal(true);
  };

  const handleDelete = async (itemId: string) => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const restaurant = await axios.get('/restaurants/owner/my-restaurant');
            await axios.delete(`/restaurants/${restaurant.data.id}/menu/${itemId}`);
            loadMenu();
          } catch (error: any) {
            Alert.alert('Error', 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setPrice('');
    setCategory('');
    setNewCategory('');
    setPrepTimeMinutes(15);
    setIsVeg(true);
    setIsFastPickup(false);
    setIsAvailable(true);
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          resetForm();
          setShowAddModal(true);
        }}
      >
        <Text style={styles.addButtonText}>+ Add Menu Item</Text>
      </TouchableOpacity>

      <FlatList
        data={Object.entries(groupedItems)}
        keyExtractor={([category]) => category}
        renderItem={({ item: [category, items] }) => (
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {items.map((menuItem) => (
              <View 
                key={menuItem.id} 
                style={[
                  styles.menuItemCard,
                  !menuItem.isAvailable && styles.menuItemCardUnavailable
                ]}
              >
                <View style={styles.menuItemHeader}>
                  <View style={styles.menuItemInfo}>
                    <View style={styles.menuItemNameRow}>
                      <Text style={[
                        styles.menuItemName,
                        !menuItem.isAvailable && styles.menuItemNameUnavailable
                      ]}>
                        {menuItem.name}
                      </Text>
                      {!menuItem.isAvailable && (
                        <View style={styles.unavailableBadge}>
                          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>Unavailable</Text>
                        </View>
                      )}
                    </View>
                    {menuItem.description && (
                      <Text style={[
                        styles.menuItemDescription,
                        !menuItem.isAvailable && styles.menuItemDescriptionUnavailable
                      ]}>
                        {menuItem.description}
                      </Text>
                    )}
                    <View style={styles.menuItemMeta}>
                      <Text style={[
                        styles.menuItemPrice,
                        !menuItem.isAvailable && styles.menuItemPriceUnavailable
                      ]}>
                        ₹{menuItem.price}
                      </Text>
                      <Text style={[
                        styles.menuItemPrep,
                        !menuItem.isAvailable && styles.menuItemPrepUnavailable
                      ]}>
                        ⏱️ {menuItem.prepTimeMinutes} min
                      </Text>
                      {menuItem.isVeg ? (
                        <Text style={styles.vegBadge}>🟢 Veg</Text>
                      ) : (
                        <Text style={styles.nonVegBadge}>🔴 Non-Veg</Text>
                      )}
                      {menuItem.isFastPickup && (
                        <Text style={styles.fastBadge}>⚡ Fast</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.menuItemActions}>
                    <TouchableOpacity
                      style={styles.availabilityToggle}
                      onPress={async () => {
                        try {
                          const restaurant = await axios.get('/restaurants/owner/my-restaurant');
                          await axios.patch(`/restaurants/${restaurant.data.id}/menu/${menuItem.id}`, {
                            isAvailable: !menuItem.isAvailable,
                          });
                          loadMenu();
                        } catch (error) {
                          Alert.alert('Error', 'Failed to update availability');
                        }
                      }}
                    >
                      <Text style={styles.availabilityText}>
                        {menuItem.isAvailable ? '✅' : '❌'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEdit(menuItem)}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(menuItem.id)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No menu items yet</Text>
            <Text style={styles.emptySubtext}>Add your first item to get started</Text>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
      >
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Item name"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Item description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Price (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Main Course, Appetizers"
              value={category}
              onChangeText={setCategory}
            />
            {categories.length > 0 && (
              <View style={styles.categorySuggestions}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={styles.categoryChip}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={styles.categoryChipText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Prep Time (minutes)</Text>
            <View style={styles.numberInput}>
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() => setPrepTimeMinutes(Math.max(1, prepTimeMinutes - 1))}
              >
                <Text style={styles.numberButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.numberValue}>{prepTimeMinutes}</Text>
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() => setPrepTimeMinutes(Math.min(120, prepTimeMinutes + 1))}
              >
                <Text style={styles.numberButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.typeButton, isVeg && styles.typeButtonActive]}
                onPress={() => setIsVeg(true)}
              >
                <Text style={[styles.typeButtonText, isVeg && styles.typeButtonTextActive]}>
                  🟢 Veg
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, !isVeg && styles.typeButtonActive]}
                onPress={() => setIsVeg(false)}
              >
                <Text style={[styles.typeButtonText, !isVeg && styles.typeButtonTextActive]}>
                  🔴 Non-Veg
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Options</Text>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setIsFastPickup(!isFastPickup)}
            >
              <Text style={styles.optionLabel}>Fast Pickup</Text>
              <Text style={styles.optionToggle}>{isFastPickup ? '✅' : '❌'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setIsAvailable(!isAvailable)}
            >
              <Text style={styles.optionLabel}>Available</Text>
              <Text style={styles.optionToggle}>{isAvailable ? '✅' : '❌'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Item</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    margin: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  menuItemCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemCardUnavailable: {
    backgroundColor: '#f8f9fa',
    opacity: 0.8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  menuItemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  unavailableBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  menuItemNameUnavailable: {
    textDecorationLine: 'line-through',
    color: '#6c757d',
  },
  menuItemDescriptionUnavailable: {
    color: '#adb5bd',
  },
  menuItemPriceUnavailable: {
    color: '#adb5bd',
  },
  menuItemPrepUnavailable: {
    color: '#adb5bd',
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  menuItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  menuItemPrep: {
    fontSize: 14,
    color: '#6c757d',
  },
  vegBadge: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  nonVegBadge: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
  },
  fastBadge: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
  },
  menuItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availabilityToggle: {
    padding: 8,
  },
  availabilityText: {
    fontSize: 20,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalClose: {
    fontSize: 24,
    color: '#6c757d',
  },
  formGroup: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
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
  categorySuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryChipText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  numberInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 8,
  },
  numberButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#fff',
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
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#007AFF',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  optionToggle: {
    fontSize: 20,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

