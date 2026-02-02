import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Users, ChefHat, Play, ShoppingCart, Camera, Share2 } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Loading } from '@/components/Loading';
import { useRecipeStore } from '@/store/recipeStore';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { cloudinaryService } from '@/services/cloudinary';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '@/constants/theme';
import { DIFFICULTY_COINS } from '@/constants/app';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentRecipe, fetchRecipeById, isLoading } = useRecipeStore();
  const [servings, setServings] = useState(1);

  useEffect(() => {
    if (id) {
      fetchRecipeById(id);
    }
  }, [id]);

  useEffect(() => {
    if (currentRecipe?.servings) {
      setServings(currentRecipe.servings);
    }
  }, [currentRecipe]);

  const handleAddToGroceryList = async () => {
    if (!currentRecipe || !user) return;

    try {
      const { data: lists } = await supabase
        .from('grocery_lists')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (lists) {
        const items = currentRecipe.ingredients.map(ing => ({
          list_id: lists.id,
          recipe_id: currentRecipe.id,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          category: ing.category,
          is_checked: false,
        }));

        await supabase.from('grocery_items').insert(items);
        Alert.alert('Success', 'Ingredients added to grocery list!');
      }
    } catch (error) {
      console.error('Add to grocery list error:', error);
      Alert.alert('Error', 'Failed to add ingredients. Please try again.');
    }
  };

  const handleCookedIt = async () => {
    router.push(`/cook-mode/${id}`);
  };

  if (isLoading || !currentRecipe) {
    return <Loading />;
  }

  const totalTime = (currentRecipe.prep_time || 0) + (currentRecipe.cook_time || 0);
  const servingsMultiplier = servings / (currentRecipe.servings || 1);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        {currentRecipe.image_url && (
          <Image
            source={{ uri: cloudinaryService.getOptimizedUrl(currentRecipe.image_url) }}
            style={styles.heroImage}
          />
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{currentRecipe.title}</Text>
          
          {currentRecipe.description && (
            <Text style={styles.description}>{currentRecipe.description}</Text>
          )}

          <View style={styles.metaContainer}>
            {totalTime > 0 && (
              <View style={styles.metaItem}>
                <Clock size={20} color={COLORS.primary} />
                <Text style={styles.metaText}>{totalTime} min</Text>
              </View>
            )}
            
            {currentRecipe.servings && (
              <View style={styles.metaItem}>
                <Users size={20} color={COLORS.primary} />
                <Text style={styles.metaText}>{currentRecipe.servings} servings</Text>
              </View>
            )}
            
            {currentRecipe.difficulty && (
              <View style={styles.metaItem}>
                <ChefHat size={20} color={COLORS.primary} />
                <Text style={styles.metaText}>
                  {currentRecipe.difficulty} • {DIFFICULTY_COINS[currentRecipe.difficulty]}🪙
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <Button
              title="Enter Cook Mode"
              onPress={handleCookedIt}
              icon={<Play size={20} color={COLORS.background} />}
              style={styles.primaryAction}
            />
            
            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.iconButton} onPress={handleAddToGroceryList}>
                <ShoppingCart size={24} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Share2 size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

          {currentRecipe.nutrition_info && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nutrition Info</Text>
              <View style={styles.nutritionGrid}>
                {currentRecipe.nutrition_info.calories && (
                  <NutritionItem label="Calories" value={`${currentRecipe.nutrition_info.calories}`} />
                )}
                {currentRecipe.nutrition_info.protein && (
                  <NutritionItem label="Protein" value={`${currentRecipe.nutrition_info.protein}g`} />
                )}
                {currentRecipe.nutrition_info.carbs && (
                  <NutritionItem label="Carbs" value={`${currentRecipe.nutrition_info.carbs}g`} />
                )}
                {currentRecipe.nutrition_info.fats && (
                  <NutritionItem label="Fats" value={`${currentRecipe.nutrition_info.fats}g`} />
                )}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              {currentRecipe.servings && (
                <View style={styles.servingsAdjuster}>
                  <TouchableOpacity
                    onPress={() => setServings(Math.max(1, servings - 1))}
                    style={styles.servingsButton}
                  >
                    <Text style={styles.servingsButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.servingsText}>{servings}</Text>
                  <TouchableOpacity
                    onPress={() => setServings(servings + 1)}
                    style={styles.servingsButton}
                  >
                    <Text style={styles.servingsButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            {currentRecipe.ingredients.map((ingredient, index) => (
              <View key={ingredient.id || index} style={styles.ingredientItem}>
                <View style={styles.ingredientDot} />
                <Text style={styles.ingredientText}>
                  {ingredient.quantity && ingredient.quantity * servingsMultiplier !== 0
                    ? `${(ingredient.quantity * servingsMultiplier).toFixed(1)} `
                    : ''}
                  {ingredient.unit ? `${ingredient.unit} ` : ''}
                  {ingredient.name}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {currentRecipe.instructions.map((instruction, index) => (
              <View key={instruction.id || index} style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{instruction.step_number}</Text>
                </View>
                <View style={styles.instructionContent}>
                  <Text style={styles.instructionText}>{instruction.instruction_text}</Text>
                  {instruction.duration_minutes && (
                    <Text style={styles.instructionTime}>⏱ {instruction.duration_minutes} min</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const NutritionItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.nutritionItem}>
    <Text style={styles.nutritionValue}>{value}</Text>
    <Text style={styles.nutritionLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  heroImage: {
    width: '100%',
    height: 300,
    backgroundColor: COLORS.surface,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 28,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metaText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  actions: {
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  primaryAction: {
    width: '100%',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    justifyContent: 'center',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 22,
    color: COLORS.text,
  },
  servingsAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
  },
  servingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingsButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.background,
  },
  servingsText: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
    minWidth: 24,
    textAlign: 'center',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  nutritionItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  nutritionValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  nutritionLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 8,
  },
  ingredientText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.background,
  },
  instructionContent: {
    flex: 1,
  },
  instructionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  instructionTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
  },
});
