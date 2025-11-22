# Uber Eats Clone - React Native Expo App

A full-featured food delivery app clone built with React Native, Expo, Google Places API, Firebase, and Redux Toolkit. This project demonstrates a production-ready mobile application with authentication, restaurant discovery, order management, delivery tracking, and more.

## 🚀 Features

### Authentication & User Management
- 🔐 **Email/Password Authentication** - Secure sign up and login using Firebase Authentication
- 🔑 **Password Recovery** - Forgot password functionality with email reset
- 👤 **User Profiles** - View and edit user profile information
- 🔒 **Protected Routes** - Authentication-based navigation and route protection
- 💾 **Session Persistence** - Automatic login state management with AsyncStorage

### Location & Address Management
- 📍 **Google Places Autocomplete** - Worldwide address search and autocomplete
- 💾 **Saved Addresses** - Save and manage multiple delivery addresses per user
- 🌍 **Worldwide Support** - Search and select addresses from anywhere in the world
- 📌 **Address Persistence** - Addresses saved to Firestore and synced across devices

### Restaurant Discovery
- 🍔 **Restaurant Search** - Find restaurants by location using Google Places API
- 📋 **Restaurant Listings** - Browse restaurants with ratings, reviews, and categories
- 🏆 **Restaurant Details** - View detailed information, reviews, and menu items
- ⭐ **Ratings & Reviews** - Display restaurant ratings and customer reviews from Google Places
- 📍 **Distance Calculation** - Show distance from delivery address to restaurants

### Menu & Ordering
- 🍽️ **Dynamic Menus** - Real menu items from Spoonacular API or generated menus
- 🛒 **Shopping Cart** - Add, update quantities, and remove items with swipe gestures
- 🚫 **Single Restaurant Cart** - Cart limited to items from one restaurant at a time
- 💰 **Price Calculation** - Automatic calculation of subtotal, tax, and delivery fees
- ✨ **Animated UI** - Smooth animations for cart items and menu interactions

### Checkout & Payment
- 💳 **Order Review** - Review order summary before checkout
- 📍 **Delivery Address Selection** - Choose from saved addresses or add new
- 💵 **Cash on Delivery** - Payment method (credit/debit card option removed)
- 📝 **Order Placement** - Orders saved to Firestore with full order details

### Order Management
- 📦 **Order History** - View all past orders with status tracking
- 🚚 **Delivery Tracking** - Real-time delivery status updates (Pending → Delivered)
- ⏱️ **Delivery Time Calculation** - Accurate delivery time using Google Distance Matrix API
- 📊 **Order Status** - Track orders from placement to delivery

### Favorites & Preferences
- ❤️ **Favorite Restaurants** - Save favorite restaurants for quick access
- ⚙️ **User Settings** - Manage app preferences and notifications
- 📧 **Email Notifications** - Optional email updates for orders (Resend/SendGrid)
- 🔔 **Push Notifications** - Local notifications for order updates

### Additional Features
- 🎨 **Modern UI/UX** - Clean, intuitive interface with animations
- 📱 **Responsive Design** - Optimized for iOS and Android
- 🌙 **Safe Area Support** - Proper handling of device notches and safe areas
- 🎭 **Animations & Modals** - Smooth transitions and animated modal components
- 📄 **Legal Pages** - Terms of Service and Privacy Policy screens
- ❓ **Help Center** - Support and help information

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** installed (v14 or higher)
- **npm** or **yarn** package manager
- **Expo CLI** installed globally: `npm install -g expo-cli`
- **Google Places API** key (with Places API and Places API (New) enabled)
- **Google Distance Matrix API** key (optional, for accurate delivery times)
- **Firebase** project set up with Authentication and Firestore
- **(Optional) Spoonacular API** key (aliased as YELP_API_KEY) for real menu data
- **(Optional) Resend or SendGrid** API key for email notifications

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/NirvairSinghSahi/uber-eats-clone.git
cd uber-eats-clone
```

### 2. Install Dependencies

```bash
npm install
```

Or if you prefer yarn:

```bash
yarn install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory (use `.env.example` as a template):

```env
# Google Places API Configuration (Required)
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# Google Distance Matrix API (Optional - for accurate delivery times)
GOOGLE_DISTANCE_MATRIX_API_KEY=your_google_distance_matrix_api_key_here

# Firebase Configuration (Required)
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id_here
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
FIREBASE_APP_ID=your_firebase_app_id_here

# Spoonacular API (Optional - for real menu data, aliased as YELP_API_KEY)
YELP_API_KEY=your_spoonacular_api_key_here

# Email Service Configuration (Optional)
# Resend API (Recommended)
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev

# SendGrid API (Alternative)
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=test@example.com
```

**Notes**: 
- `GOOGLE_PLACES_API_KEY` is **required** for the app to function
- `GOOGLE_DISTANCE_MATRIX_API_KEY` is optional - app will use estimated delivery times if not provided
- `YELP_API_KEY` (Spoonacular) is optional - app will use generated menus if not provided
- `RESEND_API_KEY` or `SENDGRID_API_KEY` are optional - required only for email notifications

### 4. Get API Keys

#### Google Places API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Places API** and **Places API (New)**
4. Create credentials (API Key)
5. (Optional) Enable **Distance Matrix API** for accurate delivery times
6. Add the keys to your `.env` file

#### Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** (Email/Password method)
4. Create a **Firestore Database** (start in test mode, then configure security rules)
5. Get your Firebase config from Project Settings → General → Your apps
6. Add the config values to your `.env` file

#### Spoonacular API (Optional - for Menu Data)
1. Go to [Spoonacular API](https://spoonacular.com/food-api)
2. Sign up for a free account
3. Get your API key
4. Add `YELP_API_KEY=your_spoonacular_key` to your `.env` file

#### Email API (Optional - for Email Notifications)
1. Go to [Resend.com](https://resend.com) (recommended) or [SendGrid.com](https://sendgrid.com)
2. Create a free account
3. Get your API key
4. Add the keys to your `.env` file

### 5. Configure Firebase Security Rules

Update your Firestore security rules to allow authenticated users to read/write their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Orders - users can only access their own orders
    match /orders/{orderId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Saved Addresses - users can only access their own addresses
    match /savedAddresses/{addressId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // User Preferences - users can only access their own preferences
    match /userPreferences/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 6. Run the App

```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## 📁 Project Structure

```
uber-eats-clone/
├── App.js                          # Main app component with auth listener
├── app.json                        # Expo configuration
├── package.json                    # Dependencies and scripts
├── babel.config.js                 # Babel configuration
├── firebase.js                     # Firebase initialization
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
│
├── assets/                         # Static assets
│   └── README.md
│
├── components/                     # Reusable components
│   ├── AnimatedCard.js            # Animated card with swipe gestures
│   ├── AnimatedModal.js           # Reusable animated modal
│   └── LoadingScreen.js           # Loading screen component
│
├── config/                        # Configuration files
│   └── api.js                     # API configuration and validation
│
├── context/                        # React Context (legacy, now using Redux)
│   ├── AuthContext.js
│   └── CartContext.js
│
├── navigation/                    # Navigation setup
│   └── AppNavigator.js            # Main navigation configuration
│
├── screens/                        # App screens
│   ├── HomeScreen.js              # Home screen with address search
│   ├── RestaurantListScreen.js    # Restaurant listings
│   ├── RestaurantDetailScreen.js  # Restaurant details and menu
│   ├── CartScreen.js              # Shopping cart
│   ├── CheckoutScreen.js          # Checkout process
│   ├── DeliveryTrackingScreen.js  # Order delivery tracking
│   ├── LoginScreen.js             # User login
│   ├── SignupScreen.js            # User registration
│   ├── ForgotPasswordScreen.js    # Password recovery
│   ├── ProfileScreen.js           # User profile
│   ├── EditProfileScreen.js       # Edit user profile
│   ├── OrderHistoryScreen.js      # Past orders
│   ├── FavoritesScreen.js         # Favorite restaurants
│   ├── SavedAddressesScreen.js    # Manage saved addresses
│   ├── SettingsScreen.js          # App settings
│   ├── HelpCenterScreen.js        # Help and support
│   ├── TermsOfServiceScreen.js    # Terms of service
│   └── PrivacyPolicyScreen.js     # Privacy policy
│
├── services/                       # API and service integrations
│   ├── googlePlacesService.js     # Google Places API integration
│   ├── menuApiService.js          # Spoonacular API for menu data
│   ├── menuService.js             # Menu generation fallback
│   ├── deliveryTimeService.js    # Google Distance Matrix API
│   ├── emailService.js            # Email notifications (Resend/SendGrid)
│   └── notificationService.js    # Push notifications
│
├── store/                          # Redux store configuration
│   ├── store.js                   # Redux store setup
│   ├── hooks.js                   # Typed Redux hooks
│   └── slices/                    # Redux slices
│       ├── authSlice.js           # Authentication state
│       ├── cartSlice.js           # Shopping cart state
│       ├── favoritesSlice.js      # Favorites state
│       ├── savedAddressesSlice.js # Saved addresses state
│       ├── settingsSlice.js       # App settings state
│       └── locationSlice.js       # Location state
│
├── types/                          # TypeScript type definitions
│   └── env.d.ts                   # Environment variable types
│
└── utils/                          # Utility functions
    ├── animations.js               # Animation helpers
    └── suppressNotificationsWarning.js  # Android Expo Go warning suppression
```

## 🎯 Features Breakdown

### Authentication System
- **Email/Password Authentication** using Firebase Authentication
- **Password Recovery** with email reset link
- **Session Management** with persistent login state
- **Protected Routes** - automatic redirect to login if not authenticated
- **User Profile Management** - view and edit user information

### Restaurant Discovery
- **Location-Based Search** - find restaurants near delivery address
- **Google Places Integration** - real restaurant data, ratings, and reviews
- **Restaurant Details** - comprehensive information including hours, location, categories
- **Menu Display** - dynamic menus from Spoonacular API or generated menus
- **Distance Calculation** - show distance from delivery address

### Shopping Cart
- **Add to Cart** - add menu items with quantity selection
- **Cart Management** - update quantities, remove items
- **Swipe to Delete** - gesture-based item removal
- **Single Restaurant Restriction** - cart limited to one restaurant at a time
- **Price Calculation** - automatic subtotal, tax (10%), and delivery fee ($2.99)

### Order Management
- **Order Placement** - save orders to Firestore with full details
- **Order History** - view all past orders with status
- **Delivery Tracking** - real-time order status updates
- **Delivery Time** - accurate calculation using Google Distance Matrix API
- **Order Status** - track from "Pending" to "Delivered"

### Address Management
- **Address Autocomplete** - Google Places Autocomplete for worldwide addresses
- **Save Addresses** - save multiple delivery addresses per user
- **Address Persistence** - addresses saved to Firestore and synced across devices
- **Address Selection** - choose from saved addresses or add new

### Favorites & Preferences
- **Favorite Restaurants** - save and manage favorite restaurants
- **User Settings** - manage app preferences
- **Notification Settings** - control push and email notifications
- **Email Preferences** - opt-in/opt-out of email updates

### Notifications
- **Push Notifications** - local notifications for order updates
- **Email Notifications** - order confirmations and delivery updates (optional)
- **Notification Preferences** - user-controlled notification settings

## 🛠️ Technologies Used

### Core Framework
- **React Native** `0.81.5` - Mobile app framework
- **React** `19.1.0` - UI library
- **Expo** `~54.0.0` - Development platform and SDK

### State Management
- **Redux Toolkit** `^2.10.1` - State management
- **React Redux** `^9.2.0` - React bindings for Redux

### Navigation
- **React Navigation** `^6.1.18` - Navigation library
- **Stack Navigator** - Screen transitions
- **Bottom Tab Navigator** - Main app navigation

### Backend & APIs
- **Firebase** `^11.1.0` - Authentication, Firestore, Storage
- **Google Places API** - Restaurant discovery and address autocomplete
- **Google Distance Matrix API** - Delivery time calculation
- **Spoonacular API** - Real restaurant menu data
- **Resend/SendGrid** - Email notifications

### UI/UX
- **Expo Vector Icons** - Icon library
- **React Native Modal** - Animated modals
- **React Native Gesture Handler** - Gesture recognition
- **React Native Safe Area Context** - Safe area handling

### Storage
- **AsyncStorage** - Local data persistence
- **Firestore** - Cloud database

### Development Tools
- **Babel** - JavaScript compiler
- **TypeScript** - Type checking (optional)

## 📦 Dependencies

This project uses the following dependencies and modules:

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | `19.1.0` | React library for building user interfaces |
| `react-native` | `0.81.5` | Mobile app framework for iOS and Android |
| `expo` | `~54.0.0` | Expo SDK for React Native development |

### Navigation Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@react-navigation/native` | `^6.1.18` | Core navigation library for React Native |
| `@react-navigation/stack` | `^6.4.1` | Stack navigator for screen transitions |
| `@react-navigation/bottom-tabs` | `^6.6.1` | Bottom tab navigator for main navigation |
| `react-native-screens` | `~4.16.0` | Native screen components for navigation |
| `react-native-safe-area-context` | `~5.6.0` | Safe area handling for devices with notches |
| `react-native-gesture-handler` | `~2.28.0` | Native gesture handling for navigation |

### State Management Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@reduxjs/toolkit` | `^2.10.1` | Redux Toolkit for state management |
| `react-redux` | `^9.2.0` | React bindings for Redux |

### Firebase Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `firebase` | `^11.1.0` | Firebase SDK for authentication, Firestore, and storage |

### Location & Maps Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `expo-location` | `~19.0.7` | Access device location services |
| `react-native-google-places-autocomplete` | `^2.5.1` | Google Places Autocomplete component |
| `react-native-maps` | `1.20.1` | Native maps component (for future features) |

### UI/UX Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@expo/vector-icons` | `^15.0.3` | Icon library (Ionicons, MaterialIcons, etc.) |
| `react-native-vector-icons` | `^10.2.0` | Additional vector icons support |
| `react-native-modal` | `^14.0.0-rc.1` | Animated modal components |
| `expo-status-bar` | `~3.0.8` | Status bar component for Expo |

### Storage & Persistence Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@react-native-async-storage/async-storage` | `2.2.0` | AsyncStorage for local data persistence |

### API & HTTP Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `axios` | `^1.7.9` | HTTP client for API requests |

### Notifications Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `expo-notifications` | `~0.32.13` | Push and local notifications |

### Configuration Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react-native-dotenv` | `^3.4.11` | Environment variables loader for React Native |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@babel/core` | `^7.20.0` | Babel compiler core |
| `babel-preset-expo` | `^54.0.7` | Babel preset for Expo projects |
| `@types/react` | `~19.1.10` | TypeScript type definitions for React |
| `typescript` | `^5.1.3` | TypeScript compiler (optional, for type checking) |

### Installation

To install all dependencies, run:

```bash
npm install
```

Or if you prefer yarn:

```bash
yarn install
```

### Peer Dependencies

The following packages are peer dependencies (automatically installed with the above packages):

- **React Navigation** requires `react-native-screens` and `react-native-safe-area-context`
- **Expo** manages its own peer dependencies through the Expo SDK
- **Firebase** requires React Native compatible versions
- **React Native Maps** may require additional native configuration

### Version Compatibility

This project is built with:
- **Expo SDK 54**
- **React 19.1.0**
- **React Native 0.81.5**

Make sure your Node.js version is **v14 or higher** for compatibility.

## 🚨 Important Notes

### API Keys
- **Google Places API** is required for the app to function
- **Firebase** configuration is required for authentication and database
- **Google Distance Matrix API** is optional - app uses estimated times if not provided
- **Spoonacular API** (YELP_API_KEY) is optional - app generates menus if not provided
- **Email APIs** (Resend/SendGrid) are optional - only needed for email notifications

### Payment Processing
- Currently supports **Cash on Delivery** only
- Credit/Debit card payment option has been removed
- For production, integrate with a payment gateway like Stripe

### Menu Data
- App uses **Spoonacular API** for real menu data (aliased as YELP_API_KEY)
- Falls back to **generated menus** based on restaurant categories if API key is not provided
- Menu items are dynamically generated with realistic names, descriptions, and prices

### Notifications
- **Local notifications** work in Expo Go on both iOS and Android
- **Push notifications** require a development build (not supported in Expo Go SDK 53+)
- Android push notification warnings in Expo Go are suppressed (local notifications still work)

### Firebase Security Rules
- Ensure your Firestore security rules are properly configured
- Users can only access their own orders, addresses, and preferences
- See the security rules example in the setup instructions

## 🐛 Troubleshooting

### Common Issues

1. **API Key Errors**
   - Make sure all required API keys are correctly set in the `.env` file
   - Verify API keys are not using placeholder values
   - Check that APIs are enabled in Google Cloud Console

2. **Firebase Connection Issues**
   - Verify your Firebase configuration in `.env` file
   - Ensure Firestore database is created and initialized
   - Check Firebase security rules are properly configured
   - Verify Authentication is enabled with Email/Password method

3. **Navigation Errors**
   - Clear cache: `expo start -c`
   - Reinstall dependencies: `rm -rf node_modules && npm install`
   - Ensure all navigation dependencies are installed

4. **Build Errors**
   - Clear Expo cache: `expo start -c`
   - Clear Metro bundler cache: `npx react-native start --reset-cache`
   - Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

5. **Environment Variables Not Loading**
   - Ensure `.env` file is in the root directory
   - Restart the Expo development server after changing `.env`
   - Check that `react-native-dotenv` is properly configured in `babel.config.js`

6. **Android Push Notification Warnings**
   - These warnings are expected in Expo Go and are automatically suppressed
   - Local notifications work fine in Expo Go
   - For push notifications, use a development build

7. **Menu Items Not Loading**
   - Check if `YELP_API_KEY` (Spoonacular) is set in `.env`
   - App will use generated menus if API key is missing
   - Verify Spoonacular API key is valid and has remaining quota

## 📝 License

This project is for educational purposes.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/NirvairSinghSahi/uber-eats-clone/issues).

## 👤 Author

**Nirvair Singh Sahi**

- GitHub: [@NirvairSinghSahi](https://github.com/NirvairSinghSahi)

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) for the amazing development platform
- [React Navigation](https://reactnavigation.org/) for navigation solutions
- [Firebase](https://firebase.google.com/) for backend services
- [Google Places API](https://developers.google.com/maps/documentation/places) for location services
- [Spoonacular API](https://spoonacular.com/food-api) for menu data
