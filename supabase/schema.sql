-- iCook Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  chef_tier INTEGER DEFAULT 0,
  cook_coins INTEGER DEFAULT 0,
  google_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Recipes table
CREATE TABLE public.recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  source_type TEXT CHECK (source_type IN ('url', 'image', 'manual')),
  prep_time INTEGER,
  cook_time INTEGER,
  servings INTEGER,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  image_url TEXT,
  video_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  category TEXT,
  cuisine_type TEXT,
  dietary_labels TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Ingredients table
CREATE TABLE public.ingredients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT,
  category TEXT,
  order_index INTEGER NOT NULL
);

-- Instructions table
CREATE TABLE public.instructions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  step_number INTEGER NOT NULL,
  instruction_text TEXT NOT NULL,
  duration_minutes INTEGER,
  image_url TEXT
);

-- Nutrition info table
CREATE TABLE public.nutrition_info (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  calories INTEGER,
  protein NUMERIC,
  carbs NUMERIC,
  fats NUMERIC,
  fiber NUMERIC,
  sugar NUMERIC,
  sodium NUMERIC,
  UNIQUE(recipe_id)
);

-- Cooked logs table
CREATE TABLE public.cooked_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  cooked_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  photo_url TEXT,
  notes TEXT,
  coins_earned INTEGER NOT NULL DEFAULT 0
);

-- Grocery lists table
CREATE TABLE public.grocery_lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Grocery List',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Grocery items table
CREATE TABLE public.grocery_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id UUID REFERENCES public.grocery_lists(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT,
  category TEXT,
  is_checked BOOLEAN DEFAULT FALSE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User pantry table
CREATE TABLE public.user_pantry (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT,
  category TEXT,
  expiry_date DATE
);

-- Collections table
CREATE TABLE public.collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Collection recipes junction table
CREATE TABLE public.collection_recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(collection_id, recipe_id)
);

-- Meal plans table
CREATE TABLE public.meal_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  meal_date DATE NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for performance
CREATE INDEX idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX idx_recipes_category ON public.recipes(category);
CREATE INDEX idx_recipes_is_public ON public.recipes(is_public);
CREATE INDEX idx_ingredients_recipe_id ON public.ingredients(recipe_id);
CREATE INDEX idx_instructions_recipe_id ON public.instructions(recipe_id);
CREATE INDEX idx_cooked_logs_user_id ON public.cooked_logs(user_id);
CREATE INDEX idx_cooked_logs_recipe_id ON public.cooked_logs(recipe_id);
CREATE INDEX idx_grocery_items_list_id ON public.grocery_items(list_id);
CREATE INDEX idx_meal_plans_user_id_date ON public.meal_plans(user_id, meal_date);

-- Row Level Security Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooked_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pantry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Recipes policies
CREATE POLICY "Users can view their own recipes" ON public.recipes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public recipes" ON public.recipes
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can insert their own recipes" ON public.recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes" ON public.recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes" ON public.recipes
  FOR DELETE USING (auth.uid() = user_id);

-- Ingredients policies
CREATE POLICY "Users can view ingredients of their recipes" ON public.ingredients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = ingredients.recipe_id
      AND (recipes.user_id = auth.uid() OR recipes.is_public = TRUE)
    )
  );

CREATE POLICY "Users can insert ingredients for their recipes" ON public.ingredients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update ingredients of their recipes" ON public.ingredients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete ingredients of their recipes" ON public.ingredients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- Instructions policies (same pattern as ingredients)
CREATE POLICY "Users can view instructions of accessible recipes" ON public.instructions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = instructions.recipe_id
      AND (recipes.user_id = auth.uid() OR recipes.is_public = TRUE)
    )
  );

CREATE POLICY "Users can insert instructions for their recipes" ON public.instructions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = instructions.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update instructions of their recipes" ON public.instructions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = instructions.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete instructions of their recipes" ON public.instructions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = instructions.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- Nutrition info policies (same pattern)
CREATE POLICY "Users can view nutrition info of accessible recipes" ON public.nutrition_info
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = nutrition_info.recipe_id
      AND (recipes.user_id = auth.uid() OR recipes.is_public = TRUE)
    )
  );

CREATE POLICY "Users can insert nutrition info for their recipes" ON public.nutrition_info
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = nutrition_info.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update nutrition info of their recipes" ON public.nutrition_info
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = nutrition_info.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete nutrition info of their recipes" ON public.nutrition_info
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = nutrition_info.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- Cooked logs policies
CREATE POLICY "Users can view their own cooked logs" ON public.cooked_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cooked logs" ON public.cooked_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cooked logs" ON public.cooked_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cooked logs" ON public.cooked_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Grocery lists policies
CREATE POLICY "Users can view their own grocery lists" ON public.grocery_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own grocery lists" ON public.grocery_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grocery lists" ON public.grocery_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grocery lists" ON public.grocery_lists
  FOR DELETE USING (auth.uid() = user_id);

-- Grocery items policies
CREATE POLICY "Users can view their grocery items" ON public.grocery_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.grocery_lists
      WHERE grocery_lists.id = grocery_items.list_id
      AND grocery_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert grocery items" ON public.grocery_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.grocery_lists
      WHERE grocery_lists.id = grocery_items.list_id
      AND grocery_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update grocery items" ON public.grocery_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.grocery_lists
      WHERE grocery_lists.id = grocery_items.list_id
      AND grocery_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete grocery items" ON public.grocery_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.grocery_lists
      WHERE grocery_lists.id = grocery_items.list_id
      AND grocery_lists.user_id = auth.uid()
    )
  );

-- User pantry policies
CREATE POLICY "Users can view their own pantry" ON public.user_pantry
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to their pantry" ON public.user_pantry
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pantry" ON public.user_pantry
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their pantry" ON public.user_pantry
  FOR DELETE USING (auth.uid() = user_id);

-- Collections policies
CREATE POLICY "Users can view their own collections" ON public.collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collections" ON public.collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" ON public.collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" ON public.collections
  FOR DELETE USING (auth.uid() = user_id);

-- Collection recipes policies
CREATE POLICY "Users can view their collection recipes" ON public.collection_recipes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_recipes.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert to their collections" ON public.collection_recipes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_recipes.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete from their collections" ON public.collection_recipes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_recipes.collection_id
      AND collections.user_id = auth.uid()
    )
  );

-- Meal plans policies
CREATE POLICY "Users can view their own meal plans" ON public.meal_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal plans" ON public.meal_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans" ON public.meal_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans" ON public.meal_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grocery_lists_updated_at BEFORE UPDATE ON public.grocery_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate chef tier
CREATE OR REPLACE FUNCTION get_chef_tier(coins INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF coins >= 5000 THEN RETURN 7;
  ELSIF coins >= 2500 THEN RETURN 6;
  ELSIF coins >= 1500 THEN RETURN 5;
  ELSIF coins >= 1000 THEN RETURN 4;
  ELSIF coins >= 600 THEN RETURN 3;
  ELSIF coins >= 300 THEN RETURN 2;
  ELSIF coins >= 100 THEN RETURN 1;
  ELSE RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update user coins and tier
CREATE OR REPLACE FUNCTION update_user_coins_and_tier()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET 
    cook_coins = cook_coins + NEW.coins_earned,
    chef_tier = get_chef_tier(cook_coins + NEW.coins_earned)
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_coins_and_tier
  AFTER INSERT ON public.cooked_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_user_coins_and_tier();

-- Function to create default grocery list for new users
CREATE OR REPLACE FUNCTION create_default_grocery_list()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.grocery_lists (user_id, name)
  VALUES (NEW.id, 'My Grocery List');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_default_grocery_list
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_grocery_list();
