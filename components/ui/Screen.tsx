import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing, typography } from '@/theme';
import type { ReactNode } from 'react';

interface ScreenProps {
  children: ReactNode;
  gradient?: boolean;
  padded?: boolean;
  diagonalSlice?: boolean;
}

export function Screen({
  children,
  gradient = true,
  padded = true,
  diagonalSlice = false,
}: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {gradient ? (
        <LinearGradient
          colors={[colors.zartoNight, '#1D1233', colors.zartoSurface, colors.zartoNight]}
          locations={[0, 0.35, 0.75, 1]}
          style={styles.fill}
        >
          {diagonalSlice && (
            <View pointerEvents="none" style={styles.diagonalWrapper}>
              <View style={styles.diagonalSliceTop} />
              <View style={styles.diagonalSliceBottom} />
            </View>
          )}
          <View style={[styles.fill, padded && styles.padded]}>{children}</View>
        </LinearGradient>
      ) : (
        <View style={[styles.fill, styles.bg, padded && styles.padded]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.zartoNight },
  fill: { flex: 1 },
  bg: { backgroundColor: colors.zartoNight },
  padded: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: 'Poppins-Bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    marginTop: 2,
  },
  diagonalWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  diagonalSliceTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 260,
    height: 180,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderRadius: radii['2xl'],
    transform: [{ rotate: '-18deg' }, { skewX: '-10deg' }],
  },
  diagonalSliceBottom: {
    position: 'absolute',
    bottom: -60,
    left: -80,
    width: 240,
    height: 160,
    backgroundColor: 'rgba(255, 113, 59, 0.08)',
    borderRadius: radii['2xl'],
    transform: [{ rotate: '15deg' }],
  },
});
