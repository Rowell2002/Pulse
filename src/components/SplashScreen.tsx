import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS } from '../theme/colors';

export const SplashScreen: React.FC = () => {
  // Animation values
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const dotOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Subtitle fade in
      Animated.timing(textOpacity, {
        toValue: 0.7,
        duration: 600,
        useNativeDriver: true,
      }).start();
    });

    // Pulsing ring animations loop
    const createPulseAnimation = (val: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(val, {
              toValue: 1,
              duration: 2000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    };

    // Glowing status dot animation loop
    const dotAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    const anim1 = createPulseAnimation(pulse1, 0);
    const anim2 = createPulseAnimation(pulse2, 1000);

    anim1.start();
    anim2.start();
    dotAnim.start();

    return () => {
      anim1.stop();
      anim2.stop();
      dotAnim.stop();
    };
  }, []);

  // Map pulse values to scale and opacity
  const pulseScale1 = pulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 2.2],
  });

  const pulseOpacity1 = pulse1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.4, 0],
  });

  const pulseScale2 = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 2.2],
  });

  const pulseOpacity2 = pulse2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.4, 0],
  });

  return (
    <View style={styles.container}>
      {/* Background Pulsing Rings */}
      <View style={styles.ringContainer}>
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseScale1 }],
              opacity: pulseOpacity1,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseScale2 }],
              opacity: pulseOpacity2,
            },
          ]}
        />
      </View>

      {/* Main Logo & Branding */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
          },
        ]}
      >
        <Text style={styles.brandTitle}>PULSE</Text>
        <Animated.Text style={[styles.brandTagline, { opacity: textOpacity }]}>
          PUSH YOUR LIMITS
        </Animated.Text>
      </Animated.View>

      {/* Small Glowing Status Indicator */}
      <View style={styles.footer}>
        <View style={styles.loaderWrapper}>
          <Text style={styles.loadingText}>SECURE CONTEXT LOADING</Text>
          <Animated.View style={[styles.glowDot, { opacity: dotOpacity }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  pulseRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  logoContainer: {
    alignItems: 'center',
    zIndex: 2,
  },
  brandTitle: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -2,
    color: COLORS.primary,
    textShadowColor: 'rgba(204, 255, 0, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    fontFamily: 'System',
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 6,
    color: '#FFFFFF',
    marginTop: 8,
    fontFamily: 'System',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    zIndex: 2,
  },
  loaderWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  glowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
});
