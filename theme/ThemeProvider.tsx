import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { colors as darkColors } from './colors';

export type ThemeMode = 'dark' | 'light';
export type ThemeColors = Record<keyof typeof darkColors, string>;

const THEME_STORAGE_KEY = 'zarto-theme-mode';

const lightColors: ThemeColors = {
  ...darkColors,
  bgDarkest: '#F5F1FA',
  bgDark: '#F0EAF6',
  bgSurface: '#FFFFFF',
  bgSurfaceAlt: '#F5F0F8',
  bgSurfaceMuted: '#F1EBF5',
  bgElevated: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgCardAlt: '#F7F2FA',
  textPrimary: '#241A30',
  textSecondary: '#584D63',
  textMuted: '#766B80',
  textInverse: '#241A30',
  border: 'rgba(36, 26, 48, 0.10)',
  borderStrong: 'rgba(36, 26, 48, 0.18)',
  borderAccent: 'rgba(117, 71, 196, 0.35)',
  overlay: 'rgba(36, 26, 48, 0.48)',
  overlayLight: 'rgba(245, 241, 250, 0.92)',
  categoryOverlayTop: 'rgba(17, 13, 27, 0.12)',
  categoryOverlayBottom: 'rgba(17, 13, 27, 0.82)',
  imageIconSurface: 'rgba(17, 13, 27, 0.48)',
  purpleGlow: 'rgba(117, 71, 196, 0.16)',
  successSurface: 'rgba(16, 185, 129, 0.12)',
  dangerSurface: 'rgba(239, 68, 68, 0.10)',
  purpleSurface: 'rgba(117, 71, 196, 0.10)',
  orangeSurface: 'rgba(255, 113, 61, 0.12)',
  goldSurface: 'rgba(255, 209, 102, 0.20)',
  silverSurface: 'rgba(90, 77, 99, 0.10)',
};

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const userChangedMode = useRef(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((savedMode) => {
      if (mounted && !userChangedMode.current && (savedMode === 'light' || savedMode === 'dark')) {
        setModeState(savedMode);
      }
    }).catch((error: unknown) => {
      console.error('Tema tercihi okunamadı.', error);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = mode === 'light' ? lightColors.bgDarkest : darkColors.bgDarkest;
      document.documentElement.style.colorScheme = mode;
    }
  }, [mode]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    userChangedMode.current = true;
    setModeState(nextMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode).catch((error: unknown) => {
      console.error('Tema tercihi kaydedilemedi.', error);
    });
  }, []);

  const value = useMemo(
    () => ({ mode, colors: mode === 'light' ? lightColors : darkColors, setMode }),
    [mode, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider.');
  return value;
}

export function useThemeStyles<T>(createStyles: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => createStyles(colors), [colors, createStyles]);
}
