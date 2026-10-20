import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import {
  Home,
  Gamepad2,
  Users,
  Trophy,
  User as UserIcon,
} from 'lucide-react-native';
import { colors, radii, shadows } from '@/theme';
import { soundService } from '@/services/soundService';
import { useHaptics } from '@/hooks/useHaptics';

export interface LiquidGlassTabBarProps {
  state: {
    index: number;
    routes: Array<{ key: string; name: string; params?: any }>;
  };
  navigation: any;
  descriptors?: Record<string, any>;
  insets?: any;
}

interface TabConfig {
  name: string;
  label: string;
  icon: typeof Home;
  activeColor: string;
  isSpecial?: boolean;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  index: {
    name: 'index',
    label: 'Ana Sayfa',
    icon: Home,
    activeColor: colors.purpleSoft,
  },
  oyna: {
    name: 'oyna',
    label: 'Oyna',
    icon: Gamepad2,
    activeColor: colors.orange,
    isSpecial: true,
  },
  arkadaslar: {
    name: 'arkadaslar',
    label: 'Arkadaşlar',
    icon: Users,
    activeColor: colors.purpleSoft,
  },
  liderlik: {
    name: 'liderlik',
    label: 'Liderlik',
    icon: Trophy,
    activeColor: colors.yellow,
  },
  profil: {
    name: 'profil',
    label: 'Profil',
    icon: UserIcon,
    activeColor: colors.lime,
  },
};

export function LiquidGlassTabBar({
  state,
  navigation,
}: LiquidGlassTabBarProps) {
  const insets = useSafeAreaInsets();
  const { trigger } = useHaptics();
  const shouldReduceMotion = useReducedMotion();

  const [containerWidth, setContainerWidth] = useState(0);
  const tabWidth = containerWidth > 0 ? containerWidth / state.routes.length : 0;

  // Reanimated shared value for indicator sliding
  const indicatorTranslateX = useSharedValue(0);

  useEffect(() => {
    if (tabWidth > 0) {
      const targetX = state.index * tabWidth;
      if (shouldReduceMotion) {
        indicatorTranslateX.value = targetX;
      } else {
        indicatorTranslateX.value = withSpring(targetX, {
          damping: 24,
          stiffness: 220,
          mass: 0.8,
        });
      }
    }
  }, [state.index, tabWidth, shouldReduceMotion, indicatorTranslateX]);

  const onContainerLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
      indicatorTranslateX.value = state.index * (width / state.routes.length);
    }
  };

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorTranslateX.value }],
      width: tabWidth > 0 ? tabWidth : '20%',
    };
  });

  const bottomPosition = Math.max(insets.bottom, 12);

  return (
    <View
      style={[
        styles.outerWrapper,
        { bottom: bottomPosition },
      ]}
      pointerEvents="box-none"
    >
      {/* Liquid Glass Capsule Container */}
      <View style={styles.floatingCapsule} onLayout={onContainerLayout}>
        {/* Real Blur Backdrop */}
        <BlurView
          intensity={Platform.OS === 'ios' ? 75 : 60}
          tint={Platform.OS === 'ios' ? 'systemChromeMaterialDark' : 'dark'}
          style={StyleSheet.absoluteFill}
        />

        {/* Ambient Glass Color Wash & Gradient */}
        <LinearGradient
          colors={[
            'rgba(30, 20, 50, 0.65)',
            'rgba(18, 12, 32, 0.78)',
            'rgba(14, 8, 24, 0.88)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Top Specular Rim Reflection (Light Catcher) */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.35)',
            'rgba(255, 255, 255, 0.08)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.specularTopBorder}
        />

        {/* Sliding Active Indicator Pill */}
        {tabWidth > 0 && (
          <Animated.View
            style={[styles.indicatorTrack, animatedIndicatorStyle]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.14)',
                'rgba(255, 255, 255, 0.06)',
                'rgba(255, 255, 255, 0.02)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.indicatorPill}
            />
          </Animated.View>
        )}

        {/* Tab Items Row */}
        <View style={styles.tabsRow}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const config = TAB_CONFIGS[route.name] || {
              name: route.name,
              label: route.name,
              icon: Home,
              activeColor: colors.orange,
            };

            const IconComponent = config.icon;

            const onPress = () => {
              soundService.play('click');
              trigger('light');

              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              trigger('medium');
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={config.label}
                onPress={onPress}
                onLongPress={onLongPress}
                style={({ pressed }) => [
                  styles.tabButton,
                  {
                    transform: [{ scale: pressed ? 0.92 : 1 }],
                  },
                ]}
              >
                {config.isSpecial ? (
                  // Center "Oyna" Button with FoxMasque Signature Accent
                  <View
                    style={[
                      styles.specialBtnOuter,
                      isFocused && styles.specialBtnFocused,
                    ]}
                  >
                    <LinearGradient
                      colors={
                        isFocused
                          ? ['#FF8854', '#FF5722', '#D9480F']
                          : ['#FF713B', '#F75A22', '#C83C08']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.specialBtnGradient}
                    >
                      <IconComponent
                        color="#FFFFFF"
                        size={21}
                        strokeWidth={2.4}
                      />
                    </LinearGradient>
                  </View>
                ) : (
                  // Standard Tab Item
                  <View style={styles.standardIconWrap}>
                    <IconComponent
                      color={
                        isFocused
                          ? config.activeColor
                          : 'rgba(255, 247, 240, 0.44)'
                      }
                      size={20}
                      strokeWidth={isFocused ? 2.5 : 2}
                    />
                  </View>
                )}

                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused
                        ? config.isSpecial
                          ? colors.orange
                          : '#FFFFFF'
                        : 'rgba(255, 247, 240, 0.45)',
                      fontFamily: isFocused ? 'Poppins-Bold' : 'Poppins-Medium',
                      fontWeight: isFocused ? '700' : '500',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {config.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
    paddingHorizontal: 16,
  },
  floatingCapsule: {
    width: '100%',
    maxWidth: 500,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: Platform.select({
      ios: 'rgba(18, 12, 32, 0.25)',
      android: 'rgba(18, 12, 32, 0.88)',
      default: 'rgba(18, 12, 32, 0.65)',
    }),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.48,
        shadowRadius: 22,
      },
      android: {
        elevation: 18,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
      },
    }),
  },
  specularTopBorder: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1.5,
    borderRadius: 1,
  },
  indicatorTrack: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorPill: {
    width: '78%',
    height: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    ...shadows.card,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 2,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  standardIconWrap: {
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialBtnOuter: {
    width: 42,
    height: 32,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFA07A',
    borderBottomWidth: 2.5,
    borderBottomColor: '#D9480F',
    ...shadows.glowOrange,
  },
  specialBtnFocused: {
    borderColor: '#FFD166',
    borderBottomColor: '#B83204',
  },
  specialBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 9.5,
    marginTop: 2,
    letterSpacing: 0.2,
  },
});
