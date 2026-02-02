import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogIn, Mail, Sparkles, BookOpen, Award } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/authStore';
import { Toast } from '@/components/Toast';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ 
    visible: false, 
    message: '', 
    type: 'error' 
  });

  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Sign in error:', error);
      setToast({
        visible: true,
        message: 'Failed to sign in. Please try again.',
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
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>👨‍🍳</Text>
          </View>
          <Text style={styles.title}>iCook</Text>
          <Text style={styles.subtitle}>Your Personal AI Chef Companion</Text>
        </View>
        <View style={styles.footer}>
          <Button title="Sign In with Email" onPress={() => router.push('/(auth)/signin')} icon={<Mail size={20} color={COLORS.background} />} style={styles.emailButton} />
          <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>OR</Text><View style={styles.dividerLine} /></View>
          <Button title="Continue with Google" onPress={handleGoogleSignIn} loading={loading} icon={<LogIn size={20} color={COLORS.text} />} variant="secondary" />
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')} style={styles.signUpButton}><Text style={styles.signUpText}>Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text></Text></TouchableOpacity>
          <Text style={styles.terms}>By continuing, you agree to our Terms of Service and Privacy Policy</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: SPACING.lg, justifyContent: 'space-between', paddingBottom: SPACING.lg },
  header: { alignItems: 'center', marginTop: SPACING.xxl, paddingTop: SPACING.xl },
  logoContainer: { width: 120, height: 120, borderRadius: 30, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg },
  logo: { fontSize: 64 },
  title: { ...TYPOGRAPHY.h1, fontSize: 48, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.sm, letterSpacing: -1 },
  subtitle: { ...TYPOGRAPHY.bodyLarge, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: SPACING.lg },
  footer: { gap: SPACING.md },
  emailButton: { backgroundColor: COLORS.primary },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.xs },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { ...TYPOGRAPHY.small, color: COLORS.textSecondary, marginHorizontal: SPACING.md, fontWeight: '500' },
  signUpButton: { alignItems: 'center', paddingVertical: SPACING.sm },
  signUpText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  signUpLink: { color: COLORS.primary, fontWeight: '600' },
  terms: { ...TYPOGRAPHY.small, color: COLORS.textTertiary, textAlign: 'center', marginTop: SPACING.xs, lineHeight: 18 },
});
