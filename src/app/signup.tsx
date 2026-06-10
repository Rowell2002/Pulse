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
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !trimmedUsername || !password) {
      setErrorMsg('Please populate all input fields.');
      return;
    }

    if (trimmedName.length < 2) {
      setErrorMsg('Full name must be at least 2 characters.');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(trimmedUsername)) {
      setErrorMsg('Username must be 3-20 characters (letters, numbers, underscores).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      // Check if username is already taken by another user
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', trimmedUsername), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setErrorMsg('This username is already taken. Please choose another.');
        setIsSubmitting(false);
        return;
      }

      await signUp(trimmedEmail, password, trimmedName, trimmedUsername);
      // The Auth Guard redirect in _layout.tsx will navigate to /onboarding automatically
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create your account.');
    } finally {
      setIsSubmitting(false);
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
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.inactiveTab}
                onPress={() => router.push('/')}
              >
                <Text style={styles.inactiveTabText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} style={styles.activeTab}>
                <Text style={styles.activeTabText}>Create Account</Text>
              </TouchableOpacity>
            </View>

            {/* Error Message Panel */}
            {errorMsg && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Inputs */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>FULL NAME</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    isNameFocused && styles.inputFocused,
                  ]}
                >
                  <User size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Alex Johnson"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setIsNameFocused(true)}
                    onBlur={() => setIsNameFocused(false)}
                    editable={!isSubmitting}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>USERNAME</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    isUsernameFocused && styles.inputFocused,
                  ]}
                >
                  <User size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="alex_johnson"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    autoCapitalize="none"
                    value={username}
                    onChangeText={setUsername}
                    onFocus={() => setIsUsernameFocused(true)}
                    onBlur={() => setIsUsernameFocused(false)}
                    editable={!isSubmitting}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    isEmailFocused && styles.inputFocused,
                  ]}
                >
                  <Mail size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="athlete@pulse.com"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    editable={!isSubmitting}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PASSWORD</Text>
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
                onPress={handleSignUp}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.buttonText}>Get Started</Text>
                )}
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Footer Text */}
          <Text style={styles.footerText}>
            By signing up, you agree to our{' '}
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
