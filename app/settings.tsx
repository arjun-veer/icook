import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Crown, Bell, Lock, HelpCircle, FileText, Trash2, ChevronRight } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { isPro } = useSubscriptionStore();
  const [notifications, setNotifications] = useState(true);

  const handleUpgradeToPro = () => {
    Alert.alert('Upgrade to Pro', 'Pro features coming soon!');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {!isPro && (
          <TouchableOpacity style={styles.proCard} onPress={handleUpgradeToPro}>
            <View style={styles.proIconContainer}>
              <Crown size={32} color={COLORS.background} />
            </View>
            <View style={styles.proContent}>
              <Text style={styles.proTitle}>Upgrade to Pro</Text>
              <Text style={styles.proText}>
                Unlimited AI imports, advanced nutrition, and more
              </Text>
            </View>
            <ChevronRight size={24} color={COLORS.text} />
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <SettingRow
            icon={<Bell size={20} color={COLORS.text} />}
            title="Notifications"
            subtitle={notifications ? 'Enabled' : 'Disabled'}
            onPress={() => setNotifications(!notifications)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <SettingRow
            icon={<Lock size={20} color={COLORS.text} />}
            title="Privacy"
            onPress={() => Alert.alert('Privacy', 'Privacy settings coming soon')}
          />
          
          <SettingRow
            icon={<FileText size={20} color={COLORS.text} />}
            title="Terms of Service"
            onPress={() => Alert.alert('Terms', 'Terms of Service')}
          />
          
          <SettingRow
            icon={<HelpCircle size={20} color={COLORS.text} />}
            title="Help & Support"
            onPress={() => Alert.alert('Help', 'Contact support@icook.app')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          
          <SettingRow
            icon={<Trash2 size={20} color={COLORS.error} />}
            title="Delete Account"
            subtitle="Permanently delete your account and data"
            onPress={handleDeleteAccount}
            danger
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.version}>iCook v1.0.0</Text>
          <Text style={styles.copyright}>© 2026 iCook. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({ icon, title, subtitle, onPress, danger }) => (
  <TouchableOpacity style={styles.settingRow} onPress={onPress}>
    <View style={styles.settingIcon}>{icon}</View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    <ChevronRight size={20} color={COLORS.textSecondary} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.large,
  },
  proIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  proContent: {
    flex: 1,
  },
  proTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.background,
    marginBottom: 4,
  },
  proText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.background,
    opacity: 0.9,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  settingIcon: {
    marginRight: SPACING.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  settingTitleDanger: {
    color: COLORS.error,
  },
  settingSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    paddingTop: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  version: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  copyright: {
    ...TYPOGRAPHY.small,
    color: COLORS.textTertiary,
  },
});
