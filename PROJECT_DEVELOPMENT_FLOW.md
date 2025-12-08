# How I Built the Uber Eats Clone - Development Flow

## Introduction

This document explains the logical development flow of building this React Native food delivery app. It's written from the perspective of a developer thinking through each step, not just a technical code walkthrough.

---

## Phase 1: Project Foundation (Setting Up the Basics)

### Step 1: Initializing the Project
**Files created:** `App.js` (auto-generated), `package.json` (auto-generated)

**What I did first:**
- Created a new Expo project using `npx create-expo-app`
- This gave me the basic React Native structure with `App.js` as the entry point
- Installed core dependencies: React, React Native, Expo

**Why this first?**
- You need a working project before you can build anything
- Expo handles all the native configuration, so I can focus on code

### Step 2: Installing Core Dependencies
**Files modified:** `package.json`

**What I added:**
- `@react-navigation/native` and related packages (for screen navigation)
- `@reduxjs/toolkit` and `react-redux` (for state management)
- `firebase` (for authentication and database)
- `react-native-google-places-autocomplete` (for address search)
- `axios` (for API calls)

**Note:** This project is built entirely in **JavaScript** (not TypeScript). All code files use `.js` extension. The `types/env.d.ts` file is just for IDE autocomplete support and doesn't affect the actual code.

**Why this order?**
- These are the foundation libraries I'll use throughout the app
- Better to install them early so I can import them as I build

### Step 3: Setting Up Environment Variables
**Files created:** `.env`, `config/api.js`
**Files modified:** `babel.config.js` (to add react-native-dotenv plugin)

**What I created:**
- Created `.env` file for API keys
- Created `config/api.js` to centralize API configuration
- Set up `react-native-dotenv` to load environment variables

**Why this early?**
- I need API keys for Firebase and Google Places before I can test anything
- Centralizing config makes it easier to manage later

---

## Phase 2: Backend Setup (Firebase Configuration)

### Step 4: Firebase Initialization
**File created:** `firebase.js`

**My thought process:**
1. "I need Firebase for authentication and storing orders"
2. "Let me create a firebase.js file to initialize everything"
3. "I'll import Firebase modules and set up auth, firestore, and storage"
4. "I should add error handling in case config is missing"

**What I did in `firebase.js`:**
- Imported Firebase modules (auth, firestore, storage)
- Created firebaseConfig object using environment variables
- Initialized Firebase app
- Set up auth with AsyncStorage persistence (so users stay logged in)
- Exported auth, db, and storage for use throughout the app
- Added validation to catch missing config early

**Why this before UI?**
- Can't build login screens without Firebase auth ready
- Need to know authentication works before building user flows

---

## Phase 3: State Management (Redux Setup)

### Step 5: Redux Store Configuration
**File created:** `store/store.js`

**My thought process:**
1. "I need to manage user authentication state globally"
2. "I also need cart state that multiple screens can access"
3. "Redux Toolkit is perfect for this - it's simpler than plain Redux"
4. "Let me set up the store with both auth and cart reducers"

**What I did in `store/store.js`:**
- Created Redux store using configureStore
- Added authReducer and cartReducer
- Configured middleware to handle serialization (for Firebase data)

**Why before building screens?**
- Screens will need to read/write to Redux state
- Better to have the store ready so I can connect components as I build them

### Step 6: Authentication Slice
**File created:** `store/slices/authSlice.js`

**My thought process:**
1. "I need to track if user is logged in, their info, loading state, and errors"
2. "I'll create actions for login, signup, logout"
3. "I should use async thunks since Firebase auth is asynchronous"
4. "I need to persist auth state so users don't have to login every time"

**What I did in `store/slices/authSlice.js`:**
- Created initial state: user (null), loading (false), error (null)
- Built reducers: setUser, setLoading, setError, clearError, logoutUser, setGuestUser
- Created async thunks:
  - `login`: Signs in with email/password, updates state
  - `signup`: Creates account, signs in automatically
  - `logout`: Signs out, clears state
  - `initializeAuth`: Listens for auth state changes (for persistence)
- Added error handling with user-friendly messages

**Why this before login screen?**
- Login screen needs these Redux actions to work
- Can't test login without the Redux logic ready

### Step 7: Cart Slice
**File created:** `store/slices/cartSlice.js`

**My thought process:**
1. "Users need to add items to cart from restaurant detail screen"
2. "Cart screen needs to show items, update quantities, calculate totals"
3. "Checkout needs cart items and delivery address"
4. "I should prevent mixing items from different restaurants"

**What I did in `store/slices/cartSlice.js`:**
- Created state: items (array), currentRestaurantId (to track which restaurant)
- Built reducers: addToCart, removeFromCart, updateQuantity, clearCart, setDeliveryAddress
- Added selectors: selectCartItems, selectCartTotal, selectCartItemCount, selectDeliveryAddress
- Implemented logic to clear cart when switching restaurants

**Why before cart screen?**
- Cart screen will use these actions and selectors
- Restaurant detail screen needs addToCart action

### Step 8: Redux Hooks
**File created:** `store/hooks.js`

**My thought process:**
1. "I'll be using Redux in many components"
2. "Custom hooks are cleaner than using useDispatch and useSelector directly everywhere"
3. "Let me create wrapper hooks for consistency"

**What I did in `store/hooks.js`:**
- Created useAppDispatch and useAppSelector hooks
- These are simple wrappers around the Redux hooks
- Makes Redux usage consistent across all components

**Why this helper?**
- Makes Redux usage consistent across all components
- Cleaner code than using hooks directly
- Easy to modify later if needed

---

## Phase 4: Navigation Structure

### Step 9: Navigation Setup
**File created:** `navigation/AppNavigator.js`

**My thought process:**
1. "I need two main flows: auth (login/signup) and main app (home/cart)"
2. "Main app should have bottom tabs for Home and Cart"
3. "Each tab needs its own stack for nested screens"
4. "I should show auth screens if user is null, main app if logged in"

**What I did in `navigation/AppNavigator.js`:**
- Created Stack Navigator for auth screens (Login, Signup)
- Created HomeStack with: Home, RestaurantList, RestaurantDetail, Checkout
- Created CartStack with: Cart, Checkout
- Created MainTabs with Home and Cart tabs
- Added cart badge to show item count
- Conditional rendering: show auth stack if no user, main tabs if logged in
- Added LoadingScreen while checking auth state

**Why before building screens?**
- Screens need to know how to navigate to each other
- Navigation structure determines screen relationships

---

## Phase 5: Authentication Screens

### Step 10: Loading Screen Component
**File created:** `components/LoadingScreen.js`

**My thought process:**
1. "While checking if user is logged in, I should show a loading screen"
2. "Simple spinner is enough - users won't wait long"

**What I did in `components/LoadingScreen.js`:**
- Created simple component with ActivityIndicator
- Centered it on screen with basic styling

**Why this first?**
- Navigation needs this while checking auth state
- Simple component, good warm-up before complex screens

### Step 11: Login Screen
**File created:** `screens/LoginScreen.js`

**My thought process:**
1. "Users need email and password inputs"
2. "I should validate email format before submitting"
3. "Show loading state while logging in"
4. "Display friendly error messages"
5. "Add 'Continue as Guest' option"
6. "Link to signup screen for new users"

**What I did step-by-step in `screens/LoginScreen.js`:**
1. **Imports**: React Native components, navigation, Redux hooks, auth actions
2. **State**: email, password (local state for inputs)
3. **Redux**: Get loading and error from store
4. **Validation**: Check email format with regex
5. **handleLogin**: 
   - Clear previous errors
   - Validate inputs
   - Dispatch login thunk
   - Handle success/error with alerts
6. **handleContinueAsGuest**: Dispatch setGuestUser action
7. **UI**: 
   - Title and subtitle
   - Email input
   - Password input (secure)
   - Sign In button (disabled when loading)
   - Link to signup
   - Guest button
8. **Styles**: Clean, minimalist design matching Uber Eats

**Why this order?**
- Login is the entry point for authenticated users
- Need this working before building main app features

### Step 12: Signup Screen
**File created:** `screens/SignupScreen.js`

**My thought process:**
1. "Similar to login but need name, email, password, confirm password"
2. "Validate password match before submitting"
3. "Password should be at least 6 characters"
4. "Clear fields on specific errors (email error clears email, password error clears passwords)"

**What I did step-by-step in `screens/SignupScreen.js`:**
1. **Imports**: Same as login, plus signup action
2. **State**: name, email, password, confirmPassword, emailError, passwordError
3. **Validation**: 
   - Check all fields filled
   - Validate email format
   - Check password length (min 6)
   - Check password match
4. **handleSignup**:
   - Validate everything
   - Dispatch signup thunk
   - Handle success/error
   - Clear specific fields based on error type
5. **UI**: Four inputs, signup button, link to login
6. **Styles**: Consistent with login screen

**Why after login?**
- Signup is secondary to login
- Can reuse similar patterns from login screen

---

## Phase 6: Main App Entry Point

### Step 13: App.js Setup
**File modified:** `App.js`

**My thought process:**
1. "This is the root component - needs to wrap everything in Redux Provider"
2. "Should initialize auth listener on mount"
3. "Need SafeAreaProvider for proper screen spacing"
4. "AppNavigator handles all routing"

**What I did in `App.js`:**
1. **Imports**: React, Redux Provider, SafeAreaProvider, store, auth actions, AppNavigator
2. **AuthListener component**: 
   - Dispatches initializeAuth on mount
   - Sets up Firebase auth state listener
   - Cleans up on unmount
3. **App component**:
   - Wraps everything in Redux Provider
   - Adds SafeAreaProvider
   - Renders AuthListener and AppNavigator
   - Sets status bar style

**Why this structure?**
- Redux Provider must wrap everything that uses Redux
- Auth listener needs to run at app level
- AppNavigator handles all routing logic

---

## Phase 7: API Services (Backend Integration)

### Step 14: Google Places Service
**File created:** `services/googlePlacesService.js`

**My thought process:**
1. "I need to search for restaurants by location"
2. "Google Places API can search by text (city name) or coordinates"
3. "I should transform the data to a consistent format"
4. "Need to get restaurant details and photos"

**What I did step-by-step in `services/googlePlacesService.js`:**
1. **Imports**: axios, API config
2. **Helper function**: getPhotoUrl (constructs photo URL from reference)
3. **searchRestaurants**: 
   - Takes location string (city name)
   - Calls Google Places Text Search API
   - Transforms results to match Yelp format (for compatibility)
   - Returns array of restaurant objects
4. **searchRestaurantsNearby**:
   - Takes latitude/longitude
   - Calls Nearby Search API
   - Same transformation
5. **getRestaurantDetails**:
   - Takes place_id
   - Gets full details (hours, address, etc.)
   - Returns detailed restaurant object

**Why before home screen?**
- Home screen needs this to search restaurants
- Better to have API logic separate from UI

### Step 15: Menu Service
**File created:** `services/menuService.js`

**My thought process:**
1. "Restaurants need menu items"
2. "I can generate menus based on restaurant category"
3. "Different cuisines should have different menu templates"
4. "Fallback if API doesn't work"

**What I did in `services/menuService.js`:**
1. **Menu templates**: Created templates for different cuisines (pizza, italian, chinese, etc.)
2. **getMenuType function**: Analyzes restaurant name/categories to determine cuisine type
3. **getRestaurantMenu function**: 
   - Determines menu type
   - Returns appropriate menu template
   - Falls back to default menu

**Why this?**
- Not all restaurants have API menu data
- Generated menus ensure every restaurant has items to display

### Step 16: Menu API Service
**File created:** `services/menuApiService.js`

**My thought process:**
1. "I should try to get real menu data from API first"
2. "Spoonacular API has menu items"
3. "If API fails, fall back to generated menus"
4. "Try restaurant name first, then cuisine type"

**What I did in `services/menuApiService.js`:**
1. **searchMenuItems**: Searches Spoonacular API by restaurant name
2. **getRestaurantMenuFromAPI**: 
   - Tries restaurant name search
   - If fails, tries cuisine type search
   - Returns null if both fail (triggers fallback)
3. **getRestaurantMenu**: Main function that tries API first, then generated menu

**Why after menu service?**
- This is the enhancement - tries real data first, falls back to generated

---

## Phase 8: Main App Screens

### Step 17: Home Screen
**File created:** `screens/HomeScreen.js`

**My thought process:**
1. "This is where users start - need address search"
2. "Google Places Autocomplete is perfect for this"
3. "Once address selected, show confirmation and button to browse restaurants"
4. "Should look clean and welcoming"

**What I did step-by-step in `screens/HomeScreen.js`:**
1. **Imports**: React Native components, GooglePlacesAutocomplete, navigation, Redux
2. **State**: Get deliveryAddress from Redux
3. **handlePlaceSelect**:
   - Extracts address description and coordinates
   - Saves to Redux (setDeliveryAddress)
   - Navigates to RestaurantList
4. **UI Structure**:
   - Header with app name
   - Search container with GooglePlacesAutocomplete
   - Conditional rendering:
     - If address selected: Show success message and "Browse Restaurants" button
     - If no address: Show welcome message with icon
5. **Styles**: Black header, clean search bar, centered content

**Why this first main screen?**
- Entry point for the app flow
- Users need to set location before browsing restaurants

### Step 18: Restaurant List Screen
**File created:** `screens/RestaurantListScreen.js`

**My thought process:**
1. "Show list of restaurants based on selected address"
2. "Use FlatList for performance"
3. "Each card shows: image, name, rating, categories, distance"
4. "Tap card to see restaurant details"
5. "Show loading while fetching"

**What I did step-by-step in `screens/RestaurantListScreen.js`:**
1. **Imports**: React Native, navigation, icons, Redux, Google Places service
2. **State**: restaurants (array), loading (boolean)
3. **useEffect**: Load restaurants when deliveryAddress changes
4. **loadRestaurants**:
   - Check if address exists
   - If has coordinates: use nearby search
   - If no coordinates: use text search with address description
   - Update restaurants state
5. **renderRestaurant**:
   - TouchableOpacity card
   - Restaurant image
   - Name, rating with star icon, review count
   - Categories
   - Distance (if available)
   - Navigate to RestaurantDetail on press
6. **UI**: FlatList with restaurant cards, loading indicator, empty state
7. **Styles**: Card layout with image and info side-by-side

**Why after home screen?**
- Natural flow: select address → see restaurants
- Uses address from Redux that home screen set

### Step 19: Restaurant Detail Screen
**File created:** `screens/RestaurantDetailScreen.js`

**My thought process:**
1. "Show full restaurant info: image, name, rating, categories, location, hours"
2. "Display menu items with add to cart button"
3. "Check if adding from different restaurant (should clear cart)"
4. "Load restaurant details and menu on mount"

**What I did step-by-step in `screens/RestaurantDetailScreen.js`:**
1. **Imports**: React Native, navigation, icons, Redux, services
2. **State**: restaurant, menuItems, loading
3. **useEffect**: Load restaurant details and menu on mount
4. **loadRestaurantDetails**:
   - Get place_id from route params
   - Fetch restaurant details (Promise.all for parallel requests)
   - Fetch menu items
   - Update state
5. **handleAddToCart**:
   - Check if restaurant exists
   - Check if adding from different restaurant
   - If different: Show alert, clear cart on confirm
   - Create cart item object
   - Dispatch addToCart
   - Show success alert
6. **UI**:
   - ScrollView for long content
   - Header image
   - Restaurant name, rating, review count
   - Categories
   - Location and hours
   - Menu section with items (name, description, price, add button)
7. **Styles**: Clean layout with proper spacing

**Why after restaurant list?**
- Users tap restaurant from list to see details
- Needs menu service to work

### Step 20: Cart Screen
**File created:** `screens/CartScreen.js`

**My thought process:**
1. "Show all cart items with quantities"
2. "Allow updating quantities or removing items"
3. "Calculate and display: subtotal, tax, delivery fee, total"
4. "Button to proceed to checkout"
5. "Show empty state if cart is empty"

**What I did step-by-step in `screens/CartScreen.js`:**
1. **Imports**: React Native, navigation, icons, Redux
2. **State**: Get cartItems and cartTotal from Redux
3. **Calculations**: subtotal, deliveryFee (2.99), tax (10%), total
4. **handleUpdateQuantity**:
   - If quantity 0: remove item
   - Otherwise: update quantity
5. **handleRemoveItem**: Dispatch removeFromCart
6. **UI**:
   - Header with "Your Cart"
   - FlatList of cart items:
     - Item name and restaurant
     - Quantity controls (+/-)
     - Price
     - Remove button
   - Summary section: subtotal, delivery, tax, total
   - "Proceed to Checkout" button (disabled if empty)
   - Empty state if no items
7. **Styles**: Clean list with proper spacing, summary card

**Why after restaurant detail?**
- Users add items from restaurant detail screen
- Cart is the next step in the flow

### Step 21: Checkout Screen
**File created:** `screens/CheckoutScreen.js`

**My thought process:**
1. "Show delivery address (from Redux)"
2. "Display order summary (items, prices)"
3. "Show payment method (cash on delivery)"
4. "Place order button that saves to Firebase"
5. "After order placed, show confirmation screen"
6. "Prevent duplicate orders"
7. "Guest users should be prompted to sign up"

**What I did step-by-step in `screens/CheckoutScreen.js`:**
1. **Imports**: React Native, navigation, Redux, Firebase Firestore
2. **State**: loading, orderPlaced, orderData
3. **Calculations**: Same as cart (subtotal, delivery, tax, total)
4. **handlePlaceOrder**:
   - Check if already placed (prevent duplicates)
   - Validate address and cart
   - Check if guest user → prompt to sign up
   - Create order object with all details
   - Save to Firestore 'orders' collection
   - Store order data for confirmation screen
   - Clear cart
   - Show success alert
5. **Confirmation Screen** (if orderData exists):
   - Success icon
   - Order ID, address, payment method
   - List of items
   - Price breakdown
   - "Back to Home" button
6. **Checkout Form** (if no orderData):
   - Delivery address section
   - Order summary (items and prices)
   - Payment method section
   - Place order button
7. **Styles**: Clean sections, confirmation card, proper spacing

**Why last?**
- Final step in the order flow
- Needs all previous screens working
- Integrates everything: cart, address, Firebase

---

## Phase 9: Polish and Utilities

### Step 22: Loading Screen Component
**File:** `components/LoadingScreen.js` (Already built in Step 10, but used in navigation)

### Step 23: Error Handling and Edge Cases
**Files modified:** All screen and service files

**What I added throughout:**
- Try-catch blocks in all async functions
- User-friendly error messages
- Loading states for all API calls
- Empty states for lists
- Validation for all user inputs
- Network error handling

**Why important?**
- App should never crash
- Users need clear feedback
- Better user experience

### Step 24: Styling Consistency
**Files modified:** All screen files (styles added to each)

**What I ensured:**
- Consistent color scheme (black, white, gray)
- Similar spacing and padding
- Uniform button styles
- Consistent typography
- Rounded corners on images and cards
- Shadow/elevation for depth

**Why this matters:**
- Professional appearance
- Better user experience
- Matches Uber Eats aesthetic

---

## Development Flow Summary

### The Logical Order:

1. **Foundation** (Steps 1-3)
   - Project setup, dependencies, config
   - Can't build without this

2. **Backend** (Step 4)
   - Firebase setup
   - Needed for authentication

3. **State Management** (Steps 5-8)
   - Redux store and slices
   - Screens need this to work

4. **Navigation** (Step 9)
   - Screen structure
   - Determines app flow

5. **Auth Screens** (Steps 10-12)
   - Login/signup
   - Entry point for users

6. **App Entry** (Step 13)
   - Ties everything together

7. **API Services** (Steps 14-16)
   - Backend integration
   - Screens need these

8. **Main Screens** (Steps 17-21)
   - User-facing features
   - Built in order of user flow

9. **Polish** (Steps 22-24)
   - Error handling, styling
   - Makes app production-ready

---

## Key Design Decisions

### Why Redux?
- Global state needed for auth and cart
- Multiple screens access same data
- Cleaner than prop drilling

### Why Firebase?
- Quick setup for auth and database
- No backend server needed
- Real-time capabilities

### Why Google Places?
- Best address autocomplete
- Restaurant search built-in
- Reliable and well-documented

### Why This Navigation Structure?
- Bottom tabs for main sections
- Stack navigators for flows
- Conditional auth/main app

### Why Separate Services?
- Reusable API logic
- Easier to test
- Cleaner component code

---

## Final Thoughts

This project was built incrementally, testing each piece before moving to the next. The order matters because each step builds on the previous ones. You can't build screens without navigation, can't build navigation without Redux, and can't build Redux without Firebase.

The key is to think about dependencies: what does this feature need to work? Build those dependencies first, then build the feature.

