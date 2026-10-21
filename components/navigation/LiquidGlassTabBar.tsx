import { useEffect, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import {
  Gamepad2,
  Home,
  Trophy,
  User as UserIcon,
  Users,
} from 'lucide-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '@/theme';
import { soundService } from '@/services/soundService';
import { useHaptics } from '@/hooks/useHaptics';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const BAR_H = 70;
const BAR_R = 24;
const NOTCH_HALF = 44;
const NOTCH_DEPTH = 34;
const CIRCLE = 52;
const CIRCLE_TOP = 5 - CIRCLE / 2;
const SIDE_MARGIN = 16;
const MAX_BAR_WIDTH = 500;
const OVERHANG = Math.abs(CIRCLE_TOP) + 10;
const CAPSULE_PADDING_H = 6;

interface LiquidGlassTabBarProps {
  state: BottomTabBarProps['state'];
  navigation: any;
  descriptors: Record<string, { options: { title?: string } }>;
}

const TAB_CONFIGS = {
  index: { label: 'Ana Sayfa', icon: Home, activeColor: colors.purpleSoft },
  oyna: { label: 'Oyna', icon: Gamepad2, activeColor: colors.orange },
  arkadaslar: { label: 'Arkadaşlar', icon: Users, activeColor: colors.purpleSoft },
  liderlik: { label: 'Liderlik', icon: Trophy, activeColor: colors.yellow },
  profil: { label: 'Profil', icon: UserIcon, activeColor: colors.lime },
} as const;

function clampX(width: number, x: number) {
  'worklet';
  const min = BAR_R + NOTCH_HALF;
  const max = width - BAR_R - NOTCH_HALF;
  return Math.min(Math.max(x, min), max);
}

function buildPath(width: number, centerX: number, depth: number) {
  'worklet';
  const left = centerX - NOTCH_HALF;
  const right = centerX + NOTCH_HALF;
  const controlLeft = NOTCH_HALF * 0.5;
  const controlRight = NOTCH_HALF * 0.46;

  return [
    `M ${BAR_R} 0`,
    `L ${left} 0`,
    `C ${left + controlLeft} 0 ${centerX - controlRight} ${depth} ${centerX} ${depth}`,
    `C ${centerX + controlRight} ${depth} ${right - controlLeft} 0 ${right} 0`,
    `L ${width - BAR_R} 0`,
    `A ${BAR_R} ${BAR_R} 0 0 1 ${width} ${BAR_R}`,
    `L ${width} ${BAR_H - BAR_R}`,
    `A ${BAR_R} ${BAR_R} 0 0 1 ${width - BAR_R} ${BAR_H}`,
    `L ${BAR_R} ${BAR_H}`,
    `A ${BAR_R} ${BAR_R} 0 0 1 0 ${BAR_H - BAR_R}`,
    `L 0 ${BAR_R}`,
    `A ${BAR_R} ${BAR_R} 0 0 1 ${BAR_R} 0`,
    'Z',
  ].join(' ');
}

type TabItemProps = {
  center: number;
  cx: SharedValue<number>;
  label: string;
  focused: boolean;
  icon: typeof Home;
  activeColor: string;
  onPress: () => void;
  onLongPress: () => void;
};

function TabItem({
  center,
  cx,
  label,
  focused,
  icon: Icon,
  activeColor,
  onPress,
  onLongPress,
}: TabItemProps) {
  const iconStyle = useAnimatedStyle(() => {
    const distance = Math.abs(cx.value - center);
    const visibility = interpolate(distance, [16, 62], [0, 1], Extrapolation.CLAMP);

    return {
      opacity: visibility,
      transform: [
        { scale: 0.55 + 0.45 * visibility },
        { translateY: (1 - visibility) * 10 },
      ],
    };
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tab}
    >
      <Animated.View style={[styles.inactiveIcon, iconStyle]}>
        <Icon color="rgba(255, 247, 255, 0.62)" size={21} strokeWidth={2.2} />
      </Animated.View>
      <Text
        numberOfLines={1}
        style={[
          styles.tabLabel,
          { color: focused ? activeColor : 'rgba(255, 247, 255, 0.55)' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function LiquidGlassTabBar({ state, navigation, descriptors }: LiquidGlassTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { trigger } = useHaptics();
  const shouldReduceMotion = useReducedMotion();

  const barWidth = Math.min(screenWidth - SIDE_MARGIN * 2, MAX_BAR_WIDTH);
  const routeCount = state.routes.length;
  const pad =
    routeCount > 1
      ? Math.max(0, (BAR_R + NOTCH_HALF - barWidth / (2 * routeCount)) / (1 - 1 / routeCount))
      : 0;
  const tabWidth = (barWidth - pad * 2) / routeCount;
  const centerOf = (index: number) => pad + tabWidth * (index + 0.5);

  const cx = useSharedValue(centerOf(state.index));
  const bump = useSharedValue(0);
  const pop = useSharedValue(1);
  const ripple = useSharedValue(1);
  const mounted = useRef(false);

  useEffect(() => {
    const target = centerOf(state.index);
    if (!mounted.current) {
      mounted.current = true;
      cx.value = target;
      return;
    }

    if (shouldReduceMotion) {
      cx.value = target;
      bump.value = 0;
      pop.value = 1;
      ripple.value = 1;
      return;
    }

    cx.value = withSpring(target, { damping: 15, stiffness: 150, mass: 0.9 });
    bump.value = withSequence(
      withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) }),
      withSpring(0, { damping: 9, stiffness: 160 }),
    );
    pop.value = withSequence(
      withTiming(0, { duration: 0 }),
      withSpring(1, { damping: 8, stiffness: 140 }),
    );
    ripple.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }),
    );
  }, [state.index, barWidth, shouldReduceMotion]);

  const pathProps = useAnimatedProps(() => ({
    d: buildPath(barWidth, clampX(barWidth, cx.value), NOTCH_DEPTH - bump.value * 8),
  }));

  const circleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: clampX(barWidth, cx.value) - CIRCLE / 2 },
      { translateY: -bump.value * 10 },
      { scale: 1 + bump.value * 0.06 },
    ],
  }));

  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: Math.min(pop.value * 1.4, 1),
    transform: [
      { scale: 0.4 + 0.6 * pop.value },
      { rotate: `${interpolate(pop.value, [0, 1], [-70, 0])}deg` },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - ripple.value) * 0.4,
    transform: [{ scale: 1 + ripple.value * 0.9 }],
  }));

  const activeRoute = state.routes[state.index];
  const activeConfig =
    TAB_CONFIGS[activeRoute.name as keyof typeof TAB_CONFIGS] ?? TAB_CONFIGS.index;
  const ActiveIcon = activeConfig.icon;
  const initialPath = buildPath(barWidth, clampX(barWidth, centerOf(state.index)), NOTCH_DEPTH);
  const bottomPosition = Math.max(insets.bottom, 12);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { bottom: bottomPosition, paddingTop: OVERHANG },
      ]}
    >
      <View style={[styles.bar, { width: barWidth }]}>
        <Svg width={barWidth} height={BAR_H} style={StyleSheet.absoluteFill}>
          <AnimatedPath d={initialPath} animatedProps={pathProps} fill={colors.bgSurfaceMuted} />
        </Svg>

        <View style={[styles.tabsRow, { paddingHorizontal: pad }]}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const config =
              TAB_CONFIGS[route.name as keyof typeof TAB_CONFIGS] ?? {
                label: descriptors[route.key]?.options.title ?? route.name,
                icon: Home,
                activeColor: colors.purpleSoft,
              };

            const onPress = () => {
              soundService.play('click');
              trigger('light');

              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              trigger('medium');
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            return (
              <TabItem
                key={route.key}
                center={centerOf(index)}
                cx={cx}
                label={config.label}
                focused={focused}
                icon={config.icon}
                activeColor={config.activeColor}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            );
          })}
        </View>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.circleWrap,
            { backgroundColor: activeConfig.activeColor },
            circleStyle,
          ]}
        >
          <Animated.View
            style={[styles.ring, { backgroundColor: activeConfig.activeColor }, ringStyle]}
          />
          <View style={styles.disc}>
            <Animated.View style={activeIconStyle}>
              <ActiveIcon color="#FFFFFF" size={23} strokeWidth={2.5} />
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 999,
    paddingHorizontal: SIDE_MARGIN,
  },
  bar: {
    height: BAR_H,
    shadowColor: '#000000',
    shadowOpacity: 0.32,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  tabsRow: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    height: BAR_H,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  inactiveIcon: {
    position: 'absolute',
    top: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    maxWidth: '100%',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 9,
    lineHeight: 13,
    textAlign: 'center',
  },
  circleWrap: {
    position: 'absolute',
    left: 0,
    top: CIRCLE_TOP,
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    ...StyleSheet.absoluteFill,
    borderRadius: CIRCLE / 2,
  },
  disc: {
    ...StyleSheet.absoluteFill,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bgSurfaceMuted,
    shadowColor: colors.purple,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
