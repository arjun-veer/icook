import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { X, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { KeepAwake } from 'expo-keep-awake';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/Button';
import { Loading } from '@/components/Loading';
import { useRecipeStore } from '@/store/recipeStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/services/supabase';
import { cloudinaryService } from '@/services/cloudinary';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { DIFFICULTY_COINS } from '@/constants/app';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CookModeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();
  const { currentRecipe, fetchRecipeById, isLoading } = useRecipeStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (id) {
      fetchRecipeById(id);
    }
  }, [id]);

  const handleStepChange = (direction: 'next' | 'prev') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (direction === 'next' && currentStep < (currentRecipe?.instructions.length || 0)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
    } else if (direction === 'prev' && currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > SCREEN_WIDTH * 0.3) {
        if (e.translationX > 0 && currentStep > 0) {
          runOnJS(handleStepChange)('prev');
        } else if (e.translationX < 0 && currentStep < (currentRecipe?.instructions.length || 0)) {
          runOnJS(handleStepChange)('next');
        }
      }
      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleCapturePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please grant camera access to capture your dish');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled) {
        const imageUrl = await cloudinaryService.uploadImage(result.assets[0].uri, 'cooked');
        
        const coinsEarned = DIFFICULTY_COINS[currentRecipe?.difficulty || 'easy'];
        
        await supabase.from('cooked_logs').insert({
          user_id: user?.id,
          recipe_id: id,
          photo_url: imageUrl,
          coins_earned: coinsEarned,
        });

        await refreshUser();

        Alert.alert(
          '🎉 Congratulations!',
          `You earned ${coinsEarned} 🪙 Cook Coins!`,
          [
            {
              text: 'View Recipe',
              onPress: () => router.replace(`/recipe/${id}`),
            },
            {
              text: 'Go Home',
              onPress: () => router.replace('/(tabs)/home'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Capture photo error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  if (isLoading || !currentRecipe) {
    return <Loading />;
  }

  const isCompletionScreen = currentStep === currentRecipe.instructions.length;
  const currentInstruction = currentRecipe.instructions[currentStep];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeepAwake />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X size={28} color={COLORS.text} />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentStep} / {currentRecipe.instructions.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(currentStep / currentRecipe.instructions.length) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {isCompletionScreen ? (
        <View style={styles.completionScreen}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={styles.completionTitle}>You Did It!</Text>
          <Text style={styles.completionText}>
            Capture your masterpiece and earn Cook Coins!
          </Text>
          
          <Button
            title="I Cooked This!"
            onPress={handleCapturePhoto}
            size="large"
            icon={<Check size={24} color={COLORS.background} />}
            style={styles.completionButton}
          />
          
          <Button
            title="Skip for Now"
            onPress={() => router.back()}
            variant="outline"
            size="large"
          />
        </View>
      ) : (
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            <View style={styles.stepContent}>
              <View style={styles.stepHeader}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>Step {currentStep + 1}</Text>
                </View>
                {currentInstruction?.duration_minutes && (
                  <Text style={styles.stepDuration}>⏱ {currentInstruction.duration_minutes} min</Text>
                )}
              </View>

              <Text style={styles.instructionText}>
                {currentInstruction?.instruction_text}
              </Text>

              <View style={styles.navigation}>
                <TouchableOpacity
                  style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
                  onPress={() => handleStepChange('prev')}
                  disabled={currentStep === 0}
                >
                  <Text style={styles.navButtonText}>← Previous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => handleStepChange('next')}
                >
                  <Text style={styles.navButtonText}>
                    {currentStep === currentRecipe.instructions.length - 1 ? 'Finish' : 'Next →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.swipeHint}>👈 Swipe to navigate 👉</Text>
          </Animated.View>
        </GestureDetector>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  progressContainer: {
    gap: SPACING.xs,
  },
  progressText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  stepBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  stepBadgeText: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.background,
  },
  stepDuration: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  instructionText: {
    ...TYPOGRAPHY.cookMode,
    color: COLORS.text,
    lineHeight: 52,
    marginBottom: SPACING.xxl,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  navButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    ...TYPOGRAPHY.bodyLarge,
    fontWeight: '700',
    color: COLORS.text,
  },
  swipeHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  completionScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },
  completionEmoji: {
    fontSize: 80,
  },
  completionTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 36,
    color: COLORS.text,
  },
  completionText: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  completionButton: {
    marginTop: SPACING.lg,
    minWidth: 250,
  },
});
