import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Asset } from 'expo-asset';
import { useReducedMotion } from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import { mascotImages } from '@/assets/illustrations';
import { Card } from '@/components/ui/Card';
import { useTheme, useThemeStyles } from '@/theme/ThemeProvider';
import type { ThemeColors } from '@/theme/ThemeProvider';

const SLIDES = [
  { image: mascotImages.searching, message: 'Oyun dünyası hazırlanıyor...' },
  { image: mascotImages.cunning, message: 'Oturum bilgileri güvenle kontrol ediliyor.' },
  { image: mascotImages.lobby, message: 'Kayıtlı oyun durumun kontrol ediliyor.' },
  { image: mascotImages.shocked, message: 'Son hazırlıklar tamamlanıyor...' },
  { image: mascotImages.winner, message: 'Birazdan oyuna hazırsın!' },
];

interface KizilkuyrukLoadingProps {
  done: boolean;
  onFinish: () => void;
}

export function KizilkuyrukLoading({ done, onFinish }: KizilkuyrukLoadingProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const reduceMotion = useReducedMotion();
  const compact = useWindowDimensions().height < 700;
  const [progress, setProgress] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [footerAnimationUri, setFooterAnimationUri] = useState<string | null>(null);
  const didFinish = useRef(false);

  useEffect(() => {
    let active = true;
    void Asset.fromModule(require('@/assets/loading/yrYVBPzGJG.svg'))
      .downloadAsync()
      .then((asset) => {
        if (!asset.localUri) {
          throw new Error('Loading alt animasyonu için yerel dosya URI bilgisi alınamadı.');
        }
        if (active) setFooterAnimationUri(asset.localUri);
      })
      .catch((error: unknown) => {
        console.error('Loading alt animasyonu yüklenemedi:', error);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((current) =>
        done ? Math.min(100, current + 6) : current + (92 - current) * 0.04,
      );
    }, 80);
    return () => clearInterval(interval);
  }, [done]);

  useEffect(() => {
    if (progress < 99.5 || didFinish.current) return;
    didFinish.current = true;
    const timeout = setTimeout(onFinish, 350);
    return () => clearTimeout(timeout);
  }, [onFinish, progress]);

  useEffect(() => {
    if (reduceMotion) return;
    const interval = setInterval(() => {
      setSlideIndex((current) => (current + 1) % SLIDES.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [reduceMotion]);

  const percent = Math.round(progress);
  const slide = SLIDES[slideIndex];

  return (
    <View
      style={styles.root}
      accessibilityRole="progressbar"
      accessibilityLabel="Yükleniyor"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
    >
      <LinearGradient
        colors={[colors.bgDarkest, colors.bgDark, colors.bgDarkest]}
        locations={[0, 0.52, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.topGlow} />
      <View pointerEvents="none" style={styles.bottomGlow} />

      <View style={[styles.content, compact && styles.contentCompact]}>
        <View style={[styles.logoStage, compact && styles.logoStageCompact]}>
          <View style={styles.logoGlow} />
          <Image
            source={require('@/assets/illustrations/kızılkuyruk.png')}
            resizeMode="contain"
            accessibilityLabel="Kızılkuyruk"
            style={styles.logoImage}
          />
        </View>

        <View style={[styles.mascotFrame, compact && styles.mascotFrameCompact]}>
          <Image
            key={slideIndex}
            source={slide.image}
            resizeMode="cover"
            accessibilityLabel="Kızılkuyruk tilki maskotu"
            style={styles.mascotImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(17, 13, 27, 0.42)']}
            style={styles.mascotShade}
          />
        </View>

        <Card variant="surface" style={[styles.captionCard, compact && styles.captionCardCompact]}>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>HAZIRLANIYOR</Text>
          </View>
          <Text key={slideIndex} style={styles.caption} accessibilityLiveRegion="polite">
            {slide.message}
          </Text>
        </Card>

        <View style={styles.progressContainer}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Uygulama hazırlanıyor</Text>
            <Text style={styles.progressPercent}>%{percent}</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${percent}%` }]} />
          </View>
        </View>
      </View>
      {footerAnimationUri ? (
        <View pointerEvents="none" style={styles.footerAnimationContainer}>
          {Platform.OS === 'web' ? (
            <Image
              source={{ uri: footerAnimationUri }}
              resizeMode="contain"
              accessibilityLabel="Kızılkuyruk loading animasyonu"
              style={styles.footerAnimation}
            />
          ) : (
            <WebView
              source={{ uri: footerAnimationUri }}
              style={styles.footerAnimation}
              containerStyle={styles.webViewContainer}
              originWhitelist={['*']}
              scrollEnabled={false}
              bounces={false}
              javaScriptEnabled={false}
              allowFileAccess
              accessibilityLabel="Kızılkuyruk loading animasyonu"
            />
          )}
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  topGlow: {
    position: 'absolute',
    top: '13%',
    width: 320,
    height: 190,
    borderRadius: 160,
    backgroundColor: 'rgba(255, 113, 61, 0.08)',
    transform: [{ scaleX: 1.35 }],
  },
  bottomGlow: {
    position: 'absolute',
    bottom: '-12%',
    right: '-18%',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(161, 107, 255, 0.12)',
  },
  content: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 104,
  },
  contentCompact: {
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    paddingBottom: 76,
  },
  logoStageCompact: {
    height: 76,
  },
  mascotFrameCompact: {
    width: 124,
    height: 124,
  },
  captionCardCompact: {
    minHeight: 64,
    paddingVertical: 8,
  },
  footerAnimationContainer: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: 168,
    height: 94,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  footerAnimation: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  logoStage: {
    width: '100%',
    height: 124,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: '78%',
    height: 66,
    borderRadius: 999,
    backgroundColor: colors.orangeGlow,
    opacity: 0.7,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  mascotFrame: {
    width: 196,
    height: 196,
    maxWidth: '78%',
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgSurface,
    shadowColor: colors.orange,
    shadowOpacity: 0.2,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  },
  mascotShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  captionCard: {
    width: '100%',
    maxWidth: 360,
    minHeight: 82,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSurface,
    gap: 5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.lime,
  },
  statusText: {
    color: colors.textMuted,
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
    letterSpacing: 1.3,
  },
  caption: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  progressContainer: {
    width: '100%',
    maxWidth: 340,
    gap: 9,
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 247, 255, 0.1)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.orange,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  progressPercent: {
    color: colors.orange,
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
  },
});
