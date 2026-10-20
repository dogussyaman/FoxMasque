export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export type SpacingKey = keyof typeof spacing;

export const radii = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  '2xl': 32,
  pill: 999,
  full: 999,
} as const;

export const typography = {
  fontFamily: 'Poppins-Regular',
  fontFamilyMedium: 'Poppins-Medium',
  fontFamilySemiBold: 'Poppins-SemiBold',
  fontFamilyBold: 'Poppins-Bold',

  h1: { fontSize: 34, lineHeight: 40, fontFamily: 'Poppins-Bold' as const },
  h2: { fontSize: 28, lineHeight: 34, fontFamily: 'Poppins-Bold' as const },
  h3: { fontSize: 22, lineHeight: 28, fontFamily: 'Poppins-SemiBold' as const },
  h4: { fontSize: 18, lineHeight: 24, fontFamily: 'Poppins-SemiBold' as const },
  body: { fontSize: 16, lineHeight: 24, fontFamily: 'Poppins-Regular' as const },
  bodyMedium: { fontSize: 16, lineHeight: 24, fontFamily: 'Poppins-Medium' as const },
  small: { fontSize: 13, lineHeight: 18, fontFamily: 'Poppins-Regular' as const },
  caption: { fontSize: 11, lineHeight: 16, fontFamily: 'Poppins-Medium' as const },
  big: { fontSize: 48, lineHeight: 54, fontFamily: 'Poppins-Bold' as const },
  mega: { fontSize: 64, lineHeight: 70, fontFamily: 'Poppins-Bold' as const },
} as const;

export const layout = {
  screenPadding: 20,
  cardPadding: 18,
  maxContentWidth: 520,
  tabBarHeight: 64,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  glow: {
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 8,
  },
  glowBlue: {
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 8,
  },
} as const;

import { colors } from './colors';
