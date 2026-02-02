import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuthStore } from '@/store/authStore';
import { Toast } from '@/components/Toast';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const signUpWithEmail = useAuthStore((state) => state.signUpWithEmail);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ 
    visible: false, 
    message: '', 
    type: 'error' 
  });

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setToast({
        visible: true,
        message: 'Please fill in all fields',
        type: 'error',
      });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setToast({
        visible: true,
        message: 'Please enter a valid email address',
        type: 'error',
      });
      return;
    }

    if (password.length < 6) {
      setToast({
        visible: true,
        message: 'Password must be at least 6 characters long',
        type: 'error',
      });
      return;
    }

    if (password !== confirmPassword) {
      setToast({
        visible: true,
        message: 'Passwords do not match',
        type: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      await signUpWithEmail(email, password, fullName);
      setToast({
        visible: true,
        message: 'Account created successfully!',
        type: 'success',
      });
      setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 1000);
    } catch (error: any) {
      console.error('Sign up error:', error);
      setToast({
        visible: true,
        message: error.message || 'Failed to create account. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.logo}>👨‍🍳</Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join iCook and start your culinary adventure</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="John Doe"
              autoCapitalize="words"
              autoComplete="name"
              icon={<User size={20} color={COLORS.textSecondary} />}
            />

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              icon={<Mail size={20} color={COLORS.textSecondary} />}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              icon={<Lock size={20} color={COLORS.textSecondary} />}
            />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              icon={<Lock size={20} color={COLORS.textSecondary} />}
            />

            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={loading}
              style={styles.signUpButton}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signin')}>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  backButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logo: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 32,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  form: {
    gap: SPACING.md,
  },
  signUpButton: {
    marginTop: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  footerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  linkText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
