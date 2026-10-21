import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react-native';
import { FoxmasqueLoading } from '@/components/loading/FoxmasqueLoading';
import { colors, radii } from '@/theme';

export default function LoadingDemoScreen() {
  const insets = useSafeAreaInsets();
  const [finished, setFinished] = useState(false);
  const [loadingDone, setLoadingDone] = useState(false);
  const [run, setRun] = useState(0);

  const restart = () => {
    setFinished(false);
    setLoadingDone(false);
    setRun((current) => current + 1);
  };

  return (
    <View style={styles.root}>
      {finished ? (
        <View style={styles.finished}>
          <CheckCircle2 color={colors.lime} size={52} strokeWidth={1.8} />
          <Text style={styles.finishedTitle}>Loading testi tamamlandı</Text>
          <Text style={styles.finishedSubtitle}>
            Beğendiysen gerçek yükleme adımlarına bağlamaya hazırız.
          </Text>
          <Pressable onPress={restart} style={styles.actionButton}>
            <RotateCcw color="#FFFFFF" size={18} />
            <Text style={styles.actionText}>Tekrar dene</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>Ayarlara dön</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FoxmasqueLoading
            key={run}
            done={loadingDone}
            onFinish={() => setFinished(true)}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Loading testinden çık"
            onPress={() => router.back()}
            style={[styles.closeButton, { top: insets.top + 12 }]}
          >
            <ArrowLeft color="#FFF1E3" size={20} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setLoadingDone(true)}
            disabled={loadingDone}
            style={[styles.completeButton, { bottom: insets.bottom + 12 }]}
          >
            <Text style={styles.completeText}>
              {loadingDone ? 'Tamamlanıyor...' : 'Yüklemeyi tamamla'}
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#150D27',
  },
  closeButton: {
    position: 'absolute',
    left: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#241540',
    borderWidth: 1,
    borderColor: '#4A2D7A',
  },
  completeButton: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.lg,
    backgroundColor: '#241540',
    borderWidth: 1,
    borderColor: '#4A2D7A',
  },
  completeText: {
    color: '#FFF1E3',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
  },
  finished: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  finishedTitle: {
    color: '#FFF1E3',
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    textAlign: 'center',
    marginTop: 18,
  },
  finishedSubtitle: {
    color: '#C6B8D8',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  actionButton: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.orange,
  },
  actionText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
  },
  backButton: {
    padding: 14,
    marginTop: 4,
  },
  backText: {
    color: '#C6B8D8',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
  },
});
