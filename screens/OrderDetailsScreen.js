import React, { useState, useEffect } from 'react';
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
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectCartItems } from '../store/slices/cartSlice';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const OrderDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const user = useAppSelector((state) => state.auth.user);
  const cartItems = useAppSelector(selectCartItems);
  const { orderId } = route.params || {};
  const [order, setOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(orderId);

  // Listen for navigation focus to reload orders
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user?.uid) {
        loadOrders();
        if (orderId) {
          loadOrderDetails(orderId);
        }
      }
    });
    return unsubscribe;
  }, [navigation, user, orderId]);

  useEffect(() => {
    if (user?.uid) {
      loadOrders();
      if (orderId) {
        loadOrderDetails(orderId);
      }
    }
  }, [user, orderId]);

  const loadOrders = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      // Query without orderBy to avoid requiring a composite index
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
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
      
      setOrders(ordersList);
      
      // If no specific order selected, select the first one
      if (!selectedOrderId && ordersList.length > 0) {
        setSelectedOrderId(ordersList[0].id);
        loadOrderDetails(ordersList[0].id);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetails = async (id) => {
    if (!id) return;

    try {
      const orderDoc = await getDoc(doc(db, 'orders', id));
      if (orderDoc.exists()) {
        setOrder({
          id: orderDoc.id,
          ...orderDoc.data(),
        });
      }
    } catch (error) {
      console.error('Error loading order details:', error);
    }
  };

  const handleOrderSelect = (id) => {
    setSelectedOrderId(id);
    loadOrderDetails(id);
  };

  const handleDeleteOrder = (orderId) => {
    const orderToDelete = orders.find((o) => o.id === orderId);
    const orderNumber = orderToDelete ? `#${orderId.substring(0, 8)}` : 'this order';
    
    Alert.alert(
      'Delete Order',
      `Are you sure you want to delete ${orderNumber}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'orders', orderId));
              
              // Remove from local state
              const updatedOrders = orders.filter((o) => o.id !== orderId);
              setOrders(updatedOrders);
              
              // If deleted order was selected, select another one or clear
              if (selectedOrderId === orderId) {
                if (updatedOrders.length > 0) {
                  const newSelectedId = updatedOrders[0].id;
                  setSelectedOrderId(newSelectedId);
                  loadOrderDetails(newSelectedId);
                } else {
                  setSelectedOrderId(null);
                  setOrder(null);
                }
              }
              
              Alert.alert('Success', 'Order deleted successfully');
            } catch (error) {
              console.error('Error deleting order:', error);
              Alert.alert('Error', 'Failed to delete order. Please try again.');
            }
          },
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

  if (orders.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order History</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No orders yet</Text>
          <Text style={styles.emptySubtext}>
            Your order history will appear here
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.getParent()?.navigate('Home')}
          >
            <Text style={styles.browseButtonText}>Browse Restaurants</Text>
          </TouchableOpacity>
          {order && order.status !== 'delivered' && (
            <TouchableOpacity
              style={[styles.browseButton, styles.trackButton]}
              onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
            >
              <Text style={styles.browseButtonText}>Track Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Order History</Text>
      </View>

      {order && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {orders.length > 0 && (
            <View style={styles.ordersListContainer}>
              <Text style={styles.ordersListTitle}>Your Orders ({orders.length})</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.ordersScroll}
                nestedScrollEnabled={true}
              >
                {orders.map((item) => (
                  <View key={item.id} style={styles.orderTabContainer}>
                    <TouchableOpacity
                      style={[
                        styles.orderTab,
                        selectedOrderId === item.id && styles.orderTabActive,
                      ]}
                      onPress={() => handleOrderSelect(item.id)}
                    >
                      <Text
                        style={[
                          styles.orderTabText,
                          selectedOrderId === item.id && styles.orderTabTextActive,
                        ]}
                      >
                        #{item.id.substring(0, 6)}
                      </Text>
                      <Text
                        style={[
                          styles.orderTabStatus,
                          selectedOrderId === item.id && styles.orderTabStatusActive,
                        ]}
                      >
                        {item.status || 'pending'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteOrderButton}
                      onPress={() => handleDeleteOrder(item.id)}
                    >
                      <Ionicons name="close-circle" size={18} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
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
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(order.status) },
                ]}
              >
                {order.status?.toUpperCase() || 'PENDING'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Order Information</Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteOrder(order.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#ff4444" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Order ID</Text>
              <TouchableOpacity
                onPress={() => {
                  // Navigate to checkout if cart has items
                  if (cartItems && cartItems.length > 0) {
                    navigation.navigate('Checkout');
                  } else {
                    Alert.alert('Info', 'Add items to cart first to proceed to checkout');
                  }
                }}
              >
                <Text style={[styles.detailValue, styles.orderIdLink]}>
                  #{order.id.substring(0, 8)}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Order Date</Text>
              <Text style={styles.detailValue}>
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleString()
                  : 'N/A'}
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
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Delivery Address</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {order.deliveryAddress || 'N/A'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>
                {order.paymentMethod === 'cash'
                  ? 'Cash on Delivery'
                  : order.paymentMethod || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Order Items ({String(order.items?.length || 0)})
            </Text>
            {order.items && order.items.length > 0 ? (
              <>
                {order.items.map((item, index) => (
                  <View key={item.id || index} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.name || 'Item'}
                      </Text>
                      {item.restaurant && (
                        <Text style={styles.itemRestaurant}>
                          {item.restaurant}
                        </Text>
                      )}
                      <Text style={styles.itemQuantity}>
                        Quantity: {String(item.quantity || 1)}
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
                    <Text style={styles.summaryValue}>
                      ${order.subtotal?.toFixed(2) || '0.00'}
                    </Text>
                  </View>
                  {order.deliveryFee && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Delivery Fee</Text>
                      <Text style={styles.summaryValue}>
                        ${order.deliveryFee.toFixed(2)}
                      </Text>
                    </View>
                  )}
                  {order.tax && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Tax</Text>
                      <Text style={styles.summaryValue}>
                        ${order.tax.toFixed(2)}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>
                      ${order.total?.toFixed(2) || '0.00'}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.emptyItemsText}>No items in this order</Text>
            )}
          </View>
        </ScrollView>
      )}
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
  ordersListContainer: {
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
  orderTabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    position: 'relative',
  },
  orderTab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  deleteOrderButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
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
  content: {
    flex: 1,
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
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff4444',
    marginLeft: 6,
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
  itemRestaurant: {
    fontSize: 12,
    color: '#666',
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
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center',
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
  trackButton: {
    backgroundColor: '#4CAF50',
    marginTop: 12,
  },
  emptyItemsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default OrderDetailsScreen;

