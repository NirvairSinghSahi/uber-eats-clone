import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useAppSelector } from '../store/hooks';
import { selectCartItems } from '../store/slices/cartSlice';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  getTimeEstimate, 
  getEstimatedTimeForNextStatus,
  autoProgressOrder 
} from '../services/orderManagementService';

const { width, height } = Dimensions.get('window');

// Order status progression
const ORDER_STATUSES = {
  placed: {
    label: 'Order Placed',
    icon: 'checkmark-circle',
    color: '#4CAF50',
    message: 'Your order has been placed successfully',
  },
  confirmed: {
    label: 'Restaurant Confirmed',
    icon: 'restaurant',
    color: '#2196F3',
    message: 'Restaurant has confirmed your order',
  },
  preparing: {
    label: 'Preparing Your Order',
    icon: 'time',
    color: '#FF9800',
    message: 'Restaurant is preparing your order',
  },
  ready: {
    label: 'Order Ready',
    icon: 'checkmark-done-circle',
    color: '#4CAF50',
    message: 'Your order is ready for pickup',
  },
  // Delivery-only statuses
  driver_assigned: {
    label: 'Driver Assigned',
    icon: 'car',
    color: '#9C27B0',
    message: 'A driver has been assigned to your order',
  },
  driver_picked_up: {
    label: 'Driver Picked Up',
    icon: 'checkmark-done-circle',
    color: '#00BCD4',
    message: 'Driver has picked up your order from the restaurant',
  },
  on_the_way: {
    label: 'On The Way',
    icon: 'navigate',
    color: '#FF5722',
    message: 'Your order is on the way to you',
  },
  delivered: {
    label: 'Delivered',
    icon: 'checkmark-circle',
    color: '#4CAF50',
    message: 'Your order has been delivered',
  },
};

// Component to display estimated time (handles async calculation)
const EstimatedTimeDisplay = ({ status, order, inline = false }) => {
  const [timeEstimate, setTimeEstimate] = useState(null);

  useEffect(() => {
    const fetchTimeEstimate = async () => {
      if (status && order) {
        const estimate = await getTimeEstimate(status, order);
        setTimeEstimate(estimate);
      }
    };
    fetchTimeEstimate();
  }, [status, order]);

  if (!timeEstimate || typeof timeEstimate !== 'string' || !timeEstimate.trim()) {
    return null;
  }

  if (inline) {
    return (
      <Text style={styles.timelineTimeEstimate}>
        ~{timeEstimate}
      </Text>
    );
  }

  return (
    <Text style={styles.estimatedTimeText}>
      Estimated time: {timeEstimate}
    </Text>
  );
};

const OrderTrackingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const user = useAppSelector((state) => state.auth.user);
  const cartItems = useAppSelector(selectCartItems);
  const { orderId } = route.params || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    let unsubscribe = null;

    // If no orderId provided, try to get the latest order
    if (!orderId && user?.uid) {
      const loadLatestOrder = async () => {
        try {
          // Query without orderBy to avoid index requirement, sort in memory
          const q = query(
            collection(db, 'orders'),
            where('userId', '==', user.uid)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const ordersList = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            
            // Sort in memory by timestamp (newest first)
            ordersList.sort((a, b) => {
              const timeA = a.timestamp || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
              const timeB = b.timestamp || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
              return timeB - timeA; // Descending order
            });
            
            const latestOrder = ordersList[0];
            setOrder(latestOrder);
            setLoading(false);
            
            // Set up real-time listener for the latest order
            const orderRef = doc(db, 'orders', latestOrder.id);
            unsubscribe = onSnapshot(
              orderRef,
              (docSnapshot) => {
                if (docSnapshot.exists()) {
                  const orderData = {
                    id: docSnapshot.id,
                    ...docSnapshot.data(),
                  };
                  setOrder(orderData);
                  
                  // Auto-progress if needed
                  if (orderData.status !== 'delivered' && orderData.status !== 'ready') {
                    autoProgressOrder(orderData.id).catch(console.error);
                  }
                } else {
                  setOrder(null);
                }
              },
              (error) => {
                console.error('Error listening to order updates:', error);
              }
            );
            
            // Auto-progress if needed
            if (latestOrder.status !== 'delivered' && latestOrder.status !== 'ready') {
              autoProgressOrder(latestOrder.id).catch(console.error);
            }
          } else {
            setOrder(null);
            setLoading(false);
          }
        } catch (error) {
          console.error('Error loading latest order:', error);
          setOrder(null);
          setLoading(false);
        }
      };
      loadLatestOrder();
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }

    if (!orderId) {
      setLoading(false);
      return;
    }

    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // Listen to real-time order updates
    const orderRef = doc(db, 'orders', orderId);
    unsubscribe = onSnapshot(
      orderRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const orderData = {
            id: docSnapshot.id,
            ...docSnapshot.data(),
          };
          setOrder(orderData);
          
          // Auto-progress order through statuses (for demo)
          // In production, this would be handled by restaurant/driver apps
          if (orderData.status !== 'delivered' && orderData.status !== 'ready') {
            autoProgressOrder(orderData.id).catch(console.error);
          }
        } else {
          setOrder(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to order updates:', error);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [orderId, user]);

  // Calculate time remaining for next status
  useEffect(() => {
    if (!order || order.status === 'delivered' || order.status === 'ready') {
      setTimeRemaining(null);
      return;
    }

    let isMounted = true;

    const calculateTimeRemaining = async () => {
      const estimatedTime = await getEstimatedTimeForNextStatus(order.status, order);
      if (!estimatedTime || !isMounted) {
        setTimeRemaining(null);
        return;
      }

      // Get the timestamp of the current status
      const currentStatusHistory = order.statusHistory || [];
      const currentStatusEntry = currentStatusHistory
        .slice()
        .reverse()
        .find((entry) => entry.status === order.status);

      if (!currentStatusEntry) {
        setTimeRemaining(null);
        return;
      }

      const statusStartTime = new Date(currentStatusEntry.timestamp).getTime();
      const now = Date.now();
      const elapsed = now - statusStartTime;
      const remaining = Math.max(0, estimatedTime - elapsed);

      if (remaining <= 0) {
        setTimeRemaining(null);
        return;
      }

      const interval = setInterval(() => {
        if (!isMounted) {
          clearInterval(interval);
          return;
        }

        const now = Date.now();
        const elapsed = now - statusStartTime;
        const remaining = Math.max(0, estimatedTime - elapsed);

        if (remaining <= 0) {
          setTimeRemaining(null);
          clearInterval(interval);
        } else {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          setTimeRemaining({ minutes, seconds });
        }
      }, 1000);

      // Initial calculation
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining({ minutes, seconds });

      return () => {
        clearInterval(interval);
        isMounted = false;
      };
    };

    calculateTimeRemaining();

    return () => {
      isMounted = false;
    };
  }, [order]);

  // Fit map to show both restaurant and delivery location
  useEffect(() => {
    if (order && mapRef.current && order.restaurantCoordinates) {
      const coordinates = [];
      
      if (order.restaurantCoordinates) {
        coordinates.push({
          latitude: order.restaurantCoordinates.lat,
          longitude: order.restaurantCoordinates.lng,
        });
      }
      
      if (order.deliveryCoordinates && order.orderType === 'delivery') {
        coordinates.push({
          latitude: order.deliveryCoordinates.lat,
          longitude: order.deliveryCoordinates.lng,
        });
      }

      if (coordinates.length > 0) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        });
      }
    }
  }, [order]);

  const getCurrentStatusInfo = () => {
    if (!order) return null;
    return ORDER_STATUSES[order.status] || ORDER_STATUSES.placed;
  };

  const getStatusProgress = () => {
    if (!order) return 0;
    const isPickup = order.orderType === 'pickup';
    const statusFlow = isPickup
      ? ['placed', 'confirmed', 'preparing', 'ready']
      : ['placed', 'confirmed', 'preparing', 'driver_assigned', 'driver_picked_up', 'on_the_way', 'delivered'];
    const currentIndex = statusFlow.indexOf(order.status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statusFlow.length) * 100 : 0;
  };

  const getStatusTimeline = (orderData) => {
    if (!orderData) return [];
    
    const isPickup = orderData.orderType === 'pickup';
    const statusFlow = isPickup
      ? ['placed', 'confirmed', 'preparing', 'ready']
      : ['placed', 'confirmed', 'preparing', 'driver_assigned', 'driver_picked_up', 'on_the_way', 'delivered'];

    const currentIndex = statusFlow.indexOf(orderData.status);
    const statusHistory = orderData.statusHistory || [];

    return statusFlow.map((status, index) => {
      const statusInfo = ORDER_STATUSES[status];
      const historyEntry = statusHistory.find((entry) => entry.status === status);
      const isCompleted = index <= currentIndex;
      // Note: estimatedTime will be calculated asynchronously in the component

      return {
        status,
        label: statusInfo?.label || status,
        color: statusInfo?.color || '#666',
        completed: isCompleted,
        timestamp: historyEntry?.timestamp || null,
        message: historyEntry?.message || statusInfo?.message || '',
        estimatedTime: null, // Will be set asynchronously
      };
    });
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
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          {navigation.canGoBack() && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Order Tracking</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {!orderId ? 'Place your order first' : 'Order not found'}
          </Text>
          <Text style={styles.emptySubtext}>
            {!orderId 
              ? 'Add items to your cart and place an order to track it here'
              : 'The order you are looking for does not exist'}
          </Text>
          {!orderId && (
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.getParent()?.navigate('Home')}
            >
              <Text style={styles.browseButtonText}>Browse Restaurants</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getCurrentStatusInfo();
  const progress = getStatusProgress();
  const isPickup = order.orderType === 'pickup';

  const handleNavigateToCheckout = () => {
    if (cartItems.length > 0) {
      navigation.navigate('Checkout');
    } else {
      // Navigate to cart if no items, or to home
      navigation.getParent()?.navigate('Cart');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Tracking</Text>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleNavigateToCheckout}
        >
          <Ionicons name="cart-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View
              style={[
                styles.statusIconContainer,
                { backgroundColor: `${statusInfo.color}20` },
              ]}
            >
              <Ionicons name={statusInfo.icon} size={48} color={statusInfo.color} />
            </View>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
            <Text style={styles.statusMessage}>{statusInfo.message}</Text>
            
            {/* Time Estimate */}
            {timeRemaining && order.status !== 'delivered' && order.status !== 'ready' && (
              <View style={styles.timeEstimateContainer}>
                <Ionicons name="time-outline" size={20} color={statusInfo.color} />
                <Text style={[styles.timeEstimate, { color: statusInfo.color }]}>
                  Next update in: {timeRemaining.minutes}m {timeRemaining.seconds}s
                </Text>
              </View>
            )}
            
            {order.status !== 'delivered' && order.status !== 'ready' && (
              <EstimatedTimeDisplay status={order.status} order={order} />
            )}
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%`, backgroundColor: statusInfo.color },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}% Complete</Text>
          </View>
        </View>

        {/* Map View */}
        {order.restaurantCoordinates && (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: order.restaurantCoordinates.lat,
                longitude: order.restaurantCoordinates.lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              showsUserLocation={false}
              showsMyLocationButton={false}
            >
              {/* Restaurant Marker */}
              <Marker
                coordinate={{
                  latitude: order.restaurantCoordinates.lat,
                  longitude: order.restaurantCoordinates.lng,
                }}
                title={order.restaurantName || 'Restaurant'}
                description="Restaurant Location"
              >
                <View style={styles.restaurantMarker}>
                  <Ionicons name="restaurant" size={24} color="#fff" />
                </View>
              </Marker>

              {/* Delivery Address Marker (only for delivery orders) */}
              {order.deliveryCoordinates && order.orderType === 'delivery' && (
                <Marker
                  coordinate={{
                    latitude: order.deliveryCoordinates.lat,
                    longitude: order.deliveryCoordinates.lng,
                  }}
                  title="Delivery Address"
                  description={order.deliveryAddress}
                >
                  <View style={styles.deliveryMarker}>
                    <Ionicons name="location" size={24} color="#fff" />
                  </View>
                </Marker>
              )}

              {/* Route Line (for delivery orders) */}
              {order.deliveryCoordinates &&
                order.orderType === 'delivery' &&
                order.status !== 'placed' && (
                  <Polyline
                    coordinates={[
                      {
                        latitude: order.restaurantCoordinates.lat,
                        longitude: order.restaurantCoordinates.lng,
                      },
                      {
                        latitude: order.deliveryCoordinates.lat,
                        longitude: order.deliveryCoordinates.lng,
                      },
                    ]}
                    strokeColor="#4CAF50"
                    strokeWidth={3}
                  />
                )}
            </MapView>
          </View>
        )}

        {/* Order Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailValue}>#{order.id.substring(0, 8)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Type</Text>
            <Text style={styles.detailValue}>
              {isPickup ? 'Pickup' : 'Delivery'}
            </Text>
          </View>
          {isPickup ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pickup Location</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {order.pickupAddress || order.restaurantName || 'Restaurant'}
              </Text>
            </View>
          ) : (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Delivery Address</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {order.deliveryAddress || 'N/A'}
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Restaurant</Text>
            <Text style={styles.detailValue}>{order.restaurantName || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total</Text>
            <Text style={styles.detailValue}>${order.total?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>

        {/* Status Timeline with Time Estimates */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Order Timeline</Text>
          {getStatusTimeline(order).map((statusItem, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineLine}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor: statusItem.completed
                        ? statusItem.color
                        : '#e0e0e0',
                    },
                  ]}
                >
                  {statusItem.completed && (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  )}
                </View>
                {index < getStatusTimeline(order).length - 1 && (
                  <View
                    style={[
                      styles.timelineConnector,
                      {
                        backgroundColor: statusItem.completed
                          ? statusItem.color
                          : '#e0e0e0',
                      },
                    ]}
                  />
                )}
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text
                    style={[
                      styles.timelineStatus,
                      {
                        color: statusItem.completed ? statusItem.color : '#666',
                        fontWeight: statusItem.completed ? 'bold' : 'normal',
                      },
                    ]}
                  >
                    {statusItem.label}
                  </Text>
                  {!statusItem.completed && (
                    <EstimatedTimeDisplay status={statusItem.status} order={order} inline={true} />
                  )}
                </View>
                {statusItem.timestamp && (
                  <Text style={styles.timelineTime}>
                    {new Date(statusItem.timestamp).toLocaleString()}
                  </Text>
                )}
                {statusItem.message && (
                  <Text style={styles.timelineMessage}>{statusItem.message}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flex: 1,
  },
  checkoutButton: {
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  statusCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  timeEstimateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  timeEstimate: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  estimatedTimeText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  mapContainer: {
    height: 300,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  restaurantMarker: {
    backgroundColor: '#FF5722',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  deliveryMarker: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  detailsSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'right',
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  historyIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  historyContent: {
    flex: 1,
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 12,
    color: '#666',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLine: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    minHeight: 40,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 8,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  timelineTimeEstimate: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  timelineTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  timelineMessage: {
    fontSize: 12,
    color: '#666',
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
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  browseButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderTrackingScreen;

