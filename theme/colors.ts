export const colors = {
  // Backgrounds - premium dark navy
  bgDarkest: '#070B1F',
  bgDark: '#0B1230',
  bgSurface: '#121A3F',
  bgSurfaceAlt: '#1A2455',
  bgSurfaceMuted: '#161E45',
  bgElevated: '#222C63',
  bgCard: '#1B2350',
  bgCardAlt: '#232C5E',

  // Accents - vibrant purple
  purple: '#8B5CF6',
  purpleDeep: '#6D28D9',
  purpleSoft: '#A78BFA',
  purpleGlow: 'rgba(139, 92, 246, 0.45)',

  // Accents - electric blue
  blue: '#3B82F6',
  blueDeep: '#1D4ED8',
  blueSoft: '#60A5FA',
  blueGlow: 'rgba(59, 130, 246, 0.45)',

  // Accents - coral / orange
  coral: '#FF6B6B',
  coralDeep: '#F43F5E',
  coralSoft: '#FB7185',
  orange: '#FF9F43',
  orangeDeep: '#F97316',
  orangeGlow: 'rgba(255, 107, 107, 0.45)',

  // Semantic
  success: '#22C55E',
  successSoft: '#4ADE80',
  successGlow: 'rgba(34, 197, 94, 0.45)',
  warning: '#FBBF24',
  warningGlow: 'rgba(251, 191, 36, 0.45)',
  danger: '#EF4444',
  dangerSoft: '#F87171',
  dangerGlow: 'rgba(239, 68, 68, 0.45)',

  // Text
  textPrimary: '#F5F7FF',
  textSecondary: '#B8C0E0',
  textMuted: '#7A83AD',
  textOnAccent: '#FFFFFF',
  textInverse: '#0B1230',

  // Borders / overlays
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  overlay: 'rgba(7, 11, 31, 0.7)',
  overlayLight: 'rgba(11, 18, 48, 0.55)',
} as const;

export type ColorKey = keyof typeof colors;
