// Enhanced menu service that generates realistic menus based on restaurant data
// Uses restaurant name, categories, and types to create contextually appropriate menus

// Comprehensive menu templates with realistic items and prices
const menuTemplates = {
  // Italian restaurants
  italian: [
    { name: 'Margherita Pizza', price: 16.99, description: 'Fresh mozzarella, San Marzano tomatoes, basil, extra virgin olive oil' },
    { name: 'Spaghetti Carbonara', price: 18.99, description: 'Guanciale, pecorino romano, black pepper, egg yolk' },
    { name: 'Chicken Parmigiana', price: 21.99, description: 'Breaded chicken breast, marinara, mozzarella, served with pasta' },
    { name: 'Caesar Salad', price: 13.99, description: 'Romaine lettuce, parmesan, croutons, house-made caesar dressing' },
    { name: 'Tiramisu', price: 9.99, description: 'Classic Italian dessert with espresso-soaked ladyfingers' },
    { name: 'Lasagna al Forno', price: 19.99, description: 'Layered pasta with bolognese, béchamel, and parmesan' },
    { name: 'Fettuccine Alfredo', price: 17.99, description: 'Fresh fettuccine with parmesan cream sauce' },
    { name: 'Bruschetta', price: 10.99, description: 'Toasted bread with fresh tomatoes, garlic, and basil' },
    { name: 'Osso Buco', price: 28.99, description: 'Braised veal shank with risotto milanese' },
  ],
  // American/Fast Food
  american: [
    { name: 'Classic Cheeseburger', price: 13.99, description: 'Angus beef patty, American cheese, lettuce, tomato, onion, pickles' },
    { name: 'BBQ Bacon Burger', price: 16.99, description: 'Beef patty, crispy bacon, cheddar, BBQ sauce, onion rings' },
    { name: 'Buffalo Chicken Wings', price: 14.99, description: '10 pieces, choice of mild, medium, or hot sauce' },
    { name: 'Caesar Salad', price: 11.99, description: 'Romaine, parmesan, croutons, caesar dressing' },
    { name: 'Loaded French Fries', price: 7.99, description: 'Crispy fries topped with cheese, bacon, and ranch' },
    { name: 'Onion Rings', price: 6.99, description: 'Beer-battered onion rings with chipotle aioli' },
    { name: 'Chocolate Milkshake', price: 7.99, description: 'Vanilla ice cream, chocolate syrup, whipped cream' },
    { name: 'Mac & Cheese', price: 12.99, description: 'Creamy macaroni with three-cheese blend, breadcrumbs' },
  ],
  // Asian/Chinese
  chinese: [
    { name: 'Sweet and Sour Chicken', price: 15.99, description: 'Crispy chicken with bell peppers, pineapple, sweet and sour sauce' },
    { name: 'Kung Pao Chicken', price: 16.99, description: 'Diced chicken, peanuts, vegetables, Sichuan peppercorns' },
    { name: 'Beef Lo Mein', price: 17.99, description: 'Stir-fried noodles with beef, vegetables, soy sauce' },
    { name: 'Spring Rolls', price: 7.99, description: 'Crispy vegetable spring rolls with sweet and sour sauce (4 pieces)' },
    { name: 'Egg Fried Rice', price: 12.99, description: 'Wok-fried rice with eggs, scallions, soy sauce' },
    { name: 'General Tso\'s Chicken', price: 16.99, description: 'Crispy chicken in sweet and spicy sauce with broccoli' },
    { name: 'Hot and Sour Soup', price: 6.99, description: 'Traditional soup with tofu, mushrooms, bamboo shoots' },
    { name: 'Mapo Tofu', price: 14.99, description: 'Silken tofu in spicy Sichuan sauce with ground pork' },
    { name: 'Peking Duck', price: 28.99, description: 'Roasted duck with pancakes, hoisin sauce, scallions' },
  ],
  // Mexican
  mexican: [
    { name: 'Chicken Tacos', price: 12.99, description: '3 soft corn tortillas with grilled chicken, cilantro, onion, lime' },
    { name: 'Beef Burrito', price: 13.99, description: 'Large flour tortilla with rice, beans, beef, cheese, sour cream' },
    { name: 'Chicken Quesadilla', price: 11.99, description: 'Grilled tortilla with chicken, cheese, served with salsa and sour cream' },
    { name: 'Guacamole & Chips', price: 8.99, description: 'Fresh guacamole made tableside with tortilla chips' },
    { name: 'Chicken Enchiladas', price: 14.99, description: '2 enchiladas with red sauce, cheese, served with rice and beans' },
    { name: 'Nachos Supreme', price: 10.99, description: 'Tortilla chips loaded with cheese, jalapeños, sour cream, guacamole' },
    { name: 'Churros', price: 6.99, description: 'Sweet fried dough with cinnamon sugar and chocolate dipping sauce' },
    { name: 'Carnitas Tacos', price: 13.99, description: 'Slow-cooked pork, onion, cilantro, lime (3 tacos)' },
    { name: 'Chiles Rellenos', price: 15.99, description: 'Stuffed poblano peppers with cheese, served with rice and beans' },
  ],
  // Japanese/Sushi
  japanese: [
    { name: 'Salmon Sushi Roll', price: 9.99, description: 'Fresh salmon, avocado, cucumber (8 pieces)' },
    { name: 'California Roll', price: 8.99, description: 'Crab, avocado, cucumber (8 pieces)' },
    { name: 'Chicken Teriyaki', price: 17.99, description: 'Grilled chicken with teriyaki glaze, steamed rice, miso soup' },
    { name: 'Beef Teriyaki', price: 19.99, description: 'Grilled beef with teriyaki sauce, steamed rice, miso soup' },
    { name: 'Miso Soup', price: 5.99, description: 'Traditional soup with tofu, seaweed, scallions' },
    { name: 'Edamame', price: 6.99, description: 'Steamed soybeans with sea salt' },
    { name: 'Tempura Shrimp', price: 13.99, description: 'Battered and fried shrimp with tempura sauce (6 pieces)' },
    { name: 'Ramen', price: 16.99, description: 'Pork broth, chashu, soft-boiled egg, nori, scallions' },
    { name: 'Dragon Roll', price: 12.99, description: 'Eel, cucumber, avocado, eel sauce (8 pieces)' },
  ],
  // Indian
  indian: [
    { name: 'Chicken Tikka Masala', price: 18.99, description: 'Tandoori chicken in creamy tomato curry, served with basmati rice' },
    { name: 'Butter Chicken', price: 19.99, description: 'Tender chicken in buttery tomato sauce, served with naan' },
    { name: 'Lamb Curry', price: 21.99, description: 'Spicy lamb curry with onions, tomatoes, served with rice' },
    { name: 'Vegetable Biryani', price: 16.99, description: 'Fragrant basmati rice with mixed vegetables, spices, raita' },
    { name: 'Garlic Naan', price: 5.99, description: 'Fresh baked bread brushed with garlic butter' },
    { name: 'Samosas', price: 7.99, description: 'Fried pastries with spiced potatoes and peas (2 pieces)' },
    { name: 'Mango Lassi', price: 5.99, description: 'Sweet yogurt drink with fresh mango' },
    { name: 'Palak Paneer', price: 16.99, description: 'Indian cheese in creamy spinach curry, served with rice' },
    { name: 'Chicken Vindaloo', price: 19.99, description: 'Spicy curry with potatoes, served with basmati rice' },
  ],
  // Pizza
  pizza: [
    { name: 'Margherita Pizza', price: 13.99, description: '12" pizza with fresh mozzarella, tomato sauce, basil' },
    { name: 'Pepperoni Pizza', price: 15.99, description: '12" pizza with pepperoni and mozzarella cheese' },
    { name: 'Hawaiian Pizza', price: 16.99, description: '12" pizza with ham, pineapple, mozzarella' },
    { name: 'Meat Lovers Pizza', price: 18.99, description: '12" pizza with pepperoni, sausage, ham, bacon' },
    { name: 'Veggie Supreme', price: 15.99, description: '12" pizza with bell peppers, mushrooms, onions, olives' },
    { name: 'BBQ Chicken Pizza', price: 17.99, description: '12" pizza with grilled chicken, red onions, BBQ sauce' },
    { name: 'Garlic Bread', price: 6.99, description: '6 pieces of garlic bread with marinara dipping sauce' },
    { name: 'Caesar Salad', price: 10.99, description: 'Fresh romaine with caesar dressing, parmesan, croutons' },
    { name: 'Buffalo Wings', price: 12.99, description: '8 pieces with your choice of sauce, celery, blue cheese' },
  ],
  // Seafood
  seafood: [
    { name: 'Grilled Salmon', price: 24.99, description: 'Atlantic salmon with lemon herb butter, seasonal vegetables' },
    { name: 'Fish and Chips', price: 17.99, description: 'Beer-battered cod with hand-cut fries, coleslaw, tartar sauce' },
    { name: 'Shrimp Scampi', price: 21.99, description: 'Jumbo shrimp in garlic white wine sauce, served over linguine' },
    { name: 'Lobster Roll', price: 26.99, description: 'Fresh lobster meat on buttered brioche roll, served with fries' },
    { name: 'Crab Cakes', price: 19.99, description: '2 jumbo crab cakes with remoulade, seasonal vegetables' },
    { name: 'New England Clam Chowder', price: 9.99, description: 'Creamy chowder with clams, potatoes, bacon' },
    { name: 'Grilled Tuna Steak', price: 23.99, description: 'Fresh tuna with sesame crust, wasabi aioli, rice' },
    { name: 'Seafood Paella', price: 28.99, description: 'Saffron rice with shrimp, mussels, clams, chorizo' },
    { name: 'Lobster Bisque', price: 11.99, description: 'Creamy soup with lobster, sherry, crème fraîche' },
  ],
  // Thai
  thai: [
    { name: 'Pad Thai', price: 16.99, description: 'Stir-fried rice noodles with shrimp, tofu, bean sprouts, peanuts' },
    { name: 'Green Curry', price: 17.99, description: 'Chicken in green curry with Thai basil, served with jasmine rice' },
    { name: 'Tom Yum Soup', price: 8.99, description: 'Hot and sour soup with shrimp, mushrooms, lemongrass' },
    { name: 'Massaman Curry', price: 18.99, description: 'Beef curry with potatoes, peanuts, served with rice' },
    { name: 'Spring Rolls', price: 7.99, description: 'Crispy vegetable rolls with sweet chili sauce (4 pieces)' },
    { name: 'Mango Sticky Rice', price: 7.99, description: 'Sweet sticky rice with fresh mango and coconut milk' },
  ],
  // Mediterranean
  mediterranean: [
    { name: 'Chicken Shawarma', price: 15.99, description: 'Marinated chicken with tahini, pickles, wrapped in pita' },
    { name: 'Hummus & Pita', price: 8.99, description: 'House-made hummus with warm pita bread' },
    { name: 'Greek Salad', price: 12.99, description: 'Mixed greens, feta, olives, tomatoes, cucumber, house dressing' },
    { name: 'Lamb Gyro', price: 16.99, description: 'Spiced lamb with tzatziki, onions, tomatoes, wrapped in pita' },
    { name: 'Falafel Plate', price: 13.99, description: '6 falafel balls with tahini, hummus, pita, salad' },
    { name: 'Baklava', price: 6.99, description: 'Sweet pastry with honey and nuts' },
  ],
  // Default menu
  default: [
    { name: 'Chef\'s Special', price: 18.99, description: 'Today\'s featured dish - ask your server for details' },
    { name: 'House Salad', price: 10.99, description: 'Mixed greens with cherry tomatoes, cucumber, house vinaigrette' },
    { name: 'Soup of the Day', price: 7.99, description: 'Ask your server for today\'s selection' },
    { name: 'Grilled Chicken', price: 17.99, description: 'Herb-marinated chicken breast with seasonal vegetables' },
    { name: 'Pasta Special', price: 16.99, description: 'Chef\'s pasta creation - ask your server for details' },
    { name: 'Dessert Special', price: 8.99, description: 'Ask about today\'s featured dessert' },
    { name: 'Caesar Salad', price: 11.99, description: 'Romaine, parmesan, croutons, caesar dressing' },
  ],
};

// Enhanced function to determine menu type based on restaurant data
const getMenuType = (restaurant) => {
  const name = (restaurant.name || '').toLowerCase();
  const categories = restaurant.categories || [];
  const types = restaurant.types || [];
  
  // Combine all category and type strings
  const allTypes = [
    ...categories.map(c => (c.alias || c.title || c).toLowerCase()),
    ...types.map(t => typeof t === 'string' ? t.toLowerCase() : ''),
    name
  ].filter(Boolean);

  // Check restaurant name first for specific cuisine indicators
  if (name.includes('pizza') || name.includes('pizzeria')) {
    return 'pizza';
  }
  if (name.includes('sushi') || name.includes('japanese')) {
    return 'japanese';
  }
  if (name.includes('thai')) {
    return 'thai';
  }
  if (name.includes('mediterranean') || name.includes('greek') || name.includes('shawarma')) {
    return 'mediterranean';
  }

  // Check categories and types
  if (allTypes.some(t => t.includes('italian') || t.includes('pizza'))) {
    return allTypes.some(t => t.includes('pizza')) ? 'pizza' : 'italian';
  }
  if (allTypes.some(t => t.includes('chinese') || t.includes('asian'))) {
    return 'chinese';
  }
  if (allTypes.some(t => t.includes('mexican') || t.includes('taco') || t.includes('burrito'))) {
    return 'mexican';
  }
  if (allTypes.some(t => t.includes('japanese') || t.includes('sushi') || t.includes('ramen'))) {
    return 'japanese';
  }
  if (allTypes.some(t => t.includes('indian') || t.includes('curry'))) {
    return 'indian';
  }
  if (allTypes.some(t => t.includes('seafood') || t.includes('fish'))) {
    return 'seafood';
  }
  if (allTypes.some(t => t.includes('thai'))) {
    return 'thai';
  }
  if (allTypes.some(t => t.includes('mediterranean') || t.includes('greek') || t.includes('middle eastern'))) {
    return 'mediterranean';
  }
  if (allTypes.some(t => t.includes('american') || t.includes('burger') || t.includes('fast food'))) {
    return 'american';
  }

  return 'default';
};

// Generate menu items for a restaurant
export const getRestaurantMenu = (restaurant) => {
  if (!restaurant) {
    return menuTemplates.default;
  }

  const menuType = getMenuType(restaurant);
  const baseMenu = menuTemplates[menuType] || menuTemplates.default;
  
  // Add slight price variations based on restaurant rating (higher rated = slightly higher prices)
  const ratingMultiplier = restaurant.rating ? 1 + (restaurant.rating - 3.5) * 0.05 : 1;
  
  // Return 6-9 items with price adjustments
  const menu = baseMenu.map(item => ({
    ...item,
    price: Math.round((item.price * ratingMultiplier) * 100) / 100, // Round to 2 decimals
  }));
  
  // Shuffle and return 6-9 items to make menus feel unique per restaurant
  const shuffled = [...menu].sort(() => Math.random() - 0.5);
  const itemCount = 6 + Math.floor(Math.random() * 4); // 6-9 items
  return shuffled.slice(0, Math.min(itemCount, shuffled.length));
};

export default {
  getRestaurantMenu,
};
