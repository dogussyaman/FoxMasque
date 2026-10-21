import { useEffect, useRef, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { mascotImages } from '@/assets/illustrations';
import { Card } from '@/components/ui/Card';
import { colors } from '@/theme';

const SLIDES = [
  { image: mascotImages.searching, message: 'Oyun dünyası hazırlanıyor...' },
  { image: mascotImages.cunning, message: 'Rakiplerini şaşırtmaya hazır ol!' },
  { image: mascotImages.lobby, message: 'Arkadaşların oyun odasına çağrılıyor.' },
  { image: mascotImages.shocked, message: 'Bakalım bu tur kim tuzağa düşecek?' },
  { image: mascotImages.winner, message: 'Zafer için son hazırlıklar yapılıyor!' },
];

function TypingCaption({ text }: { text: string }) {
  const [visibleCharacters, setVisibleCharacters] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCharacters((count) => {
        if (count >= text.length) {
          clearInterval(interval);
          return count;
        }
        return count + 1;
      });
    }, 36);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <Text style={styles.caption} accessibilityLiveRegion="polite">
      {text.slice(0, visibleCharacters)}
      {visibleCharacters < text.length ? <Text style={styles.cursor}>▍</Text> : null}
    </Text>
  );
}

interface FoxmasqueLoadingProps {
  done: boolean;
  onFinish: () => void;
}

export function FoxmasqueLoading({ done, onFinish }: FoxmasqueLoadingProps) {
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const didFinish = useRef(false);

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
      <Text style={styles.brand}>FOXMASQUE</Text>

      <View style={styles.mascotFrame}>
        <Image
          key={slideIndex}
          source={slide.image}
          resizeMode="cover"
          accessibilityLabel="FOXMASQUE tilki maskotu"
          style={styles.mascotImage}
        />
      </View>

      <Card variant="comic" style={styles.captionCard}>
        <TypingCaption key={slideIndex} text={slide.message} />
      </Card>

      <View style={styles.progressContainer}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>Yükleniyor</Text>
          <Text style={styles.progressPercent}>%{percent}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#150D27',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  brand: {
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    letterSpacing: 1.4,
  },
  mascotFrame: {
    width: 224,
    height: 224,
    maxWidth: '78%',
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(184, 142, 255, 0.28)',
    backgroundColor: colors.bgSurface,
    shadowColor: colors.purple,
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  },
  captionCard: {
    width: '100%',
    maxWidth: 340,
    minHeight: 72,
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-1.5deg' }],
  },
  caption: {
    minHeight: 24,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  cursor: {
    color: colors.orange,
    fontFamily: 'Poppins-Bold',
  },
  progressContainer: {
    width: '82%',
    maxWidth: 300,
  },
  track: {
    height: 9,
    borderRadius: 999,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderAccent,
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
    marginTop: 8,
  },
  progressLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  progressPercent: {
    color: colors.orange,
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
  },
});
