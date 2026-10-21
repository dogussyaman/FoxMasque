export const colors = {
  // ZARTO Core Palette
  zartoNight: '#110D1B',     // Ana gece moru
  zartoSurface: '#28183D',   // Derin mor yüzey
  zartoPurple: '#A16BFF',    // Marka moru
  zartoOrange: '#FF713D',    // ZARTO turuncusu
  zartoYellow: '#FFD166',    // Sıcak sarı
  zartoLime: '#C6F36B',      // Lime vurgu
  zartoCream: '#FFF7FF',     // Açık metin ve yüzeyler

  // Backgrounds - Night & Deep Purple
  bgDarkest: '#110D1B',
  bgDark: '#1A1228',
  bgSurface: '#28183D',
  bgSurfaceAlt: '#35204C',
  bgSurfaceMuted: '#21172F',
  bgElevated: '#35204C',
  bgCard: '#28183D',
  bgCardAlt: '#35204C',

  // Accents - Electric Purple
  purple: '#A16BFF',
  purpleDeep: '#7547C4',
  purpleSoft: '#B88EFF',
  purpleGlow: 'rgba(161, 107, 255, 0.28)',

  // Accents - ZARTO Orange / Coral
  orange: '#FF713D',
  orangeDeep: '#D9562B',
  orangeGlow: 'rgba(255, 113, 61, 0.28)',
  coral: '#FF713D',
  coralDeep: '#D9562B',
  coralSoft: '#FF9872',

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
  successSurface: 'rgba(198, 243, 107, 0.14)',
  warning: '#FFD166',
  warningGlow: 'rgba(255, 209, 102, 0.45)',
  danger: '#EF4444',
  dangerSoft: '#F87171',
  dangerGlow: 'rgba(239, 68, 68, 0.45)',
  dangerSurface: 'rgba(239, 68, 68, 0.14)',
  purpleSurface: 'rgba(161, 107, 255, 0.14)',
  orangeSurface: 'rgba(255, 113, 61, 0.14)',
  goldSurface: 'rgba(255, 209, 102, 0.18)',
  silverSurface: 'rgba(185, 173, 201, 0.14)',
  categoryOverlayTop: 'rgba(17, 13, 27, 0.12)',
  categoryOverlayBottom: 'rgba(17, 13, 27, 0.82)',
  imageIconSurface: 'rgba(17, 13, 27, 0.48)',

  // Text
  textPrimary: '#FFF7FF',
  textSecondary: '#B9ADC9',
  textMuted: '#91849F',
  textOnAccent: '#FFFFFF',
  textInverse: '#110D1B',

  // Borders / overlays
  border: 'rgba(255, 247, 255, 0.09)',
  borderStrong: 'rgba(255, 247, 255, 0.16)',
  borderAccent: 'rgba(161, 107, 255, 0.30)',
  overlay: 'rgba(17, 13, 27, 0.78)',
  overlayLight: 'rgba(40, 24, 61, 0.65)',
} as const;

export type ColorKey = keyof typeof colors;
