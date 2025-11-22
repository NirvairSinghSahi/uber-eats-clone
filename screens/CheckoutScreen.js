import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectCartItems, selectCartTotal, selectDeliveryAddress, clearCart } from '../store/slices/cartSlice';
import { collection, addDoc } from 'firebase/firestore';
import { sendNotification } from '../services/notificationService';
import { sendOrderConfirmationEmail } from '../services/emailService';
import { store } from '../store/store';
import { db } from '../firebase';

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const cartTotal = useAppSelector(selectCartTotal);
  const deliveryAddress = useAppSelector(selectDeliveryAddress);
  const user = useAppSelector((state) => state.auth.user);
  const [paymentMethod] = useState('cash'); // Only cash on delivery
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false); // Prevent duplicate submissions

  const subtotal = cartTotal;
  const deliveryFee = 2.99;
  const tax = subtotal * 0.1;
  const total = subtotal + deliveryFee + tax;

  const handlePlaceOrder = async () => {
    // Prevent duplicate submissions
    if (loading || orderPlaced) {
      return;
    }

    if (!deliveryAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    // Payment method is always cash on delivery, no validation needed

    setLoading(true);
    setOrderPlaced(true); // Mark as placed to prevent duplicate clicks
    try {
      if (!user || !user.uid) {
        Alert.alert('Error', 'User not authenticated. Please log in again.');
        setLoading(false);
        setOrderPlaced(false); // Reset on error
        return;
      }

      // Get restaurant coordinates from first cart item
      const restaurantCoordinates = cartItems[0]?.restaurantCoordinates || null;
      // Get delivery address coordinates
      const deliveryCoordinates = deliveryAddress?.location || null;

      const order = {
        userId: user.uid,
        items: cartItems,
        deliveryAddress: deliveryAddress.description,
        paymentMethod,
        subtotal,
        deliveryFee,
        tax,
        total,
        status: 'pending',
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
        restaurantCoordinates, // Store for delivery time calculation
        deliveryCoordinates, // Store for delivery time calculation
      };

      const docRef = await addDoc(collection(db, 'orders'), order);
      console.log('Order placed successfully with ID:', docRef.id);
      
      // Clear cart IMMEDIATELY after successful order creation to prevent re-submission
      dispatch(clearCart());
      
      // Send notification if enabled
      const state = store.getState();
      const notificationsEnabled = state.settings?.notifications ?? true;
      if (notificationsEnabled) {
        try {
          await sendNotification(
            'Order Placed! 🎉',
            `Your order from ${cartItems[0]?.restaurant || 'restaurant'} has been placed successfully.`,
            { orderId: docRef.id, type: 'order_placed' }
          );
        } catch (error) {
          console.error('Error sending notification:', error);
        }
      }

      // Send email confirmation if enabled
      if (user?.uid && user?.email) {
        try {
          await sendOrderConfirmationEmail(user.uid, docRef.id, order, user.email);
        } catch (error) {
          console.error('Error sending email:', error);
        }
      }
      
      // Navigate to delivery tracking screen with order ID
      // Use replace to prevent going back to checkout
      navigation.getParent()?.navigate('Delivery', { 
        screen: 'DeliveryMain',
        params: { orderId: docRef.id }
      });
    } catch (error) {
      console.error('Error placing order:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to place order. Please try again.';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your Firestore security rules.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Service unavailable. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
      setOrderPlaced(false); // Reset on error so user can try again
    } finally {
      setLoading(false);
    }
  };

  // Reset orderPlaced flag when cart items change (e.g., after clearing)
  useEffect(() => {
    if (cartItems.length === 0) {
      setOrderPlaced(false);
    }
  }, [cartItems.length]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        {deliveryAddress ? (
          <View style={styles.addressCard}>
            <Ionicons name="location-outline" size={20} color="#000" />
            <Text style={styles.addressText}>{deliveryAddress.description}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addAddressButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.addAddressText}>Add Delivery Address</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        {cartItems.map((item) => (
          <View key={item.id} style={styles.orderItem}>
            <Text style={styles.orderItemName}>
              {item.name} x{item.quantity}
            </Text>
            <Text style={styles.orderItemPrice}>
              ${(item.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>
          <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax</Text>
          <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.paymentOption}>
          <Ionicons name="cash-outline" size={24} color="#000" />
          <Text style={styles.paymentOptionText}>Cash on Delivery</Text>
        </View>
        <Text style={styles.paymentNote}>
          Pay with cash when your order arrives
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.placeOrderButton, (loading || orderPlaced || cartItems.length === 0) && styles.disabledButton]}
        onPress={handlePlaceOrder}
        disabled={loading || orderPlaced || cartItems.length === 0}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.placeOrderButtonText}>
            Place Order - ${total.toFixed(2)}
          </Text>
        )}
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#000',
    marginLeft: 8,
    flex: 1,
  },
  addAddressButton: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  addAddressText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderItemName: {
    fontSize: 14,
    color: '#666',
  },
  orderItemPrice: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  paymentOptionText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
  },
  paymentNote: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginLeft: 36,
    fontStyle: 'italic',
  },
  placeOrderButton: {
    backgroundColor: '#000',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CheckoutScreen;

