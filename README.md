# Uber Eats Clone - React Native Expo App

A full-featured food delivery app clone built with React Native, Expo, Google Places API, and Firebase.

## Features

- 🔐 **User Authentication** - Firebase Authentication for sign up and login
- 📍 **Location Services** - Google Places Autocomplete for address search
- 🍔 **Restaurant Discovery** - Google Places API integration for restaurant listings
- 🛒 **Shopping Cart** - Add items, update quantities, and manage cart
- 💳 **Checkout** - Order placement with payment options
- 📱 **Modern UI** - Clean and intuitive user interface
- 🔥 **Firebase Integration** - Real-time database for orders

## Prerequisites

Before you begin, ensure you have:

- Node.js installed (v14 or higher)
- npm or yarn package manager
- Expo CLI installed globally: `npm install -g expo-cli`
- Google Places API key (with Places API and Places API (New) enabled)
- Firebase project set up
- (Optional) Yelp API key for real restaurant menu data - see [MENU_API_SETUP.md](./MENU_API_SETUP.md)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
YELP_API_KEY=your_yelp_api_key_here
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
FIREBASE_PROJECT_ID=your_firebase_project_id_here
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
FIREBASE_APP_ID=your_firebase_app_id_here
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**Notes**: 
- `YELP_API_KEY` is optional. The app will use generated menus if not provided. See [MENU_API_SETUP.md](./MENU_API_SETUP.md) for details.
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are optional. Required for email notifications. See [EMAIL_API_SETUP.md](./EMAIL_API_SETUP.md) for setup instructions.

### 3. Get API Keys

#### Google Places API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Places API
4. Create credentials (API Key)
5. Add the key to your `.env` file

#### Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Create a Firestore database
5. Get your Firebase config from Project Settings
6. Add the config values to your `.env` file

#### Email API (Optional - for email notifications)
1. Go to [Resend.com](https://resend.com) (recommended) or [SendGrid.com](https://sendgrid.com)
2. Create a free account
3. Get your API key
4. Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to your `.env` file
5. See [EMAIL_API_SETUP.md](./EMAIL_API_SETUP.md) for detailed instructions

### 4. Update Firebase Configuration

Edit `firebase.js` and replace the placeholder values with your actual Firebase configuration.

### 5. Run the App

```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## Project Structure

```
├── App.js                 # Main app component
├── app.json              # Expo configuration
├── package.json          # Dependencies
├── firebase.js           # Firebase configuration
├── config/
│   └── api.js           # API configuration
├── context/
│   ├── AuthContext.js   # Authentication context
│   └── CartContext.js   # Shopping cart context
├── navigation/
│   └── AppNavigator.js  # Navigation setup
├── screens/
│   ├── HomeScreen.js
│   ├── RestaurantListScreen.js
│   ├── RestaurantDetailScreen.js
│   ├── CartScreen.js
│   ├── CheckoutScreen.js
│   ├── LoginScreen.js
│   ├── SignupScreen.js
│   └── ProfileScreen.js
└── services/
    └── yelpService.js   # Yelp API service
```

## Features Breakdown

### Authentication
- Email/Password authentication using Firebase
- Protected routes based on authentication state
- User session management

### Restaurant Discovery
- Search restaurants by location using Google Places API
- View restaurant details, ratings, and reviews from Google Places
- Filter and sort restaurant listings

### Shopping Cart
- Add items to cart
- Update quantities
- Remove items
- Calculate totals with tax and delivery fees

### Checkout
- Review order summary
- Select delivery address
- Choose payment method (Card or Cash on Delivery)
- Place orders saved to Firebase

## Technologies Used

- **React Native** - Mobile app framework
- **Expo** - Development platform
- **React Navigation** - Navigation library
- **Firebase** - Authentication and database
- **Google Places API** - Location autocomplete and restaurant data
- **AsyncStorage** - Local storage

## Dependencies

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
| `react-native-maps` | `1.20.1` | Native maps component (if needed for future features) |

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

## Notes

- The app uses mock menu items in the restaurant detail screen. In a production app, you would fetch this data from an API or database.
- Payment processing is simulated. For production, integrate with a payment gateway like Stripe.
- Make sure to enable **Places API** and **Places API (New)** in your Google Cloud Console.
- Google Places API has a free tier with $200 credit per month, which is quite generous for development.
- Ensure your Firebase project has proper security rules configured.

## Troubleshooting

### Common Issues

1. **API Key Errors**: Make sure all API keys are correctly set in the `.env` file
2. **Firebase Connection**: Verify your Firebase configuration and that the project is properly set up
3. **Navigation Errors**: Ensure all dependencies are installed correctly
4. **Build Errors**: Clear cache with `expo start -c` and reinstall dependencies

## License

This project is for educational purposes.

