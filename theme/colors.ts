export const colors = {
  // ZARTO Core Palette
  zartoNight: '#171026',     // Ana gece moru
  zartoSurface: '#281548',   // Derin mor yüzey
  zartoPurple: '#8B5CF6',    // Elektrik moru
  zartoOrange: '#FF713B',    // ZARTO turuncusu
  zartoYellow: '#FFD166',    // Sıcak sarı
  zartoLime: '#C6F36B',      // Lime vurgu
  zartoCream: '#FFF7F0',     // Açık metin ve yüzeyler

  // Backgrounds - Night & Deep Purple
  bgDarkest: '#171026',
  bgDark: '#1B122E',
  bgSurface: '#281548',
  bgSurfaceAlt: '#361D61',
  bgSurfaceMuted: '#241442',
  bgElevated: '#422177',
  bgCard: '#251442',
  bgCardAlt: '#321A57',

  // Accents - Electric Purple
  purple: '#8B5CF6',
  purpleDeep: '#6D28D9',
  purpleSoft: '#A78BFA',
  purpleGlow: 'rgba(139, 92, 246, 0.45)',

  // Accents - ZARTO Orange / Coral
  orange: '#FF713B',
  orangeDeep: '#E0551E',
  orangeGlow: 'rgba(255, 113, 59, 0.45)',
  coral: '#FF713B',
  coralDeep: '#E0551E',
  coralSoft: '#FF8F66',

  // Accents - Warm Yellow & Electric Lime
  yellow: '#FFD166',
  lime: '#C6F36B',
  limeSoft: '#D8F796',

  // Accents - Electric Blue
  blue: '#3B82F6',
  blueDeep: '#1D4ED8',
  blueSoft: '#60A5FA',
  blueGlow: 'rgba(59, 130, 246, 0.45)',

  // Semantic
  success: '#10B981',
  successSoft: '#34D399',
  successGlow: 'rgba(16, 185, 129, 0.45)',
  warning: '#FFD166',
  warningGlow: 'rgba(255, 209, 102, 0.45)',
  danger: '#EF4444',
  dangerSoft: '#F87171',
  dangerGlow: 'rgba(239, 68, 68, 0.45)',

  // Text
  textPrimary: '#FFF7F0',
  textSecondary: '#D6CEE5',
  textMuted: '#9389A8',
  textOnAccent: '#FFFFFF',
  textInverse: '#171026',

  // Borders / overlays
  border: 'rgba(255, 247, 240, 0.09)',
  borderStrong: 'rgba(255, 247, 240, 0.20)',
  borderAccent: 'rgba(139, 92, 246, 0.35)',
  overlay: 'rgba(23, 16, 38, 0.78)',
  overlayLight: 'rgba(40, 21, 72, 0.65)',
} as const;

export type ColorKey = keyof typeof colors;
