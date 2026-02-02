import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, LogOut, Trophy, Camera } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/services/supabase';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '@/constants/theme';
import { CHEF_TIERS } from '@/constants/app';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [stats, setStats] = useState({
    totalRecipes: 0,
    totalCooked: 0,
    currentStreak: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    if (!user) return;

    const [recipesResult, cookedResult] = await Promise.all([
      supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('cooked_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);

    setStats({
      totalRecipes: recipesResult.count || 0,
      totalCooked: cookedResult.count || 0,
      currentStreak: 0,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

  const chefTier = CHEF_TIERS.find(tier => tier.level === user?.chef_tier) || CHEF_TIERS[0];
  const nextTier = CHEF_TIERS[Math.min((user?.chef_tier || 0) + 1, CHEF_TIERS.length - 1)];
  const progress = user?.cook_coins 
    ? Math.min((user.cook_coins - chefTier.coinsRequired) / (nextTier.coinsRequired - chefTier.coinsRequired), 1)
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Settings size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.full_name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          
          <Text style={styles.name}>{user?.full_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.tierSection}>
          <View style={styles.tierBadge}>
            <Trophy size={20} color={chefTier.color} />
            <Text style={[styles.tierName, { color: chefTier.color }]}>
              {chefTier.name}
            </Text>
          </View>
          
          <View style={styles.coinsContainer}>
            <Text style={styles.coins}>🪙 {user?.cook_coins || 0}</Text>
            <Text style={styles.coinsLabel}>Cook Coins</Text>
          </View>

          {user?.chef_tier !== CHEF_TIERS.length - 1 && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {nextTier.coinsRequired - (user?.cook_coins || 0)} coins to {nextTier.name}
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
            </View>
          )}
        </View>

        <View style={styles.statsSection}>
          <StatCard label="Recipes" value={stats.totalRecipes} />
          <StatCard label="Cooked" value={stats.totalCooked} />
          <StatCard label="Streak" value={`${stats.currentStreak}d`} />
        </View>

        <View style={styles.gallerySection}>
          <Text style={styles.sectionTitle}>Cooked It Gallery</Text>
          <View style={styles.galleryPlaceholder}>
            <Camera size={48} color={COLORS.textSecondary} />
            <Text style={styles.galleryText}>Your cooking photos will appear here</Text>
          </View>
        </View>

        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="outline"
          icon={<LogOut size={20} color={COLORS.primary} />}
          style={styles.signOutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const StatCard: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatarContainer: {
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.background,
  },
  name: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  email: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  tierSection: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tierName: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
  },
  coinsContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  coins: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },
  coinsLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
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
    height: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  statsSection: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  gallerySection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  galleryPlaceholder: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  galleryText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  signOutButton: {
    marginTop: SPACING.md,
  },
});
