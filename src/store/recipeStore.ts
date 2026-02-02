import { create } from 'zustand';
import { Recipe, RecipeWithDetails, Ingredient, Instruction, NutritionInfo } from '@/types';
import { supabase } from '@/services/supabase';

interface RecipeState {
  recipes: Recipe[];
  currentRecipe: RecipeWithDetails | null;
  isLoading: boolean;
  selectedCategory: string;
  searchQuery: string;
  
  fetchRecipes: (category?: string, search?: string) => Promise<void>;
  fetchRecipeById: (id: string) => Promise<void>;
  createRecipe: (recipe: Partial<RecipeWithDetails>) => Promise<string>;
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  currentRecipe: null,
  isLoading: false,
  selectedCategory: 'All',
  searchQuery: '',

  fetchRecipes: async (category?: string, search?: string) => {
    try {
      set({ isLoading: true });
      
      let query = supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      set({ recipes: data || [], isLoading: false });
    } catch (error) {
      console.error('Fetch recipes error:', error);
      set({ isLoading: false });
    }
  },

  fetchRecipeById: async (id: string) => {
    try {
      set({ isLoading: true });

      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (recipeError) throw recipeError;

      const { data: ingredients } = await supabase
        .from('ingredients')
        .select('*')
        .eq('recipe_id', id)
        .order('order_index');

      const { data: instructions } = await supabase
        .from('instructions')
        .select('*')
        .eq('recipe_id', id)
        .order('step_number');

      const { data: nutrition } = await supabase
        .from('nutrition_info')
        .select('*')
        .eq('recipe_id', id)
        .single();

      const { count } = await supabase
        .from('cooked_logs')
        .select('*', { count: 'exact', head: true })
        .eq('recipe_id', id);

      set({
        currentRecipe: {
          ...recipe,
          ingredients: ingredients || [],
          instructions: instructions || [],
          nutrition_info: nutrition || undefined,
          cooked_count: count || 0,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('Fetch recipe by ID error:', error);
      set({ isLoading: false });
    }
  },

  createRecipe: async (recipe: Partial<RecipeWithDetails>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: newRecipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          title: recipe.title!,
          description: recipe.description,
          source_url: recipe.source_url,
          source_type: recipe.source_type,
          prep_time: recipe.prep_time,
          cook_time: recipe.cook_time,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          image_url: recipe.image_url,
          video_url: recipe.video_url,
          is_public: recipe.is_public || false,
          category: recipe.category,
          cuisine_type: recipe.cuisine_type,
          dietary_labels: recipe.dietary_labels,
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

      if (recipe.ingredients && recipe.ingredients.length > 0) {
        const ingredientsToInsert = recipe.ingredients.map((ing, index) => ({
          recipe_id: newRecipe.id,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          category: ing.category,
          order_index: index,
        }));

        await supabase.from('ingredients').insert(ingredientsToInsert);
      }

      if (recipe.instructions && recipe.instructions.length > 0) {
        const instructionsToInsert = recipe.instructions.map((inst) => ({
          recipe_id: newRecipe.id,
          step_number: inst.step_number,
          instruction_text: inst.instruction_text,
          duration_minutes: inst.duration_minutes,
          image_url: inst.image_url,
        }));

        await supabase.from('instructions').insert(instructionsToInsert);
      }

      if (recipe.nutrition_info) {
        await supabase.from('nutrition_info').insert({
          recipe_id: newRecipe.id,
          ...recipe.nutrition_info,
        });
      }

      return newRecipe.id;
    } catch (error) {
      console.error('Create recipe error:', error);
      throw error;
    }
  },

  updateRecipe: async (id: string, updates: Partial<Recipe>) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await get().fetchRecipeById(id);
    } catch (error) {
      console.error('Update recipe error:', error);
      throw error;
    }
  },

  deleteRecipe: async (id: string) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set({
        recipes: get().recipes.filter((r) => r.id !== id),
        currentRecipe: get().currentRecipe?.id === id ? null : get().currentRecipe,
      });
    } catch (error) {
      console.error('Delete recipe error:', error);
      throw error;
    }
  },

  setSelectedCategory: (category: string) => {
    set({ selectedCategory: category });
    get().fetchRecipes(category, get().searchQuery);
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().fetchRecipes(get().selectedCategory, query);
  },
}));
