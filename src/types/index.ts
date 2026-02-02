export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  chef_tier: number;
  cook_coins: number;
  google_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  source_url?: string;
  source_type?: 'url' | 'image' | 'manual';
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  image_url?: string;
  video_url?: string;
  is_public: boolean;
  category?: string;
  cuisine_type?: string;
  dietary_labels?: string[];
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  id: string;
  recipe_id: string;
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  order_index: number;
}

export interface Instruction {
  id: string;
  recipe_id: string;
  step_number: number;
  instruction_text: string;
  duration_minutes?: number;
  image_url?: string;
}

export interface NutritionInfo {
  id: string;
  recipe_id: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface CookedLog {
  id: string;
  user_id: string;
  recipe_id: string;
  cooked_date: string;
  photo_url?: string;
  notes?: string;
  coins_earned: number;
  recipe?: Recipe;
}

export interface GroceryList {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface GroceryItem {
  id: string;
  list_id: string;
  recipe_id?: string;
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  is_checked: boolean;
  added_at: string;
}

export interface PantryItem {
  id: string;
  user_id: string;
  item_name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  expiry_date?: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_favorite: boolean;
  created_at: string;
}

export interface CollectionRecipe {
  id: string;
  collection_id: string;
  recipe_id: string;
}

export interface MealPlan {
  id: string;
  user_id: string;
  recipe_id: string;
  meal_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  created_at: string;
  recipe?: Recipe;
}

export interface RecipeWithDetails extends Recipe {
  ingredients: Ingredient[];
  instructions: Instruction[];
  nutrition_info?: NutritionInfo;
  cooked_count?: number;
}

export interface AIRecipeExtraction {
  title: string;
  description?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  ingredients: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    category?: string;
  }>;
  instructions: Array<{
    step_number: number;
    instruction_text: string;
    duration_minutes?: number;
  }>;
  nutrition_info?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
  };
  category?: string;
  cuisine_type?: string;
  dietary_labels?: string[];
}

export interface UserStats {
  total_recipes: number;
  total_cooked: number;
  total_coins: number;
  current_streak: number;
  favorite_category?: string;
  most_cooked_recipe?: Recipe;
}
