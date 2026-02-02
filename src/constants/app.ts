export const CHEF_TIERS = [
  { level: 0, name: 'Home Eater', coinsRequired: 0, color: '#808080' },
  { level: 1, name: 'Kitchen Novice', coinsRequired: 100, color: '#B87333' },
  { level: 2, name: 'Aspiring Cook', coinsRequired: 300, color: '#C0C0C0' },
  { level: 3, name: 'Home Chef', coinsRequired: 600, color: '#FFD700' },
  { level: 4, name: 'Seasoned Cook', coinsRequired: 1000, color: '#FF8C00' },
  { level: 5, name: 'Culinary Artist', coinsRequired: 1500, color: '#9370DB' },
  { level: 6, name: 'Master Chef', coinsRequired: 2500, color: '#FF1493' },
  { level: 7, name: 'Iron Chef', coinsRequired: 5000, color: '#FF0000' },
] as const;

export const DIFFICULTY_COINS = {
  easy: 10,
  medium: 25,
  hard: 50,
} as const;

export const RECIPE_CATEGORIES = [
  'All',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Desserts',
  'Snacks',
  'Drinks',
  'Appetizers',
  'Soups',
  'Salads',
  'Baking',
] as const;

export const DIETARY_LABELS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Keto',
  'Paleo',
  'Low-Carb',
  'High-Protein',
  'Nut-Free',
  'Soy-Free',
] as const;

export const GROCERY_CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat',
  'Seafood',
  'Bakery',
  'Pantry',
  'Spices',
  'Beverages',
  'Frozen',
  'Other',
] as const;

export const MEASUREMENT_UNITS = [
  'cup',
  'tbsp',
  'tsp',
  'oz',
  'lb',
  'g',
  'kg',
  'ml',
  'l',
  'piece',
  'pinch',
  'to taste',
] as const;

export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const;

export const PRO_FEATURES = {
  UNLIMITED_AI_IMPORTS: 'unlimited_ai_imports',
  ADVANCED_NUTRITION: 'advanced_nutrition',
  CUSTOM_MEAL_TEMPLATES: 'custom_meal_templates',
  AD_FREE: 'ad_free',
  PRIORITY_SUPPORT: 'priority_support',
  EXCLUSIVE_RECIPES: 'exclusive_recipes',
} as const;

export const ENTITLEMENT_ID = 'pro';

export const AI_IMPORT_FREE_LIMIT = 5;
