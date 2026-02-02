import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'lucide-react-native';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { MealPlan } from '@/types';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '@/constants/theme';

export default function MealPlanScreen() {
  const { user } = useAuthStore();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchMealPlans();
  }, [selectedDate]);

  const fetchMealPlans = async () => {
    if (!user) return;

    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const { data } = await supabase
      .from('meal_plans')
      .select('*, recipe:recipes(*)')
      .eq('user_id', user.id)
      .gte('meal_date', startOfWeek.toISOString().split('T')[0])
      .lte('meal_date', endOfWeek.toISOString().split('T')[0]);

    if (data) {
      setMealPlans(data);
    }
  };

  const getDaysOfWeek = () => {
    const days = [];
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return days;
  };

  const getMealsForDay = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return mealPlans.filter(mp => mp.meal_date === dateString);
  };

  const days = getDaysOfWeek();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Calendar size={24} color={COLORS.primary} />
        <Text style={styles.headerTitle}>Weekly Meal Plan</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {days.map((day, index) => {
          const dayMeals = getMealsForDay(day);
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <View key={index} style={styles.dayCard}>
              <View style={[styles.dayHeader, isToday && styles.dayHeaderToday]}>
                <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                  {weekDays[day.getDay()]}
                </Text>
                <Text style={[styles.dayDate, isToday && styles.dayDateToday]}>
                  {day.getDate()}
                </Text>
              </View>

              <View style={styles.mealsContainer}>
                {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
                  const meal = dayMeals.find(m => m.meal_type === mealType);
                  
                  return (
                    <View key={mealType} style={styles.mealSlot}>
                      <Text style={styles.mealType}>
                        {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                      </Text>
                      {meal?.recipe ? (
                        <Text style={styles.mealName} numberOfLines={1}>
                          {meal.recipe.title}
                        </Text>
                      ) : (
                        <Text style={styles.mealEmpty}>Not planned</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  dayCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surfaceLight,
  },
  dayHeaderToday: {
    backgroundColor: COLORS.primary,
  },
  dayName: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  dayNameToday: {
    color: COLORS.background,
  },
  dayDate: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  dayDateToday: {
    color: COLORS.background,
  },
  mealsContainer: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  mealSlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  mealType: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
    width: 80,
  },
  mealName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
  },
  mealEmpty: {
    ...TYPOGRAPHY.body,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
    flex: 1,
  },
});
