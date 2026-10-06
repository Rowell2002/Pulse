import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ChatProvider } from '../context/ChatContext';
import { SplashScreen } from '../components/SplashScreen';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    // Cast segments to standard string array for flexible routing checks
    const segmentList = segments as string[];

    // Determine target location category
    const inAuthGroup =
      segmentList[0] === '(tabs)' ||
      segmentList[0] === 'workout' ||
      segmentList[0] === 'profile' ||
      segmentList[0] === 'notifications' ||
      segmentList[0] === 'search-filters' ||
      segmentList[0] === 'chat' ||
      segmentList[0] === 'subscription';

    const isOnboarding = segmentList[0] === 'onboarding';

    if (!user) {
      // Redirect to Login if attempting to view a secured screen
      if (inAuthGroup || isOnboarding) {
        router.replace('/');
      }
    } else {
      // Authenticated user: check profile completeness
      const isProfileIncomplete = !userData || !userData.selectedGoal;

      if (isProfileIncomplete) {
        // Route to onboarding if not yet there
        if (!isOnboarding) {
          router.replace('/onboarding');
        }
      } else {
        // Authenticated and complete: redirect away from auth gateway pages
        if (
          segmentList[0] === 'index' ||
          segmentList.length === 0 ||
          segmentList[0] === '' ||
          segmentList[0] === 'signup' ||
          isOnboarding
        ) {
          router.replace('/(tabs)/home' as any);
        }
      }
    }
  }, [user, userData, loading, segments]);

  if (loading) {
    return <SplashScreen />;
  }

  return <ChatProvider>{children}</ChatProvider>;
}

import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import { StripeProvider } from '@stripe/stripe-react-native';

function ThemedAppStack() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="subscription/paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="workout/details" />
      <Stack.Screen name="workout/active" />
      <Stack.Screen name="workout/summary" />
      <Stack.Screen name="workout/assigned_details" />
      <Stack.Screen name="workout/assigned_active" />
      <Stack.Screen name="profile/edit" />
      <Stack.Screen name="profile/settings" />
      <Stack.Screen name="profile/client-stats" />
      <Stack.Screen name="profile/weight" />
      <Stack.Screen name="profile/photos" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="search-filters" />
      <Stack.Screen name="chat/[id]" />
      <Stack.Screen name="chat/group/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51BTUDGJAJfZb9HEBwDg561ggHpoqGeScS52o9o9x';

  return (
    <SafeAreaProvider style={{ backgroundColor: '#000000' }}>
      <StripeProvider
        publishableKey={stripePublishableKey}
        merchantIdentifier="merchant.com.chethanarowell.pulse"
      >
        <AuthProvider>
          <SubscriptionProvider>
            <ThemeProvider>
              <AuthGuard>
                <ThemedAppStack />
              </AuthGuard>
            </ThemeProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
