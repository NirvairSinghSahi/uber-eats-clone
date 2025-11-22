import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../store/hooks';
import { doc, updateDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { calculateDeliveryTime as calculateDeliveryTimeAPI } from '../services/deliveryTimeService';
import AnimatedModal from '../components/AnimatedModal';
import { Animated } from 'react-native';
import { sendNotification } from '../services/notificationService';
import { sendDeliveryUpdateEmail } from '../services/emailService';
import { store } from '../store/store';

const DeliveryTrackingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const user = useAppSelector((state) => state.auth.user);
  const { orderId: routeOrderId } = route.params || {};
  const [order, setOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(routeOrderId);
  const [orderUnsubscribe, setOrderUnsubscribe] = useState(null);
  const [estimatedDeliveryMinutes, setEstimatedDeliveryMinutes] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Load all orders on mount and when user changes
  useEffect(() => {
    if (user?.uid) {
      loadAllOrders();
    }
  }, [user]);

  // Cleanup order listener on unmount
  useEffect(() => {
    return () => {
      if (orderUnsubscribe && typeof orderUnsubscribe === 'function') {
        orderUnsubscribe();
      }
    };
  }, [orderUnsubscribe]);

  // Update selectedOrderId when route params change (e.g., from OrderHistory or Checkout)
  useEffect(() => {
    if (routeOrderId && routeOrderId !== selectedOrderId) {
      setSelectedOrderId(routeOrderId);
    }
  }, [routeOrderId]);

  // Load the selected order when selectedOrderId changes
  useEffect(() => {
    if (selectedOrderId) {
      loadOrder();
    } else if (orders.length > 0 && !selectedOrderId) {
      // If no order selected but orders exist, select the first pending or most recent
      const pendingOrder = orders.find(o => o.status === 'pending');
      const orderToSelect = pendingOrder || orders[0];
      if (orderToSelect) {
        setSelectedOrderId(orderToSelect.id);
      }
    }
  }, [selectedOrderId, orders.length]);

  const loadAllOrders = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      // Load all orders (pending and delivered)
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const allOrders = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Sort: pending orders first (newest first), then delivered orders (newest first)
      allOrders.sort((a, b) => {
        const timeA = a.timestamp || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.timestamp || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        
        // Prioritize pending orders
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        
        // Within same status, sort by time (newest first)
        return timeB - timeA;
      });

      setOrders(allOrders);
      
      // Only set default selected order if no orderId from route params and no order currently selected
      if (!routeOrderId && !selectedOrderId && allOrders.length > 0) {
        const pendingOrder = allOrders.find(o => o.status === 'pending');
        const mostRecentOrder = allOrders[0];
        const orderToShow = pendingOrder || mostRecentOrder;
        
        if (orderToShow) {
          setSelectedOrderId(orderToShow.id);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading orders:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (order && order.status === 'pending') {
      // Animate timer container
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Calculate delivery time once when order loads
      calculateDeliveryTime();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [order]);

  useEffect(() => {
    if (order && order.status === 'pending' && order.createdAt) {
      // Update countdown every second
      const interval = setInterval(() => {
        const orderTime = new Date(order.createdAt).getTime();
        const now = Date.now();
        const elapsed = now - orderTime;
        const estimatedDeliveryTime = (estimatedDeliveryMinutes || 35) * 60 * 1000;
        const remaining = estimatedDeliveryTime - elapsed;

        if (remaining <= 0) {
          setTimeRemaining(null);
        } else {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          setTimeRemaining({ minutes, seconds });
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeRemaining(null);
    }
  }, [order, estimatedDeliveryMinutes]);

  const loadOrder = () => {
    if (!selectedOrderId) {
      setLoading(false);
      return;
    }

    // Cleanup previous listener
    if (orderUnsubscribe && typeof orderUnsubscribe === 'function') {
      orderUnsubscribe();
    }

    try {
      const orderDoc = doc(db, 'orders', selectedOrderId);
      const unsubscribe = onSnapshot(orderDoc, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const orderData = { id: docSnapshot.id, ...docSnapshot.data() };
          setOrder(orderData);
          setLoading(false);
          
          // Update in orders list if it exists
          setOrders(prev => {
            const existing = prev.find(o => o.id === orderData.id);
            if (existing) {
              const updated = prev.map(o => o.id === orderData.id ? orderData : o);
              // Re-sort after update
              updated.sort((a, b) => {
                const timeA = a.timestamp || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
                const timeB = b.timestamp || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
                if (a.status === 'pending' && b.status !== 'pending') return -1;
                if (a.status !== 'pending' && b.status === 'pending') return 1;
                return timeB - timeA;
              });
              return updated;
            }
            // If order not in list, add it
            const newOrders = [...prev, orderData];
            newOrders.sort((a, b) => {
              const timeA = a.timestamp || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
              const timeB = b.timestamp || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
              if (a.status === 'pending' && b.status !== 'pending') return -1;
              if (a.status !== 'pending' && b.status === 'pending') return 1;
              return timeB - timeA;
            });
            return newOrders;
          });
        } else {
          setOrder(null);
          setLoading(false);
        }
      }, (error) => {
        console.error('Error loading order:', error);
        console.error('Order ID:', selectedOrderId);
        setLoading(false);
      });
      
      setOrderUnsubscribe(() => unsubscribe);
    } catch (error) {
      console.error('Error setting up order listener:', error);
      console.error('Order ID:', selectedOrderId);
      setLoading(false);
    }
  };

  // Calculate delivery time using API or fallback
  const calculateDeliveryTime = async () => {
    if (!order || !order.createdAt) return;

    // Try to get accurate delivery time from API if we have coordinates
    if (order.restaurantCoordinates && order.deliveryCoordinates) {
      try {
        const result = await calculateDeliveryTimeAPI(
          order.restaurantCoordinates,
          order.deliveryCoordinates
        );
        setEstimatedDeliveryMinutes(result.duration);
      } catch (error) {
        console.log('Error calculating delivery time from API:', error);
        setEstimatedDeliveryMinutes(35); // Fallback
      }
    } else {
      setEstimatedDeliveryMinutes(35); // Default fallback
    }
  };

  const markAsDelivered = async () => {
    const currentOrderId = selectedOrderId || orderId || order?.id;
    if (!currentOrderId || !user) {
      Alert.alert('Error', 'Unable to update order');
      return;
    }

    try {
      const orderRef = doc(db, 'orders', currentOrderId);
      await updateDoc(orderRef, {
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
      });

      // Send notification
      const state = store.getState();
      const notificationsEnabled = state.settings?.notifications ?? true;
      if (notificationsEnabled) {
        await sendNotification(
          'Order Delivered! ✅',
          'Your order has been delivered. Enjoy your meal!',
          { orderId: currentOrderId, type: 'order_delivered' }
        );
      }

      // Send email update if enabled
      if (user?.uid && user?.email) {
        try {
          await sendDeliveryUpdateEmail(user.uid, currentOrderId, 'delivered', user.email);
        } catch (error) {
          console.error('Error sending email:', error);
        }
      }

      Alert.alert('Success', 'Order marked as delivered!');
      // The onSnapshot listener will automatically update the order
    } catch (error) {
      console.error('Error updating order:', error);
      console.error('Order ID:', currentOrderId);
      Alert.alert('Error', `Failed to update order status: ${error.message}`);
    }
  };

  const handleMarkDelivered = () => {
    Alert.alert(
      'Mark as Delivered',
      'Have you received your order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delivered',
          onPress: markAsDelivered,
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No active order</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.browseButtonText}>Browse Restaurants</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Tracking</Text>
        </View>

        {orders.length > 1 && (
          <View style={styles.ordersList}>
            <Text style={styles.ordersListTitle}>
              Your Orders ({orders.filter(o => o.status === 'pending').length} pending, {orders.filter(o => o.status === 'delivered').length} delivered)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ordersScroll}>
              {orders.map((ord) => (
                <TouchableOpacity
                  key={ord.id}
                  style={[
                    styles.orderTab,
                    selectedOrderId === ord.id && styles.orderTabActive,
                    ord.status === 'delivered' && styles.orderTabDelivered
                  ]}
                  onPress={() => {
                    // Update route params to maintain navigation state
                    navigation.setParams({ orderId: ord.id });
                    setSelectedOrderId(ord.id);
                  }}
                >
                  <Text style={[
                    styles.orderTabText,
                    selectedOrderId === ord.id && styles.orderTabTextActive
                  ]}>
                    #{ord.id.substring(0, 6)}
                  </Text>
                  <Text style={[
                    styles.orderTabStatus,
                    selectedOrderId === ord.id && styles.orderTabStatusActive
                  ]}>
                    {ord.status === 'pending' ? 'Pending' : ord.status === 'delivered' ? 'Delivered' : ord.status}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={getStatusIcon(order.status)}
              size={48}
              color={getStatusColor(order.status)}
            />
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.status?.toUpperCase() || 'PENDING'}
            </Text>
          </View>

          {order.status === 'pending' && timeRemaining && (
            <Animated.View 
              style={[
                styles.timerContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                }
              ]}
            >
              <Text style={styles.timerLabel}>Estimated delivery in</Text>
              <Text style={styles.timer}>
                {timeRemaining.minutes}m {timeRemaining.seconds}s
              </Text>
              {estimatedDeliveryMinutes && (
                <Text style={styles.timerSource}>
                  {estimatedDeliveryMinutes === 35 ? 'Estimated' : 'Based on real-time traffic'}
                </Text>
              )}
            </Animated.View>
          )}

          {order.status === 'delivered' && (
            <View style={styles.deliveredContainer}>
              <Text style={styles.deliveredText}>Order delivered!</Text>
              {order.deliveredAt && (
                <Text style={styles.deliveredTime}>
                  {new Date(order.deliveredAt).toLocaleString()}
                </Text>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.section}
          onPress={() => setShowOrderDetailsModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Details</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailValue}>#{order.id.substring(0, 8)}</Text>
          </View>
          {order.items && order.items.length > 0 && order.items[0].restaurant && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Restaurant</Text>
              <Text style={styles.detailValue}>{order.items[0].restaurant}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery Address</Text>
            <Text style={styles.detailValue} numberOfLines={2}>{order.deliveryAddress || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>{order.paymentMethod || 'Cash on Delivery'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Date</Text>
            <Text style={styles.detailValue}>
              {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
            </Text>
          </View>
          {order.deliveredAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Delivered At</Text>
              <Text style={styles.detailValue}>
                {new Date(order.deliveredAt).toLocaleString()}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items ({order.items?.length || 0})</Text>
          {order.items && order.items.length > 0 ? (
            <>
              {order.items.map((item, index) => (
                <View key={item.id || index} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name || 'Item'}
                    </Text>
                    <Text style={styles.itemQuantity}>
                      Quantity: {item.quantity || 1}
                    </Text>
                  </View>
                  <Text style={styles.itemPrice}>
                    ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                  </Text>
                </View>
              ))}
              <View style={styles.summarySection}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>${order.subtotal?.toFixed(2) || '0.00'}</Text>
                </View>
                {order.deliveryFee && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery Fee</Text>
                    <Text style={styles.summaryValue}>${order.deliveryFee.toFixed(2)}</Text>
                  </View>
                )}
                {order.tax && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tax</Text>
                    <Text style={styles.summaryValue}>${order.tax.toFixed(2)}</Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>${order.total?.toFixed(2) || '0.00'}</Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.emptyItemsText}>No items in this order</Text>
          )}
        </View>

        {order.status === 'pending' && (
          <TouchableOpacity
            style={styles.deliveredButton}
            onPress={handleMarkDelivered}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.deliveredButtonText}>Mark as Delivered</Text>
          </TouchableOpacity>
        )}

        {order.status === 'delivered' && (
          <View style={styles.deliveredInfoCard}>
            <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
            <Text style={styles.deliveredInfoText}>This order has been delivered</Text>
            {order.deliveredAt && (
              <Text style={styles.deliveredInfoTime}>
                Delivered on {new Date(order.deliveredAt).toLocaleString()}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Order Details Modal */}
      <AnimatedModal
        visible={showOrderDetailsModal}
        onClose={() => setShowOrderDetailsModal(false)}
        title="Order Details"
        animationType="slide"
      >
        {order && (
          <ScrollView>
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Order ID</Text>
              <Text style={styles.modalValue}>#{order.id.substring(0, 8)}</Text>
            </View>
            {order.items && order.items[0]?.restaurant && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Restaurant</Text>
                <Text style={styles.modalValue}>{order.items[0].restaurant}</Text>
              </View>
            )}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Delivery Address</Text>
              <Text style={styles.modalValue}>{order.deliveryAddress || 'N/A'}</Text>
            </View>
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Payment Method</Text>
              <Text style={styles.modalValue}>{order.paymentMethod || 'Cash on Delivery'}</Text>
            </View>
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Order Date</Text>
              <Text style={styles.modalValue}>
                {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
              </Text>
            </View>
            {order.deliveredAt && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Delivered At</Text>
                <Text style={styles.modalValue}>
                  {new Date(order.deliveredAt).toLocaleString()}
                </Text>
              </View>
            )}
            {estimatedDeliveryMinutes && order.status === 'pending' && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Estimated Delivery Time</Text>
                <Text style={styles.modalValue}>{estimatedDeliveryMinutes} minutes</Text>
              </View>
            )}
          </ScrollView>
        )}
      </AnimatedModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  statusCard: {
    margin: 16,
    padding: 24,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    alignItems: 'center',
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  timerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  timer: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  deliveredContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  deliveredText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 4,
  },
  deliveredTime: {
    fontSize: 14,
    color: '#666',
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
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    minWidth: 70,
    textAlign: 'right',
  },
  summarySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyItemsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  orderTabDelivered: {
    opacity: 0.7,
  },
  deliveredInfoCard: {
    alignItems: 'center',
    backgroundColor: '#f0f9f0',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  deliveredInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 12,
    marginBottom: 4,
  },
  deliveredInfoTime: {
    fontSize: 14,
    color: '#666',
  },
  deliveredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  deliveredButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerSource: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  ordersList: {
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  ordersListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  ordersScroll: {
    paddingHorizontal: 16,
  },
  orderTab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  orderTabActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  orderTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  orderTabTextActive: {
    color: '#fff',
  },
  orderTabStatus: {
    fontSize: 10,
    color: '#666',
    textTransform: 'capitalize',
  },
  orderTabStatusActive: {
    color: '#fff',
  },
});

export default DeliveryTrackingScreen;


