import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Link, Camera, Image as ImageIcon, Sparkles } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Loading } from '@/components/Loading';
import { geminiService } from '@/services/gemini';
import { cloudinaryService } from '@/services/cloudinary';
import { useRecipeStore } from '@/store/recipeStore';
import { AIRecipeExtraction } from '@/types';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '@/constants/theme';

export default function AIImportScreen() {
  const router = useRouter();
  const createRecipe = useRecipeStore((state) => state.createRecipe);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [extractedRecipe, setExtractedRecipe] = useState<AIRecipeExtraction | null>(null);

  const handleUrlImport = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    try {
      setLoading(true);
      const recipe = await geminiService.extractRecipeFromUrl(url);
      setExtractedRecipe(recipe);
    } catch (error) {
      console.error('URL import error:', error);
      Alert.alert('Error', 'Failed to extract recipe from URL. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageImport = async (fromCamera: boolean) => {
    try {
      const permission = fromCamera 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please grant camera/gallery access');
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            base64: true,
          });

      if (!result.canceled && result.assets[0].base64) {
        setLoading(true);
        const recipe = await geminiService.extractRecipeFromImage(result.assets[0].base64);
        
        const imageUrl = await cloudinaryService.uploadImage(result.assets[0].uri, 'recipes');
        
        setExtractedRecipe({
          ...recipe,
          image_url: imageUrl,
        } as any);
      }
    } catch (error) {
      console.error('Image import error:', error);
      Alert.alert('Error', 'Failed to extract recipe from image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!extractedRecipe) return;

    try {
      setLoading(true);
      const recipeId = await createRecipe({
        title: extractedRecipe.title,
        description: extractedRecipe.description,
        source_type: url ? 'url' : 'image',
        source_url: url || undefined,
        prep_time: extractedRecipe.prep_time,
        cook_time: extractedRecipe.cook_time,
        servings: extractedRecipe.servings,
        difficulty: extractedRecipe.difficulty,
        image_url: (extractedRecipe as any).image_url,
        category: extractedRecipe.category,
        cuisine_type: extractedRecipe.cuisine_type,
        dietary_labels: extractedRecipe.dietary_labels,
        is_public: false,
        ingredients: extractedRecipe.ingredients,
        instructions: extractedRecipe.instructions,
        nutrition_info: extractedRecipe.nutrition_info,
      });

      Alert.alert('Success', 'Recipe imported successfully!', [
        {
          text: 'View Recipe',
          onPress: () => router.replace(`/recipe/${recipeId}`),
        },
      ]);
    } catch (error) {
      console.error('Save recipe error:', error);
      Alert.alert('Error', 'Failed to save recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (extractedRecipe) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Review Recipe</Text>
          
          <View style={styles.previewCard}>
            <Text style={styles.recipeTitle}>{extractedRecipe.title}</Text>
            {extractedRecipe.description && (
              <Text style={styles.recipeDescription}>{extractedRecipe.description}</Text>
            )}
            
            <View style={styles.metaRow}>
              {extractedRecipe.prep_time && (
                <Text style={styles.metaText}>Prep: {extractedRecipe.prep_time}m</Text>
              )}
              {extractedRecipe.cook_time && (
                <Text style={styles.metaText}>Cook: {extractedRecipe.cook_time}m</Text>
              )}
              {extractedRecipe.servings && (
                <Text style={styles.metaText}>Serves: {extractedRecipe.servings}</Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>Ingredients ({extractedRecipe.ingredients.length})</Text>
            {extractedRecipe.ingredients.slice(0, 3).map((ing, idx) => (
              <Text key={idx} style={styles.listItem}>• {ing.name}</Text>
            ))}
            {extractedRecipe.ingredients.length > 3 && (
              <Text style={styles.moreText}>+ {extractedRecipe.ingredients.length - 3} more</Text>
            )}

            <Text style={styles.sectionTitle}>Instructions ({extractedRecipe.instructions.length} steps)</Text>
            {extractedRecipe.instructions.slice(0, 2).map((inst, idx) => (
              <Text key={idx} style={styles.listItem}>
                {inst.step_number}. {inst.instruction_text}
              </Text>
            ))}
            {extractedRecipe.instructions.length > 2 && (
              <Text style={styles.moreText}>+ {extractedRecipe.instructions.length - 2} more steps</Text>
            )}
          </View>

          <View style={styles.actions}>
            <Button
              title="Save Recipe"
              onPress={handleSaveRecipe}
              icon={<Sparkles size={20} color={COLORS.background} />}
            />
            <Button
              title="Start Over"
              onPress={() => {
                setExtractedRecipe(null);
                setUrl('');
              }}
              variant="outline"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Sparkles size={32} color={COLORS.primary} />
          <Text style={styles.title}>AI Recipe Import</Text>
          <Text style={styles.subtitle}>
            Extract recipes from URLs, photos, or food images
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Import from URL</Text>
          <Input
            placeholder="Paste recipe URL here..."
            value={url}
            onChangeText={setUrl}
            icon={<Link size={20} color={COLORS.textSecondary} />}
          />
          <Button
            title="Extract Recipe"
            onPress={handleUrlImport}
            icon={<Sparkles size={20} color={COLORS.background} />}
          />
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Import from Image</Text>
          <View style={styles.imageButtons}>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={() => handleImageImport(true)}
            >
              <Camera size={32} color={COLORS.primary} />
              <Text style={styles.imageButtonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageButton}
              onPress={() => handleImageImport(false)}
            >
              <ImageIcon size={32} color={COLORS.primary} />
              <Text style={styles.imageButtonText}>Choose Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    ...TYPOGRAPHY.h3,
    fontSize: 18,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.md,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  imageButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.medium,
  },
  imageButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  recipeTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  recipeDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  listItem: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  moreText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  actions: {
    gap: SPACING.md,
  },
});
