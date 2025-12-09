// Category Service - Dynamically extracts and manages restaurant categories

// Icon mapping for common restaurant categories
const CATEGORY_ICONS = {
  // Cuisine types
  'pizza': 'pizza-outline',
  'italian': 'restaurant-outline',
  'mexican': 'flame-outline',
  'chinese': 'restaurant-outline',
  'japanese': 'fish-outline',
  'sushi': 'fish-outline',
  'indian': 'restaurant',
  'thai': 'leaf-outline',
  'american': 'fast-food-outline',
  'burger': 'fast-food-outline',
  'burgers': 'fast-food-outline',
  'seafood': 'water-outline',
  'fish': 'water-outline',
  'mediterranean': 'restaurant-outline',
  'greek': 'restaurant-outline',
  'french': 'restaurant-outline',
  'korean': 'restaurant-outline',
  'vietnamese': 'restaurant-outline',
  'dessert': 'ice-cream-outline',
  'desserts': 'ice-cream-outline',
  'bakery': 'ice-cream-outline',
  'cafe': 'cafe-outline',
  'coffee': 'cafe-outline',
  'breakfast': 'sunny-outline',
  'brunch': 'sunny-outline',
  'steakhouse': 'restaurant-outline',
  'bbq': 'flame-outline',
  'barbecue': 'flame-outline',
  'vegan': 'leaf-outline',
  'vegetarian': 'leaf-outline',
  'halal': 'restaurant-outline',
  'kosher': 'restaurant-outline',
  'fast food': 'fast-food-outline',
  'fast_food': 'fast-food-outline',
  'default': 'restaurant-outline',
};

// Color palette for categories
const CATEGORY_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#FF6347',
  '#FFD700', '#FF8C00', '#32CD32', '#1E90FF', '#FF69B4',
  '#9370DB', '#20B2AA', '#FF1493', '#00CED1', '#FF4500',
  '#8B008B', '#2E8B57', '#DC143C', '#4682B4', '#DAA520',
];

/**
 * Extract unique categories from restaurants
 * @param {Array} restaurants - Array of restaurant objects
 * @returns {Array} Array of unique category objects with icon and color
 */
export const extractCategoriesFromRestaurants = (restaurants) => {
  if (!restaurants || restaurants.length === 0) {
    return [];
  }

  const categoryMap = new Map();
  const categoryCounts = new Map();

  // Extract all categories from restaurants
  restaurants.forEach((restaurant) => {
    const categories = restaurant.categories || [];
    categories.forEach((cat) => {
      const categoryTitle = (cat.title || cat.alias || '').toLowerCase().trim();
      if (categoryTitle && categoryTitle !== 'restaurant' && categoryTitle !== 'food' && categoryTitle !== 'point_of_interest' && categoryTitle !== 'establishment') {
        // Normalize category name
        const normalized = normalizeCategoryName(categoryTitle);
        
        if (!categoryMap.has(normalized)) {
          categoryMap.set(normalized, {
            name: formatCategoryName(categoryTitle),
            originalName: categoryTitle,
            icon: getCategoryIcon(categoryTitle),
            color: getCategoryColor(normalized),
            count: 0,
          });
        }
        categoryCounts.set(normalized, (categoryCounts.get(normalized) || 0) + 1);
      }
    });

    // Also check restaurant name for category hints
    const name = (restaurant.name || '').toLowerCase();
    const nameCategories = extractCategoriesFromName(name);
    nameCategories.forEach((cat) => {
      const normalized = normalizeCategoryName(cat);
      if (!categoryMap.has(normalized)) {
        categoryMap.set(normalized, {
          name: formatCategoryName(cat),
          originalName: cat,
          icon: getCategoryIcon(cat),
          color: getCategoryColor(normalized),
          count: 0,
        });
      }
      categoryCounts.set(normalized, (categoryCounts.get(normalized) || 0) + 1);
    });
  });

  // Update counts and sort by popularity
  const categories = Array.from(categoryMap.values()).map((cat) => ({
    ...cat,
    count: categoryCounts.get(normalizeCategoryName(cat.originalName)) || 0,
  }));

  // Sort by count (most popular first), then alphabetically
  categories.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.name.localeCompare(b.name);
  });

  // Limit to top 15 categories to keep UI manageable
  return categories.slice(0, 15);
};

/**
 * Normalize category name for consistent grouping
 */
const normalizeCategoryName = (categoryName) => {
  const name = categoryName.toLowerCase().trim();
  
  // Group similar categories
  const mappings = {
    'pizza': 'pizza',
    'pizzeria': 'pizza',
    'italian': 'italian',
    'burger': 'burgers',
    'burgers': 'burgers',
    'hamburger': 'burgers',
    'fast food': 'burgers',
    'fast_food': 'burgers',
    'american': 'burgers',
    'sushi': 'sushi',
    'japanese': 'sushi',
    'japanese restaurant': 'sushi',
    'mexican': 'mexican',
    'taco': 'mexican',
    'burrito': 'mexican',
    'chinese': 'chinese',
    'chinese restaurant': 'chinese',
    'indian': 'indian',
    'indian restaurant': 'indian',
    'thai': 'thai',
    'thai restaurant': 'thai',
    'seafood': 'seafood',
    'fish': 'seafood',
    'dessert': 'desserts',
    'desserts': 'desserts',
    'bakery': 'desserts',
    'ice cream': 'desserts',
    'cafe': 'cafe',
    'coffee': 'cafe',
    'coffee shop': 'cafe',
  };

  // Check direct mapping first
  if (mappings[name]) {
    return mappings[name];
  }

  // Check if name contains any mapped term
  for (const [key, value] of Object.entries(mappings)) {
    if (name.includes(key)) {
      return value;
    }
  }

  return name;
};

/**
 * Format category name for display
 */
const formatCategoryName = (categoryName) => {
  const name = categoryName.toLowerCase().trim();
  
  // Capitalize first letter of each word
  return name
    .split(/[\s_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get icon for category
 */
const getCategoryIcon = (categoryName) => {
  const name = categoryName.toLowerCase().trim();
  
  // Check direct match
  if (CATEGORY_ICONS[name]) {
    return CATEGORY_ICONS[name];
  }

  // Check if name contains any icon key
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (name.includes(key)) {
      return icon;
    }
  }

  return CATEGORY_ICONS.default;
};

/**
 * Get color for category (consistent based on normalized name)
 */
const getCategoryColor = (normalizedCategoryName) => {
  // Use hash of category name to get consistent color
  let hash = 0;
  for (let i = 0; i < normalizedCategoryName.length; i++) {
    hash = normalizedCategoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
};

/**
 * Extract category hints from restaurant name
 */
const extractCategoriesFromName = (restaurantName) => {
  const categories = [];
  const name = restaurantName.toLowerCase();

  const categoryKeywords = {
    'pizza': 'pizza',
    'pizzeria': 'pizza',
    'burger': 'burgers',
    'sushi': 'sushi',
    'taco': 'mexican',
    'burrito': 'mexican',
    'chinese': 'chinese',
    'indian': 'indian',
    'thai': 'thai',
    'seafood': 'seafood',
    'fish': 'seafood',
    'dessert': 'desserts',
    'bakery': 'desserts',
    'cafe': 'cafe',
    'coffee': 'cafe',
  };

  for (const [keyword, category] of Object.entries(categoryKeywords)) {
    if (name.includes(keyword)) {
      categories.push(category);
    }
  }

  return categories;
};

/**
 * Get all available categories (for initial display before restaurants load)
 * @returns {Array} Default category list
 */
export const getDefaultCategories = () => {
  return [
    { name: 'Pizza', icon: 'pizza-outline', color: '#FF6B6B', originalName: 'pizza' },
    { name: 'Burgers', icon: 'fast-food-outline', color: '#4ECDC4', originalName: 'burgers' },
    { name: 'Sushi', icon: 'fish-outline', color: '#45B7D1', originalName: 'sushi' },
    { name: 'Italian', icon: 'restaurant-outline', color: '#FFA07A', originalName: 'italian' },
    { name: 'Mexican', icon: 'flame-outline', color: '#FF6347', originalName: 'mexican' },
    { name: 'Chinese', icon: 'restaurant-outline', color: '#FFD700', originalName: 'chinese' },
    { name: 'Indian', icon: 'restaurant', color: '#FF8C00', originalName: 'indian' },
    { name: 'Thai', icon: 'leaf-outline', color: '#32CD32', originalName: 'thai' },
    { name: 'Seafood', icon: 'water-outline', color: '#1E90FF', originalName: 'seafood' },
    { name: 'Desserts', icon: 'ice-cream-outline', color: '#FF69B4', originalName: 'desserts' },
  ];
};

export default {
  extractCategoriesFromRestaurants,
  getDefaultCategories,
};

