import React, { useEffect } from 'react';
import { StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  FadeIn,
  FadeInUp,
  FadeInDown,
  ZoomIn,
} from 'react-native-reanimated';

/**
 * Gentle floating animation for mascots (gives 3D mascot a breathing, lively game feel)
 */
export function MascotFloat({
  children,
  style,
  offset,
  floatDistance = 8,
  duration = 2400,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  offset?: number;
  floatDistance?: number;
  duration?: number;
}) {
  const actualOffset = offset ?? floatDistance;
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-actualOffset, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [actualOffset, duration, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

/**
 * Subtle pulse animation for active badges (e.g. CANLI, SÜRE DOLUYOR, HAZIR)
 */
export function PulseView({
  children,
  style,
  scale,
  minScale = 0.98,
  maxScale = 1.05,
  duration = 1400,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scale?: number;
  minScale?: number;
  maxScale?: number;
  duration?: number;
}) {
  const targetScale = scale ?? maxScale;
  const baseScale = scale ? 1 : minScale;
  const pulse = useSharedValue(baseScale);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(targetScale, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(baseScale, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [targetScale, baseScale, duration, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

/**
 * Playful shake animation for penalties (-40 ZARTALANDIN)
 */
export function ShakeView({
  children,
  style,
  triggerKey,
  intensity = 6,
  delay = 0,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  triggerKey?: any;
  intensity?: number;
  delay?: number;
}) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      translateX.value = withSequence(
        withTiming(-intensity, { duration: 60 }),
        withTiming(intensity, { duration: 60 }),
        withTiming(-intensity * 0.6, { duration: 60 }),
        withTiming(intensity * 0.6, { duration: 60 }),
        withTiming(0, { duration: 60 })
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, [triggerKey, intensity, delay, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

/**
 * Bouncy spring pop for success states (+100 DOĞRU, +50 ZARTALADIN, Trophy)
 */
export function PopView({
  children,
  style,
  delay = 0,
  duration,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  duration?: number;
}) {
  let enterAnim = ZoomIn.delay(delay).springify().damping(12).stiffness(120);
  if (duration) {
    enterAnim = enterAnim.duration(duration);
  }

  return (
    <Animated.View entering={enterAnim} style={style}>
      {children}
    </Animated.View>
  );
}

/**
 * Staggered entrance for list rows, options, and cards
 */
export function StaggerRow({
  children,
  index = 0,
  baseDelay,
  delay,
  style,
  direction = 'up',
}: {
  children: React.ReactNode;
  index?: number;
  baseDelay?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  direction?: 'up' | 'down';
}) {
  const step = delay ?? baseDelay ?? 50;
  const totalDelay = index * step;

  const enterAnim =
    direction === 'down'
      ? FadeInDown.delay(totalDelay)
          .springify()
          .damping(14)
      : FadeInUp.delay(totalDelay)
          .springify()
          .damping(14);

  return (
    <Animated.View entering={enterAnim} style={style}>
      {children}
    </Animated.View>
  );
}
