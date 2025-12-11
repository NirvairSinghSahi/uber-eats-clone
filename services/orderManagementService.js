// Order Management Service - Simulates restaurant and driver actions
// In production, this would be replaced with actual restaurant/driver apps or backend API calls

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getEstimatedDeliveryTime } from './distanceService';

/**
 * Order status progression flow:
 * Delivery: placed → confirmed → preparing → driver_assigned → driver_picked_up → on_the_way → delivered
 * Pickup: placed → confirmed → preparing → ready
 */

// Status progression with estimated times (in milliseconds)
// These are base times that will be adjusted based on actual distance
const BASE_STATUS_TIMES = {
  placed_to_confirmed: 30000, // 30 seconds
  confirmed_to_preparing: 10000, // 10 seconds
  preparing_to_ready: 300000, // 5 minutes (for pickup)
  preparing_to_driver_assigned: 120000, // 2 minutes (for delivery)
  driver_assigned_to_picked_up: 60000, // 1 minute
  picked_up_to_on_the_way: 5000, // 5 seconds
  on_the_way_to_delivered: 180000, // 3 minutes (default, will be replaced with actual travel time)
};

/**
 * Restaurant confirms the order
 * @param {string} orderId - Order ID
 * @returns {Promise<boolean>} Success status
 */
export const confirmOrder = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    const orderData = orderDoc.data();
    const currentStatus = orderData.status;

    if (currentStatus === 'cancelled') {
      console.log(`Order ${orderId} is cancelled, cannot confirm`);
      return false;
    }

    if (currentStatus !== 'placed') {
      console.log(`Order ${orderId} is already ${currentStatus}, cannot confirm`);
      return false;
    }

    await updateDoc(orderRef, {
      status: 'confirmed',
      statusHistory: [
        ...(orderData.statusHistory || []),
        {
          status: 'confirmed',
          timestamp: new Date().toISOString(),
          message: 'Restaurant has confirmed your order',
        },
      ],
    });

    console.log(`Order ${orderId} confirmed by restaurant`);
    return true;
  } catch (error) {
    console.error('Error confirming order:', error);
    return false;
  }
};

/**
 * Restaurant starts preparing the order
 * @param {string} orderId - Order ID
 * @returns {Promise<boolean>} Success status
 */
export const startPreparing = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      // Order was deleted, silently return
      return false;
    }

    const orderData = orderDoc.data();
    const currentStatus = orderData.status;

    if (currentStatus === 'cancelled') {
      console.log(`Order ${orderId} is cancelled, cannot start preparing`);
      return false;
    }

    if (currentStatus !== 'confirmed') {
      console.log(`Order ${orderId} is ${currentStatus}, must be confirmed first`);
      return false;
    }

    await updateDoc(orderRef, {
      status: 'preparing',
      statusHistory: [
        ...(orderData.statusHistory || []),
        {
          status: 'preparing',
          timestamp: new Date().toISOString(),
          message: 'Restaurant is preparing your order',
        },
      ],
    });

    console.log(`Order ${orderId} is now being prepared`);
    return true;
  } catch (error) {
    console.error('Error updating order to preparing:', error);
    return false;
  }
};

/**
 * Assign a driver to the order
 * @param {string} orderId - Order ID
 * @param {string} driverId - Driver ID (optional, for future use)
 * @returns {Promise<boolean>} Success status
 */
export const assignDriver = async (orderId, driverId = null) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      // Order was deleted, silently return
      return false;
    }

    const orderData = orderDoc.data();
    const currentStatus = orderData.status;

    if (currentStatus === 'cancelled') {
      console.log(`Order ${orderId} is cancelled, cannot assign driver`);
      return false;
    }

    if (currentStatus !== 'preparing') {
      console.log(`Order ${orderId} is ${currentStatus}, must be preparing first`);
      return false;
    }

    await updateDoc(orderRef, {
      status: 'driver_assigned',
      driverId: driverId || 'driver_001', // Simulated driver ID
      statusHistory: [
        ...(orderData.statusHistory || []),
        {
          status: 'driver_assigned',
          timestamp: new Date().toISOString(),
          message: 'A driver has been assigned to your order',
        },
      ],
    });

    console.log(`Driver assigned to order ${orderId}`);
    return true;
  } catch (error) {
    console.error('Error assigning driver:', error);
    return false;
  }
};

/**
 * Driver picks up the order from restaurant
 * @param {string} orderId - Order ID
 * @returns {Promise<boolean>} Success status
 */
export const driverPickedUp = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    const orderData = orderDoc.data();
    const currentStatus = orderData.status;

    if (currentStatus !== 'driver_assigned') {
      console.log(`Order ${orderId} is ${currentStatus}, driver must be assigned first`);
      return false;
    }

    await updateDoc(orderRef, {
      status: 'driver_picked_up',
      pickedUpAt: new Date().toISOString(),
      statusHistory: [
        ...(orderData.statusHistory || []),
        {
          status: 'driver_picked_up',
          timestamp: new Date().toISOString(),
          message: 'Driver has picked up your order from the restaurant',
        },
      ],
    });

    console.log(`Order ${orderId} picked up by driver`);
    return true;
  } catch (error) {
    console.error('Error updating order to picked up:', error);
    return false;
  }
};

/**
 * Mark order as on the way
 * @param {string} orderId - Order ID
 * @returns {Promise<boolean>} Success status
 */
export const markOnTheWay = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    const orderData = orderDoc.data();
    const currentStatus = orderData.status;

    if (currentStatus !== 'driver_picked_up') {
      console.log(`Order ${orderId} is ${currentStatus}, must be picked up first`);
      return false;
    }

    await updateDoc(orderRef, {
      status: 'on_the_way',
      onTheWayAt: new Date().toISOString(),
      statusHistory: [
        ...(orderData.statusHistory || []),
        {
          status: 'on_the_way',
          timestamp: new Date().toISOString(),
          message: 'Your order is on the way to you',
        },
      ],
    });

    console.log(`Order ${orderId} is now on the way`);
    return true;
  } catch (error) {
    console.error('Error updating order to on the way:', error);
    return false;
  }
};

/**
 * Mark order as delivered
 * @param {string} orderId - Order ID
 * @returns {Promise<boolean>} Success status
 */
export const markAsDelivered = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    const orderData = orderDoc.data();
    const currentStatus = orderData.status;

    if (currentStatus === 'delivered') {
      console.log(`Order ${orderId} is already delivered`);
      return false;
    }

    await updateDoc(orderRef, {
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
      statusHistory: [
        ...(orderData.statusHistory || []),
        {
          status: 'delivered',
          timestamp: new Date().toISOString(),
          message: 'Your order has been delivered',
        },
      ],
    });

    console.log(`Order ${orderId} marked as delivered`);
    return true;
  } catch (error) {
    console.error('Error marking order as delivered:', error);
    return false;
  }
};

/**
 * Mark order as ready (for pickup orders)
 * @param {string} orderId - Order ID
 * @returns {Promise<boolean>} Success status
 */
export const markOrderReady = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    const orderData = orderDoc.data();
    const currentStatus = orderData.status;

    if (currentStatus === 'cancelled') {
      console.log(`Order ${orderId} is cancelled, cannot mark as ready`);
      return false;
    }

    if (currentStatus !== 'preparing') {
      console.log(`Order ${orderId} is ${currentStatus}, must be preparing first`);
      return false;
    }

    await updateDoc(orderRef, {
      status: 'ready',
      readyAt: new Date().toISOString(),
      statusHistory: [
        ...(orderData.statusHistory || []),
        {
          status: 'ready',
          timestamp: new Date().toISOString(),
          message: 'Your order is ready for pickup',
        },
      ],
    });

    console.log(`Order ${orderId} is now ready for pickup`);
    return true;
  } catch (error) {
    console.error('Error marking order as ready:', error);
    return false;
  }
};

/**
 * Cancel an order
 * @param {string} orderId - Order ID
 * @returns {Promise<{success: boolean, error?: string}>} Result object
 */
export const cancelOrder = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      return { success: false, error: 'Order not found' };
    }

    const orderData = orderDoc.data();
    const currentStatus = orderData.status;

    // Define non-cancellable statuses
    const nonCancellableStatuses = [
      'driver_assigned',
      'driver_picked_up',
      'on_the_way',
      'ready',
      'delivered',
      'cancelled',
    ];

    if (nonCancellableStatuses.includes(currentStatus)) {
      let errorMessage = 'This order cannot be cancelled.';
      if (currentStatus === 'ready') {
        errorMessage = 'This order is ready for pickup and cannot be cancelled.';
      } else if (currentStatus === 'driver_assigned' || currentStatus === 'driver_picked_up' || currentStatus === 'on_the_way') {
        errorMessage = 'This order is already out for delivery and cannot be cancelled.';
      } else if (currentStatus === 'delivered') {
        errorMessage = 'This order has already been delivered and cannot be cancelled.';
      } else if (currentStatus === 'cancelled') {
        errorMessage = 'This order has already been cancelled.';
      }
      return { success: false, error: errorMessage };
    }

    // Update order status to cancelled
    await updateDoc(orderRef, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      statusHistory: [
        ...(orderData.statusHistory || []),
        {
          status: 'cancelled',
          timestamp: new Date().toISOString(),
          message: 'Order has been cancelled',
        },
      ],
    });

    console.log(`Order ${orderId} has been cancelled`);
    return { success: true };
  } catch (error) {
    console.error('Error cancelling order:', error);
    return { success: false, error: error.message || 'Failed to cancel order' };
  }
};

/**
 * Auto-progress order through all statuses (for testing/demo)
 * Uses real travel time from Google Distance Matrix API for delivery orders
 * @param {string} orderId - Order ID
 * @returns {Promise<void>}
 */
export const autoProgressOrder = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      // Order was deleted, silently return
      return;
    }

    const orderData = orderDoc.data();
    
    // Don't auto-progress cancelled orders
    if (orderData.status === 'cancelled') {
      return;
    }
    
    const isPickup = orderData.orderType === 'pickup';

    if (isPickup) {
      // Pickup order flow: placed → confirmed → preparing → ready
      const confirmed = await confirmOrder(orderId);
      if (!confirmed) return; // Order was deleted
      await new Promise((resolve) => setTimeout(resolve, BASE_STATUS_TIMES.placed_to_confirmed));
      
      const preparing = await startPreparing(orderId);
      if (!preparing) return; // Order was deleted
      await new Promise((resolve) => setTimeout(resolve, BASE_STATUS_TIMES.confirmed_to_preparing));
      
      // Wait for preparation time
      await new Promise((resolve) => setTimeout(resolve, BASE_STATUS_TIMES.preparing_to_ready));
      
      await markOrderReady(orderId);
    } else {
      // Delivery order flow: placed → confirmed → preparing → driver_assigned → driver_picked_up → on_the_way → delivered
      // Calculate actual travel time if coordinates are available
      let travelTime = BASE_STATUS_TIMES.on_the_way_to_delivered; // Default 3 minutes
      
      if (orderData.restaurantCoordinates && orderData.deliveryCoordinates) {
        try {
          travelTime = await getEstimatedDeliveryTime(
            orderData.restaurantCoordinates,
            orderData.deliveryCoordinates
          );
          // Subtract prep time since travel time already includes it
          travelTime = Math.max(60000, travelTime - (5 * 60 * 1000)); // Min 1 minute
        } catch (error) {
          console.error('Error calculating travel time, using default:', error);
        }
      }

      // Progress through statuses with calculated times
      const confirmed = await confirmOrder(orderId);
      if (!confirmed) return; // Order was deleted
      await new Promise((resolve) => setTimeout(resolve, BASE_STATUS_TIMES.placed_to_confirmed));
      
      const preparing = await startPreparing(orderId);
      if (!preparing) return; // Order was deleted
      await new Promise((resolve) => setTimeout(resolve, BASE_STATUS_TIMES.confirmed_to_preparing));
      
      const driverAssigned = await assignDriver(orderId);
      if (!driverAssigned) return; // Order was deleted
      await new Promise((resolve) => setTimeout(resolve, BASE_STATUS_TIMES.preparing_to_driver_assigned));
      
      const pickedUp = await driverPickedUp(orderId);
      if (!pickedUp) return; // Order was deleted
      await new Promise((resolve) => setTimeout(resolve, BASE_STATUS_TIMES.driver_assigned_to_picked_up));
      
      const onTheWay = await markOnTheWay(orderId);
      if (!onTheWay) return; // Order was deleted
      // Use calculated travel time instead of default
      await new Promise((resolve) => setTimeout(resolve, BASE_STATUS_TIMES.picked_up_to_on_the_way));
      
      // Wait for actual travel time
      await new Promise((resolve) => setTimeout(resolve, travelTime));
      
      await markAsDelivered(orderId);
    }
  } catch (error) {
    console.error('Error auto-progressing order:', error);
  }
};

/**
 * Get estimated time for next status
 * @param {string} currentStatus - Current order status
 * @param {Object} orderData - Optional order data for calculating travel time
 * @returns {Promise<number>} Estimated time in milliseconds
 */
export const getEstimatedTimeForNextStatus = async (currentStatus, orderData = null) => {
  const isPickup = orderData?.orderType === 'pickup';
  
  switch (currentStatus) {
    case 'placed':
      return BASE_STATUS_TIMES.placed_to_confirmed;
    case 'confirmed':
      return BASE_STATUS_TIMES.confirmed_to_preparing;
    case 'preparing':
      if (isPickup) {
        return BASE_STATUS_TIMES.preparing_to_ready;
      }
      return BASE_STATUS_TIMES.preparing_to_driver_assigned;
    case 'ready':
      // Pickup orders end here
      return 0;
    case 'driver_assigned':
      return BASE_STATUS_TIMES.driver_assigned_to_picked_up;
    case 'driver_picked_up':
      return BASE_STATUS_TIMES.picked_up_to_on_the_way;
    case 'on_the_way':
      // Calculate actual travel time if order data is available
      if (orderData && 
          orderData.orderType === 'delivery' &&
          orderData.restaurantCoordinates && 
          orderData.deliveryCoordinates) {
        try {
          const travelTime = await getEstimatedDeliveryTime(
            orderData.restaurantCoordinates,
            orderData.deliveryCoordinates
          );
          // Subtract prep time since travel time includes it
          return Math.max(60000, travelTime - (5 * 60 * 1000)); // Min 1 minute
        } catch (error) {
          console.error('Error calculating travel time:', error);
        }
      }
      return BASE_STATUS_TIMES.on_the_way_to_delivered;
    case 'delivered':
      // Delivery orders end here
      return 0;
    default:
      return 0;
  }
};

/**
 * Get human-readable time estimate
 * @param {string} currentStatus - Current order status
 * @param {Object} orderData - Optional order data for calculating travel time
 * @returns {Promise<string>} Human-readable time estimate
 */
export const getTimeEstimate = async (currentStatus, orderData = null) => {
  const timeMs = await getEstimatedTimeForNextStatus(currentStatus, orderData);
  if (timeMs === 0) return null;

  const minutes = Math.ceil(timeMs / 60000);
  if (minutes < 1) return 'Less than a minute';
  if (minutes === 1) return 'About 1 minute';
  return `About ${minutes} minutes`;
};

export default {
  confirmOrder,
  startPreparing,
  markOrderReady,
  assignDriver,
  driverPickedUp,
  markOnTheWay,
  markAsDelivered,
  cancelOrder,
  autoProgressOrder,
  getEstimatedTimeForNextStatus,
  getTimeEstimate,
};

