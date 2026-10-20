import { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { Check, Clock, Sparkles, CheckCircle2 } from 'lucide-react-native';
import {
  Screen,
  Card,
  Badge,
  Avatar,
  Button,
  MascotFloat,
  PopView,
  PulseView,
  StaggerRow,
} from '@/components/ui';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { mascotImages } from '@/assets/illustrations';

export default function WaitingScreen() {
  const { roomState, service, roomCode, currentPlayer } = useGameStore();
  const { trigger } = useHaptics();

  // Watch for phase change to 'reveal' or 'scoreboard'
  useEffect(() => {
    if (roomState?.phase === 'reveal') {
      trigger('success');
      router.replace('/result');
    } else if (roomState?.phase === 'scoreboard') {
      router.replace('/scoreboard');
    }
  }, [roomState?.phase, trigger]);

  const playersList = roomState ? Object.values(roomState.players) : [];
  const me = playersList.find((p) => p.id === currentPlayer?.id) || currentPlayer;
  const isHost = me?.isHost ?? false;

  const picks = roomState?.picks ?? {};
  const fakeAnswers = roomState?.fakeAnswers ?? {};
  const isGuessPhase = roomState?.phase === 'guess';

  const submittedCount = isGuessPhase
    ? Object.keys(picks).length
    : Object.keys(fakeAnswers).length || Object.keys(roomState?.answers ?? {}).length;
  const totalCount = playersList.length;

  const handleForceAdvance = async () => {
    if (!roomCode || !isHost) return;
    trigger('medium');
    await service.advancePhase(roomCode);
    router.replace('/result');
  };

  return (
    <Screen gradient diagonalSlice>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Mascot Banner */}
        <View style={styles.topBanner}>
          <MascotFloat floatDistance={5} duration={2400}>
            <Image
              source={mascotImages.searching}
              style={styles.mascotImage}
              resizeMode="contain"
            />
          </MascotFloat>
          <Text style={styles.title}>Cevabın Alındı!</Text>
          <Text style={styles.subtitle}>
            {isGuessPhase
              ? 'Rakiplerinin tahminlerini bitirmesi bekleniyor… Kim kimi zartalayacak?'
              : 'Diğer oyuncular sahte cevaplarını hazırlıyor…'}
          </Text>
        </View>

        {/* Status Card with Neon Progress */}
        <Card variant="surface" glow="orange" style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Tamamlayan Oyuncular</Text>
            <Badge tone={submittedCount === totalCount ? 'lime' : 'orange'} sticker>
              {submittedCount} / {totalCount} HAZIR
            </Badge>
          </View>
        </Card>

        {/* Player Status List */}
        <Text style={styles.listTitle}>OYUNCU DURUMLARI</Text>
        <View style={styles.playersListWrap}>
          {playersList.map((player, idx) => {
            const hasDone = isGuessPhase ? picks[player.id] !== undefined : !!fakeAnswers[player.id];
            const isSelf = player.id === me?.id;
            return (
              <StaggerRow key={player.id} index={idx} delay={60}>
                <Card
                  variant={isSelf ? 'accent' : 'surface'}
                  style={[styles.playerRow, isSelf && styles.playerRowSelf]}
                >
                  <Avatar avatarKey={player.avatarKey} size={42} ring={isSelf} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.playerName, isSelf && { color: colors.orange }]}>
                        {player.name}
                      </Text>
                      {isSelf && <Badge tone="neutral">SEN</Badge>}
                    </View>
                    <Text style={styles.playerScore}>{player.score} Puan</Text>
                  </View>

                  {hasDone ? (
                    <PopView duration={300}>
                      <View style={styles.answeredBadge}>
                        <CheckCircle2 color="#171026" size={14} strokeWidth={2.5} />
                        <Text style={styles.answeredText}>TAMAM</Text>
                      </View>
                    </PopView>
                  ) : (
                    <PulseView minScale={0.96} maxScale={1.03} duration={1400}>
                      <View style={styles.pendingBadge}>
                        <Clock color={colors.yellow} size={14} />
                        <Text style={styles.pendingText}>Düşünüyor…</Text>
                      </View>
                    </PulseView>
                  )}
                </Card>
              </StaggerRow>
            );
          })}
        </View>

        {/* Tactical party tip */}
        <Card variant="comic" style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Sparkles color={colors.yellow} size={18} />
            <Text style={styles.tipTitle}>FoxMasque Taktik İpucu</Text>
          </View>
          <Text style={styles.tipBody}>
            Ne kadar çok rakibi kendi uydurduğun cevaba inandırırsan, kişi başı +50 puan ve 3 kişide Blok hakkı kazanırsın!
          </Text>
        </Card>

        {/* Host action button */}
        {isHost ? (
          <View style={styles.actionWrap}>
            <Button
              label="Sonuçları Açıkla (Host)"
              onPress={handleForceAdvance}
              variant="orange"
              fullWidth
            />
          </View>
        ) : (
          <View style={styles.waitingNotice}>
            <Text style={styles.waitingNoticeText}>
              Oda kurucusunun sonuçları açması bekleniyor…
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 48,
    paddingTop: 8,
  },
  topBanner: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  mascotImage: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
    fontSize: 13,
    lineHeight: 18,
  },
  statusCard: {
    marginVertical: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
  },
  listTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  playersListWrap: {
    gap: 8,
    marginBottom: spacing.lg,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  playerRowSelf: {
    borderColor: colors.orange,
    borderWidth: 1.5,
  },
  playerName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  playerScore: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  answeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.lime,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.md,
  },
  answeredText: {
    fontSize: 10,
    color: '#171026',
    fontFamily: 'Poppins-Bold',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 209, 102, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.3)',
  },
  pendingText: {
    ...typography.caption,
    color: colors.yellow,
    fontFamily: 'Poppins-Medium',
  },
  tipCard: {
    marginBottom: spacing.lg,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tipTitle: {
    ...typography.caption,
    color: colors.yellow,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.5,
  },
  tipBody: {
    ...typography.small,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  actionWrap: {
    marginTop: spacing.xs,
  },
  waitingNotice: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  waitingNoticeText: {
    ...typography.small,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
