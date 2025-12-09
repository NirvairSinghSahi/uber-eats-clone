import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectCartItems, selectCartTotal, selectDeliveryAddress, clearCart } from '../store/slices/cartSlice';
import { logout } from '../store/slices/authSlice';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const cartTotal = useAppSelector(selectCartTotal);
  const deliveryAddress = useAppSelector(selectDeliveryAddress);
  const user = useAppSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [orderType, setOrderType] = useState('delivery'); // 'delivery' or 'pickup'
  const [tipType, setTipType] = useState('percentage'); // 'percentage' or 'custom'
  const [tipPercentage, setTipPercentage] = useState(15); // 10, 15, 20, or custom
  const [customTip, setCustomTip] = useState('');

  const subtotal = cartTotal;
  const deliveryFee = (orderType === 'delivery' && cartItems.length > 0) ? 2.99 : 0;
  const tax = subtotal * 0.1;
  
  // Calculate tip
  const tipAmount = tipType === 'percentage' 
    ? subtotal * (tipPercentage / 100)
    : parseFloat(customTip) || 0;
  
  const total = subtotal + deliveryFee + tax + tipAmount;

  const handlePlaceOrder = async () => {
    if (loading || orderPlaced) {
      return;
    }

    if (orderType === 'delivery' && !deliveryAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    setLoading(true);
    setOrderPlaced(true);
    
    try {
      // Check if user is a guest
      if (!user || !user.uid || user.isGuest) {
        Alert.alert(
          'Sign Up Required',
          'You need to create an account to place an order. Would you like to sign up?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setLoading(false);
                setOrderPlaced(false);
              },
            },
            {
              text: 'Sign Up',
              onPress: () => {
                setLoading(false);
                setOrderPlaced(false);
                // Log out guest user to show auth stack
                dispatch(logout());
              },
            },
          ]
        );
        return;
      }

      // Get restaurant coordinates from first cart item
      const restaurantCoordinates = cartItems[0]?.restaurantCoordinates || null;
      // Get delivery/pickup address coordinates
      const addressCoordinates = deliveryAddress?.location || null;

      const order = {
        userId: user.uid,
        items: cartItems,
        orderType: orderType, // 'delivery' or 'pickup'
        deliveryAddress: orderType === 'delivery' ? deliveryAddress.description : null,
        pickupAddress: orderType === 'pickup' ? (cartItems[0]?.restaurant || 'Restaurant') : null,
        restaurantName: cartItems[0]?.restaurant || 'Restaurant',
        restaurantCoordinates: restaurantCoordinates,
        deliveryCoordinates: orderType === 'delivery' ? addressCoordinates : null,
        paymentMethod: 'cash',
        subtotal,
        deliveryFee,
        tax,
        tip: tipAmount,
        total,
        status: 'placed', // Initial status
        statusHistory: [
          {
            status: 'placed',
            timestamp: new Date().toISOString(),
            message: 'Order placed successfully',
          },
        ],
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
      };

      const docRef = await addDoc(collection(db, 'orders'), order);
      console.log('Order placed successfully with ID:', docRef.id);
      
      // Store order data for confirmation screen
      setOrderData({
        id: docRef.id,
        ...order,
      });
      
      // Clear cart after successful order
      dispatch(clearCart());
      
      // Navigate to tracking screen
      navigation.navigate('OrderTracking', { orderId: docRef.id });
    } catch (error) {
      console.error('Error placing order:', error);
      
      let errorMessage = 'Failed to place order. Please try again.';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your Firestore security rules.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Service unavailable. Please check your internet connection.';
      }
      
      Alert.alert('Error', errorMessage);
      setOrderPlaced(false);
    } finally {
      setLoading(false);
    }
  };

  // Reset orderPlaced flag when cart items change
  useEffect(() => {
    if (cartItems.length === 0) {
      setOrderPlaced(false);
    }
  }, [cartItems.length]);

  // Show confirmation screen if order is placed
  if (orderData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.content}>
          <View style={styles.confirmationContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            </View>
            <Text style={styles.confirmationTitle}>Order Confirmed!</Text>
            <Text style={styles.confirmationSubtitle}>
              Your order has been placed successfully
            </Text>

            <View style={styles.orderDetailsCard}>
              <Text style={styles.detailsTitle}>Order Details</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order ID:</Text>
                <Text style={styles.detailValue}>{orderData.id}</Text>
              </View>

              {orderData.orderType === 'delivery' ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Delivery Address:</Text>
                  <Text style={styles.detailValue}>{orderData.deliveryAddress || 'N/A'}</Text>
                </View>
              ) : (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pickup Location:</Text>
                  <Text style={styles.detailValue}>{orderData.pickupAddress || orderData.restaurantName || 'N/A'}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Method:</Text>
                <Text style={styles.detailValue}>
                  {orderData.orderType === 'pickup' ? 'Cash on Pickup' : 'Cash on Delivery'}
                </Text>
              </View>

              <View style={styles.itemsSection}>
                <Text style={styles.itemsTitle}>Items:</Text>
                {orderData.items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.itemName}>
                      {item.name} x{String(item.quantity || 1)}
                    </Text>
                    <Text style={styles.itemPrice}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.summarySection}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal:</Text>
                  <Text style={styles.summaryValue}>${orderData.subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Fee:</Text>
                  <Text style={styles.summaryValue}>${orderData.deliveryFee.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax:</Text>
                  <Text style={styles.summaryValue}>${orderData.tax.toFixed(2)}</Text>
                </View>
                {orderData.tip && orderData.tip > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tip:</Text>
                    <Text style={styles.summaryValue}>${(orderData.tip || 0).toFixed(2)}</Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>${orderData.total.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.confirmationActions}>
              <TouchableOpacity
                style={[styles.backButton, styles.viewOrderButton]}
                onPress={() => {
                  const orderId = orderData.id;
                  setOrderData(null);
                  navigation.navigate('OrderTracking', { orderId });
                }}
              >
                <Text style={styles.backButtonText}>Track Your Order</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setOrderData(null);
                  navigation.getParent()?.navigate('Home');
                }}
              >
                <Text style={styles.backButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show checkout form
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Type</Text>
          <View style={styles.orderTypeContainer}>
            <TouchableOpacity
              style={[
                styles.orderTypeOption,
                orderType === 'delivery' && styles.orderTypeOptionActive,
              ]}
              onPress={() => setOrderType('delivery')}
            >
              <Ionicons
                name="car-outline"
                size={24}
                color={orderType === 'delivery' ? '#fff' : '#000'}
              />
              <Text
                style={[
                  styles.orderTypeText,
                  orderType === 'delivery' && styles.orderTypeTextActive,
                ]}
              >
                Delivery
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.orderTypeOption,
                orderType === 'pickup' && styles.orderTypeOptionActive,
              ]}
              onPress={() => setOrderType('pickup')}
            >
              <Ionicons
                name="storefront-outline"
                size={24}
                color={orderType === 'pickup' ? '#fff' : '#000'}
              />
              <Text
                style={[
                  styles.orderTypeText,
                  orderType === 'pickup' && styles.orderTypeTextActive,
                ]}
              >
                Pickup
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {orderType === 'delivery' && (
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
        )}

        {orderType === 'pickup' && cartItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pickup Location</Text>
            <View style={styles.addressCard}>
              <Ionicons name="storefront-outline" size={20} color="#000" />
              <Text style={styles.addressText}>
                {cartItems[0]?.restaurant || 'Restaurant'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.orderItemName}>
                {item.name} x{String(item.quantity || 1)}
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
          {orderType === 'delivery' && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tip</Text>
            <Text style={styles.summaryValue}>${tipAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tip</Text>
          <View style={styles.tipTypeContainer}>
            <TouchableOpacity
              style={[
                styles.tipTypeOption,
                tipType === 'percentage' && styles.tipTypeOptionActive,
              ]}
              onPress={() => setTipType('percentage')}
            >
              <Text
                style={[
                  styles.tipTypeText,
                  tipType === 'percentage' && styles.tipTypeTextActive,
                ]}
              >
                Percentage
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tipTypeOption,
                tipType === 'custom' && styles.tipTypeOptionActive,
              ]}
              onPress={() => setTipType('custom')}
            >
              <Text
                style={[
                  styles.tipTypeText,
                  tipType === 'custom' && styles.tipTypeTextActive,
                ]}
              >
                Custom
              </Text>
            </TouchableOpacity>
          </View>
          
          {tipType === 'percentage' ? (
            <View style={styles.tipPercentageContainer}>
              {[10, 15, 20, 25].map((percent) => (
                <TouchableOpacity
                  key={percent}
                  style={[
                    styles.tipPercentageButton,
                    tipPercentage === percent && styles.tipPercentageButtonActive,
                  ]}
                  onPress={() => setTipPercentage(percent)}
                >
                  <Text
                    style={[
                      styles.tipPercentageText,
                      tipPercentage === percent && styles.tipPercentageTextActive,
                    ]}
                  >
                    {percent}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.customTipContainer}>
              <Text style={styles.customTipLabel}>Custom Tip Amount ($)</Text>
              <TextInput
                style={styles.customTipInput}
                value={customTip}
                onChangeText={setCustomTip}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentOption}>
            <Ionicons name="cash-outline" size={24} color="#000" />
            <Text style={styles.paymentOptionText}>
              {orderType === 'pickup' ? 'Cash on Pickup' : 'Cash on Delivery'}
            </Text>
          </View>
          <Text style={styles.paymentNote}>
            {orderType === 'pickup' 
              ? 'Pay with cash when you pick up your order'
              : 'Pay with cash when your order arrives'}
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
  content: {
    flex: 1,
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
  orderTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  orderTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  orderTypeOptionActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  orderTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  orderTypeTextActive: {
    color: '#fff',
  },
  tipTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  tipTypeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  tipTypeOptionActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  tipTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  tipTypeTextActive: {
    color: '#fff',
  },
  tipPercentageContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  tipPercentageButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  tipPercentageButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  tipPercentageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  tipPercentageTextActive: {
    color: '#fff',
  },
  customTipContainer: {
    marginTop: 12,
  },
  customTipLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  customTipInput: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
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
  // Confirmation screen styles
  confirmationContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  successIcon: {
    marginTop: 40,
    marginBottom: 20,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  orderDetailsCard: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
    flex: 1,
    textAlign: 'right',
  },
  itemsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  summarySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  confirmationActions: {
    width: '100%',
    gap: 12,
  },
  backButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 0,
  },
  viewOrderButton: {
    backgroundColor: '#4CAF50',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CheckoutScreen;
