import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithApple, isAppleSupported } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUsernameOrEmailFocused, setIsUsernameOrEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  const handleSignIn = async () => {
    const input = usernameOrEmail.trim();
    if (!input || !password) {
      setErrorMsg('Please enter both username/email and password.');
      return;
    }

    if (input.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input)) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
    } else {
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(input)) {
        setErrorMsg('Username must be 3-20 characters (letters, numbers, and underscores only).');
        return;
      }
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await signIn(input, password);
      // Auth Guard in _layout.tsx will handle the redirection automatically
    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    setErrorMsg(null);
    setSocialLoading(provider);
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithApple();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Social sign in failed.');
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA00ZWJemwkcwEC9YyiENlgJX1rzDQ5FIpyVzHywILR4go66Ht20YbX1YlKZJ8oZYWCAkFEMKhO5HoW3n7wt46FQxMGmWmABkeQ0HLAQeJiu6YwFcqHipOw4mxzVQvliOdgb2sDheYaq6yqiaHS4kXM4C5CXHpy-vwIgd-sApLs40JYLQlxSYBoYj7v4uELt-ffbWnrAamAG4enWTRzsT9F9MheGsuOFR4bH0hFhEwheezxf1NCrcJUZXthxUtHis0jj2YWAkWsZANl',
      }}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.gradientOverlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Header */}
          <View style={styles.header}>
            <Text style={styles.brandTitle}>PULSE</Text>
            <Text style={styles.brandTagline}>PUSH YOUR LIMITS</Text>
          </View>

          {/* Auth Card */}
          <GlassCard style={styles.card}>
            {/* Tab Selector */}
            <View style={styles.tabContainer}>
              <TouchableOpacity activeOpacity={0.8} style={styles.activeTab}>
                <Text style={styles.activeTabText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.inactiveTab}
                onPress={() => router.push('/signup')}
              >
                <Text style={styles.inactiveTabText}>Create Account</Text>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {errorMsg && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Inputs */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>USERNAME OR EMAIL ADDRESS</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    isUsernameOrEmailFocused && styles.inputFocused,
                  ]}
                >
                  {usernameOrEmail.includes('@') ? (
                    <Mail size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  ) : (
                    <User size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  )}
                  <TextInput
                    style={styles.input}
                    placeholder="username or athlete@pulse.com"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="default"
                    autoCapitalize="none"
                    value={usernameOrEmail}
                    onChangeText={setUsernameOrEmail}
                    onFocus={() => setIsUsernameOrEmailFocused(true)}
                    onBlur={() => setIsUsernameOrEmailFocused(false)}
                    editable={!isSubmitting}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>PASSWORD</Text>
                  <TouchableOpacity activeOpacity={0.8}>
                    <Text style={styles.forgotText}>Forgot?</Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    styles.inputWrapper,
                    isPasswordFocused && styles.inputFocused,
                  ]}
                >
                  <Lock size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    editable={!isSubmitting}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={COLORS.textMuted} />
                    ) : (
                      <Eye size={18} color={COLORS.textMuted} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.button, isSubmitting && styles.disabledButton]}
                onPress={handleSignIn}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Social Authentication */}
            <View style={styles.socialSection}>
              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.socialText}>OR CONTINUE WITH</Text>
                <View style={styles.divider} />
              </View>

              <View style={styles.socialButtons}>
                {isAppleSupported && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.socialButton, socialLoading !== null && styles.disabledButton]}
                    onPress={() => handleSocialSignIn('apple')}
                    disabled={isSubmitting || socialLoading !== null}
                  >
                    {socialLoading === 'apple' ? (
                      <ActivityIndicator size="small" color={COLORS.textPrimary} />
                    ) : (
                      <Text style={styles.socialButtonText}> Apple</Text>
                    )}
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.socialButton, socialLoading !== null && styles.disabledButton]}
                  onPress={() => handleSocialSignIn('google')}
                  disabled={isSubmitting || socialLoading !== null}
                >
                  {socialLoading === 'google' ? (
                    <ActivityIndicator size="small" color={COLORS.textPrimary} />
                  ) : (
                    <Text style={styles.socialButtonText}>Google</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </GlassCard>

          {/* Footer Text */}
          <Text style={styles.footerText}>
            By joining, you agree to our{' '}
            <Text style={styles.footerLink}>Terms of Service</Text> and{' '}
            <Text style={styles.footerLink}>Privacy Policy</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    gap: 32,
  },
  header: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    color: COLORS.primary,
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  card: {
    paddingVertical: 24,
    gap: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  activeTabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  inactiveTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  inactiveTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textMuted,
    opacity: 0.6,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: COLORS.textMuted,
    paddingLeft: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 52,
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  socialSection: {
    gap: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  socialText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    color: COLORS.textMuted,
    opacity: 0.4,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 16,
  },
  footerLink: {
    textDecorationLine: 'underline',
  },
});
