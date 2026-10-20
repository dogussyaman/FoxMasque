import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme';
import type { ReactNode } from 'react';

interface ScreenProps {
  children: ReactNode;
  gradient?: boolean;
  padded?: boolean;
}

export function Screen({ children, gradient = true, padded = true }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {gradient ? (
        <LinearGradient colors={[colors.bgDarkest, colors.bgDark, colors.bgDarkest]} style={styles.fill}>
          <View style={[styles.fill, padded && styles.padded]}>{children}</View>
        </LinearGradient>
      ) : (
        <View style={[styles.fill, styles.bg, padded && styles.padded]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
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
  safe: { flex: 1, backgroundColor: colors.bgDarkest },
  fill: { flex: 1 },
  bg: { backgroundColor: colors.bgDark },
  padded: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: { color: colors.textPrimary, fontSize: 26, fontFamily: 'Poppins-Bold' },
  subtitle: { color: colors.textMuted, fontSize: 14, fontFamily: 'Poppins-Regular', marginTop: 2 },
});
