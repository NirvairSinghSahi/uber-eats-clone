# Uber Eats Clone - React Native Expo App

A streamlined food delivery app clone built with React Native, Expo, Google Places API, Yelp API (Spoonacular), and Firebase. This project demonstrates a simplified food-ordering experience that allows users to search restaurants, browse dishes, and place orders through an intuitive React Native interface.

## 🎯 Project Overview

The app solves the problem of complex food-delivery platforms by offering a streamlined flow powered by multiple external services. Users begin on a Home screen where they can log in or continue as guests, after which they use a Google Places Autocomplete search bar to enter a city or restaurant name. Based on the selected location, the Restaurant List screen fetches real-time restaurant data from the Yelp API (Spoonacular), displaying items such as names, ratings, categories, and price indicators. When a restaurant is selected, the Restaurant Details screen retrieves dish information and allows users to add items to a cart managed through Redux. The Cart screen shows selected dishes, quantities, and the total price, and once the order is confirmed, the app stores the order data—including user ID, items, total, and timestamp—through Firebase.

## ✨ Features

### Core Features
- 🔐 **User Authentication** - Simple email/password login and signup using Firebase Authentication
- 📍 **Location Search** - Google Places Autocomplete for searching cities or restaurant names
- 🍔 **Restaurant Discovery** - Real-time restaurant data from Spoonacular API (aliased as Yelp API)
- 📋 **Restaurant Details** - View restaurant information, ratings, reviews, and menu items
- 🛒 **Shopping Cart** - Redux-powered cart to add, update quantities, and manage items
- 💳 **Order Placement** - Place orders with order details saved to Firebase Firestore
- ✅ **Order Confirmation** - Confirmation screen showing saved order details after placement

### Design
- 🎨 **Minimalistic UI** - Clean design inspired by Uber Eats and DoorDash
- 📱 **White Cards** - Clean card-based layout
- 🖼️ **Rounded Images** - Modern image presentation
- 🎯 **Clean Icons** - Vector icons for intuitive navigation
- 🔄 **Smooth Navigation** - React Navigation for seamless screen transitions

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** installed (v14 or higher)
- **npm** or **yarn** package manager
- **Expo CLI** installed globally: `npm install -g expo-cli`
- **Google Places API** key (with Places API enabled)
- **Firebase** project set up with Authentication and Firestore
- **(Optional) Spoonacular API** key (aliased as YELP_API_KEY) for real menu data

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

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Google Places API Configuration (Required)
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# Firebase Configuration (Required)
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id_here
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
FIREBASE_APP_ID=your_firebase_app_id_here

# Spoonacular API (Optional - for real menu data, aliased as YELP_API_KEY)
YELP_API_KEY=your_spoonacular_api_key_here
```

**Notes**: 
- `GOOGLE_PLACES_API_KEY` is **required** for the app to function
- `YELP_API_KEY` (Spoonacular) is optional - app will use generated menus if not provided

### 4. Get API Keys

#### Google Places API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Places API** and **Places API (New)**
4. Create credentials (API Key)
5. Add the key to your `.env` file

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
├── App.js                          # Main app component
├── app.json                        # Expo configuration
├── package.json                    # Dependencies and scripts
├── babel.config.js                 # Babel configuration
├── firebase.js                     # Firebase initialization
│
├── components/                     # Reusable components
│   └── LoadingScreen.js           # Loading screen component
│
├── config/                        # Configuration files
│   └── api.js                     # API configuration
│
├── navigation/                    # Navigation setup
│   └── AppNavigator.js           # Main navigation configuration
│
├── screens/                        # App screens
│   ├── HomeScreen.js              # Home screen with address search
│   ├── RestaurantListScreen.js    # Restaurant listings
│   ├── RestaurantDetailScreen.js  # Restaurant details and menu
│   ├── CartScreen.js              # Shopping cart
│   ├── CheckoutScreen.js          # Checkout and order confirmation
│   ├── LoginScreen.js             # User login
│   └── SignupScreen.js            # User registration
│
├── services/                       # API and service integrations
│   ├── googlePlacesService.js     # Google Places API integration
│   ├── menuApiService.js          # Spoonacular API for menu data
│   └── menuService.js             # Menu generation fallback
│
├── store/                          # Redux store configuration
│   ├── store.js                   # Redux store setup
│   ├── hooks.js                   # Typed Redux hooks
│   └── slices/                    # Redux slices
│       ├── authSlice.js           # Authentication state
│       ├── cartSlice.js           # Shopping cart state
│       └── locationSlice.js       # Location state
│
└── utils/                          # Utility functions
    └── suppressNotificationsWarning.js  # Android Expo Go warning suppression
```

## 🎯 Features Breakdown

### Authentication
- **Email/Password Authentication** using Firebase Authentication
- **Simple Login/Signup** - No complex profile management
- **Session Management** with persistent login state
- **Protected Routes** - automatic redirect to login if not authenticated

### Restaurant Discovery
- **Google Places Autocomplete** - Search for cities or restaurant names
- **Restaurant Listings** - Browse restaurants with ratings, reviews, and categories
- **Restaurant Details** - View comprehensive restaurant information and menu items
- **Menu Display** - Dynamic menus from Spoonacular API or generated menus

### Shopping Cart
- **Add to Cart** - Add menu items with quantity selection
- **Cart Management** - Update quantities, remove items
- **Price Calculation** - Automatic subtotal, tax (10%), and delivery fee ($2.99)
- **Single Restaurant Restriction** - Cart limited to one restaurant at a time

### Order Management
- **Order Placement** - Save orders to Firestore with full details (user ID, items, total, timestamp)
- **Order Confirmation** - Confirmation screen showing saved order details after placement

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
- **Bottom Tab Navigator** - Main app navigation (Home and Cart tabs)

### Backend & APIs
- **Firebase** `^11.1.0` - Authentication and Firestore
- **Google Places API** - Restaurant discovery and address autocomplete
- **Spoonacular API** - Real restaurant menu data (aliased as YELP_API_KEY)

### UI/UX
- **Expo Vector Icons** - Icon library
- **React Native Gesture Handler** - Gesture recognition
- **React Native Safe Area Context** - Safe area handling

### Storage
- **AsyncStorage** - Local data persistence
- **Firestore** - Cloud database for orders

## 📦 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | `19.1.0` | React library |
| `react-native` | `0.81.5` | Mobile app framework |
| `expo` | `~54.0.0` | Expo SDK |
| `@reduxjs/toolkit` | `^2.10.1` | State management |
| `react-redux` | `^9.2.0` | Redux bindings |
| `@react-navigation/native` | `^6.1.18` | Navigation |
| `@react-navigation/stack` | `^6.4.1` | Stack navigator |
| `@react-navigation/bottom-tabs` | `^6.6.1` | Bottom tab navigator |
| `firebase` | `^11.1.0` | Firebase SDK |
| `react-native-google-places-autocomplete` | `^2.5.1` | Google Places Autocomplete |
| `axios` | `^1.7.9` | HTTP client |
| `@react-native-async-storage/async-storage` | `2.2.0` | Local storage |

## 🚨 Important Notes

### API Keys
- **Google Places API** is required for the app to function
- **Firebase** configuration is required for authentication and database
- **Spoonacular API** (YELP_API_KEY) is optional - app generates menus if not provided

### Payment Processing
- Currently supports **Cash on Delivery** only
- Payment processing is simulated

### Menu Data
- App uses **Spoonacular API** for real menu data (aliased as YELP_API_KEY)
- Falls back to **generated menus** based on restaurant categories if API key is not provided

### Firebase Security Rules
- Ensure your Firestore security rules are properly configured
- Users can only access their own orders

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

4. **Environment Variables Not Loading**
   - Ensure `.env` file is in the root directory
   - Restart the Expo development server after changing `.env`

## 📝 License

This project is for educational purposes.

## 👤 Author

**Nirvair Singh Sahi**

- GitHub: [@NirvairSinghSahi](https://github.com/NirvairSinghSahi)

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) for the amazing development platform
- [React Navigation](https://reactnavigation.org/) for navigation solutions
- [Firebase](https://firebase.google.com/) for backend services
- [Google Places API](https://developers.google.com/maps/documentation/places) for location services
- [Spoonacular API](https://spoonacular.com/food-api) for menu data
