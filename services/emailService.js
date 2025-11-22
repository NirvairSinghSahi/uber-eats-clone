// Email Service - Handles email updates and notifications
// Supports Resend API (recommended) and SendGrid API
// For production, consider using a backend service for better security

import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import axios from 'axios';
import { EMAIL_CONFIG } from '../config/api';

// Email API Configuration
const EMAIL_API = {
  RESEND: {
    apiKey: EMAIL_CONFIG.RESEND.apiKey,
    fromEmail: EMAIL_CONFIG.RESEND.fromEmail,
    baseUrl: 'https://api.resend.com',
  },
  SENDGRID: {
    apiKey: EMAIL_CONFIG.SENDGRID.apiKey,
    fromEmail: EMAIL_CONFIG.SENDGRID.fromEmail,
    baseUrl: 'https://api.sendgrid.com/v3',
  },
};

// Determine which API to use (Resend is preferred if both are configured)
const getEmailConfig = () => {
  if (EMAIL_API.RESEND.apiKey && EMAIL_API.RESEND.apiKey !== 'your-resend-api-key' && EMAIL_API.RESEND.apiKey !== null) {
    return { provider: 'RESEND', config: EMAIL_API.RESEND };
  }
  if (EMAIL_API.SENDGRID.apiKey && EMAIL_API.SENDGRID.apiKey !== 'your-sendgrid-api-key' && EMAIL_API.SENDGRID.apiKey !== null) {
    return { provider: 'SENDGRID', config: EMAIL_API.SENDGRID };
  }
  return null;
};

/**
 * Save email preferences to Firestore
 * @param {string} userId - User ID
 * @param {boolean} emailUpdates - Whether user wants email updates
 * @returns {Promise<boolean>} Success status
 */
export const saveEmailPreferences = async (userId, emailUpdates) => {
  try {
    if (!userId) {
      console.error('User ID is required');
      return false;
    }

    const userPrefsRef = doc(db, 'userPreferences', userId);
    await setDoc(userPrefsRef, {
      emailUpdates,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return true;
  } catch (error) {
    console.error('Error saving email preferences:', error);
    return false;
  }
};

/**
 * Get email preferences from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<boolean|null>} Email preferences or null if error
 */
export const getEmailPreferences = async (userId) => {
  try {
    if (!userId) {
      return null;
    }

    const userPrefsRef = doc(db, 'userPreferences', userId);
    const docSnap = await getDoc(userPrefsRef);

    if (docSnap.exists()) {
      return docSnap.data().emailUpdates || false;
    }

    return false; // Default to false if no preferences found
  } catch (error) {
    console.error('Error getting email preferences:', error);
    return null;
  }
};

/**
 * Generate HTML email template for order confirmation
 */
const generateOrderConfirmationHTML = (orderData, orderId) => {
  const itemsList = orderData.items.map(item => 
    `<tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name} x${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
  ).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #000; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Order Confirmation</h1>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Thank you for your order! We're preparing your meal now.</p>
        
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #000;">Order Details</h2>
          <p><strong>Order Number:</strong> #${orderId.substring(0, 8)}</p>
          <p><strong>Restaurant:</strong> ${orderData.items[0]?.restaurant || 'Restaurant'}</p>
          <p><strong>Delivery Address:</strong> ${orderData.deliveryAddress}</p>
          <p><strong>Payment Method:</strong> ${orderData.paymentMethod === 'cash' ? 'Cash on Delivery' : orderData.paymentMethod}</p>
        </div>

        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #000;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsList}
          </table>
        </div>

        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 5px 0;">Subtotal:</td>
              <td style="text-align: right; padding: 5px 0;">$${orderData.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;">Delivery Fee:</td>
              <td style="text-align: right; padding: 5px 0;">$${orderData.deliveryFee.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;">Tax:</td>
              <td style="text-align: right; padding: 5px 0;">$${orderData.tax.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 2px solid #000; font-weight: bold; font-size: 18px;">
              <td style="padding: 10px 0;">Total:</td>
              <td style="text-align: right; padding: 10px 0;">$${orderData.total.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <p style="margin: 0; font-size: 14px; color: #666;">
            <strong>Estimated Delivery Time:</strong> 35-45 minutes<br>
            You'll receive another email when your order is out for delivery.
          </p>
        </div>

        <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
          Questions? Contact us at support@ubereatsclone.com
        </p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate HTML email template for delivery update
 */
const generateDeliveryUpdateHTML = (orderId, status) => {
  const isDelivered = status === 'delivered';
  const title = isDelivered ? 'Order Delivered!' : 'Order Update';
  const message = isDelivered 
    ? 'Your order has been delivered. Enjoy your meal!'
    : 'Your order is on the way!';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: ${isDelivered ? '#4CAF50' : '#000'}; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">${title}</h1>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; margin-bottom: 20px;">${message}</p>
        
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p><strong>Order Number:</strong> #${orderId.substring(0, 8)}</p>
          <p><strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
        </div>

        ${isDelivered ? `
        <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #4CAF50;">
          <p style="margin: 0; font-size: 14px;">
            <strong>Thank you for ordering with us!</strong><br>
            We hope you enjoy your meal. Please rate your experience in the app.
          </p>
        </div>
        ` : ''}

        <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
          Questions? Contact us at support@ubereatsclone.com
        </p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send email using Resend API
 */
const sendEmailViaResend = async (to, subject, html, text) => {
  const config = EMAIL_API.RESEND;
  
  try {
    const response = await axios.post(
      `${config.baseUrl}/emails`,
      {
        from: config.fromEmail,
        to: [to],
        subject,
        html,
        text: text || subject,
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Resend API Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Send email using SendGrid API
 */
const sendEmailViaSendGrid = async (to, subject, html, text) => {
  const config = EMAIL_API.SENDGRID;
  
  try {
    const response = await axios.post(
      `${config.baseUrl}/mail/send`,
      {
        personalizations: [{ to: [{ email: to }] }],
        from: { email: config.fromEmail },
        subject,
        content: [
          { type: 'text/plain', value: text || subject },
          { type: 'text/html', value: html },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('SendGrid API Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Send order confirmation email
 * @param {string} userId - User ID
 * @param {string} orderId - Order ID
 * @param {object} orderData - Order data
 * @param {string} userEmail - User email address
 * @returns {Promise<boolean>} Success status
 */
export const sendOrderConfirmationEmail = async (userId, orderId, orderData, userEmail = null) => {
  try {
    // Check if user has email updates enabled
    const emailEnabled = await getEmailPreferences(userId);
    if (!emailEnabled) {
      console.log('Email updates disabled for user');
      return false;
    }

    // Get user email if not provided
    // Note: userEmail should be passed from the calling function (from user.email in Redux state)
    if (!userEmail) {
      console.error('User email is required. Please pass user.email to this function.');
      return false;
    }

    if (!userEmail) {
      console.error('User email is required to send email');
      return false;
    }

    // Get email API configuration
    const emailConfig = getEmailConfig();
    if (!emailConfig) {
      console.log('No email API configured. Email not sent.');
      return false;
    }

    // Generate email content
    const subject = `Order Confirmation - Order #${orderId.substring(0, 8)}`;
    const html = generateOrderConfirmationHTML(orderData, orderId);
    const text = `Thank you for your order! Order #${orderId.substring(0, 8)}. Total: $${orderData.total.toFixed(2)}.`;

    // Send email
    if (emailConfig.provider === 'RESEND') {
      await sendEmailViaResend(userEmail, subject, html, text);
    } else if (emailConfig.provider === 'SENDGRID') {
      await sendEmailViaSendGrid(userEmail, subject, html, text);
    }

    console.log('Order confirmation email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return false;
  }
};

/**
 * Send delivery update email
 * @param {string} userId - User ID
 * @param {string} orderId - Order ID
 * @param {string} status - Order status
 * @param {string} userEmail - User email address (optional)
 * @returns {Promise<boolean>} Success status
 */
export const sendDeliveryUpdateEmail = async (userId, orderId, status, userEmail = null) => {
  try {
    const emailEnabled = await getEmailPreferences(userId);
    if (!emailEnabled) {
      return false;
    }

    // Get user email if not provided
    // Note: userEmail should be passed from the calling function
    if (!userEmail) {
      console.error('User email is required. Please pass user.email to this function.');
      return false;
    }

    if (!userEmail) {
      console.error('User email is required to send email');
      return false;
    }

    // Get email API configuration
    const emailConfig = getEmailConfig();
    if (!emailConfig) {
      console.log('No email API configured. Email not sent.');
      return false;
    }

    // Generate email content
    const subject = status === 'delivered' 
      ? `Order Delivered - Order #${orderId.substring(0, 8)}`
      : `Order Update - Order #${orderId.substring(0, 8)}`;
    const html = generateDeliveryUpdateHTML(orderId, status);
    const text = status === 'delivered'
      ? `Your order #${orderId.substring(0, 8)} has been delivered. Enjoy your meal!`
      : `Your order #${orderId.substring(0, 8)} status: ${status}`;

    // Send email
    if (emailConfig.provider === 'RESEND') {
      await sendEmailViaResend(userEmail, subject, html, text);
    } else if (emailConfig.provider === 'SENDGRID') {
      await sendEmailViaSendGrid(userEmail, subject, html, text);
    }

    console.log('Delivery update email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending delivery update email:', error);
    return false;
  }
};

export default {
  saveEmailPreferences,
  getEmailPreferences,
  sendOrderConfirmationEmail,
  sendDeliveryUpdateEmail,
};

