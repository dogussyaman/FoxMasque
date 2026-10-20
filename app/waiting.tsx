import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Clock, Sparkles, CheckCircle2, Vibrate, FlaskConical } from 'lucide-react-native';
import {
  Screen,
  Card,
  Badge,
  Avatar,
  MascotFloat,
  PopView,
  StaggerRow,
  StickyActionBar,
} from '@/components/ui';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { mascotImages } from '@/assets/illustrations';
import { usePrototype } from '@/features/prototype/PrototypeProvider';
import { PlayerProfileSheet } from '@/components/PlayerProfileSheet';
import type { Player } from '@/types/game';

export default function WaitingScreen() {
  const { roomState, currentPlayer, roomCode, isLive } = useGameStore();
  const prototype = usePrototype();
  const { trigger } = useHaptics();
  const [testMode, setTestMode] = useState(!isLive);
  const [profilePlayer, setProfilePlayer] = useState<Player | null>(null);
  const completedStageRef = useRef<string | null>(null);

  const playersList = roomState ? Object.values(roomState.players) : [];
  const me = playersList.find((p) => p.id === currentPlayer?.id) || currentPlayer;
  const isGuessPhase = (prototype.waitingStage?.phase ?? roomState?.phase) === 'guess';
  const phase = isGuessPhase ? 'guess' : 'fake_answer';
  const stageId = prototype.waitingStage?.id
    ?? `${roomCode ?? 'demo'}:${roomState?.currentRound ?? 1}:${phase}`;

  useEffect(() => {
    if (prototype.waitingStage) return;
    if (roomState?.phase === 'reveal') {
      trigger('success');
      router.replace('/result');
    } else if (roomState?.phase === 'scoreboard') {
      router.replace('/scoreboard');
    }
  }, [roomState?.phase, trigger, prototype.waitingStage]);

  const picks = roomState?.picks ?? {};
  const fakeAnswers = roomState?.fakeAnswers ?? {};
  const hasAnswered = (player: Player) => prototype.isAnswered(
    stageId,
    player.id,
    testMode
      ? player.id === me?.id
      : isGuessPhase ? picks[player.id] !== undefined : !!fakeAnswers[player.id],
  );
  const submittedCount = playersList.filter(hasAnswered).length;
  const totalCount = playersList.length;
  const allSubmitted = totalCount > 0 && submittedCount === totalCount;

  useEffect(() => {
    if (!allSubmitted || completedStageRef.current === stageId) return;
    completedStageRef.current = stageId;
    const timer = setTimeout(() => {
      prototype.finishWaiting(stageId);
      router.replace(isGuessPhase ? '/result' : '/question');
    }, 800);
    return () => clearTimeout(timer);
  }, [allSubmitted, stageId, isGuessPhase, prototype.finishWaiting]);

  return (
    <Screen gradient diagonalSlice>
      {prototype.toast ? (
        <PopView duration={220}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>{prototype.toast.message}</Text>
          </View>
        </PopView>
      ) : null}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Mascot Banner */}
        <View style={styles.topBanner}>
          <MascotFloat floatDistance={5} duration={2400}>
            <Image
              source={mascotImages.searching}
              style={styles.mascotImage}
              resizeMode="contain"
            />
          </MascotFloat>
          <Text style={styles.title}>Oyuncular bekleniyor</Text>
          <Text style={styles.subtitle}>
            Diğer oyuncular cevaplarını tamamladığında otomatik devam edeceğiz.
          </Text>
        </View>

        {/* Status Card with Neon Progress */}
        <Card variant="surface" glow="orange" style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Cevap ilerlemesi</Text>
            <Badge tone={submittedCount === totalCount ? 'lime' : 'orange'} sticker>
              {submittedCount}/{totalCount} cevapladı
            </Badge>
          </View>
        </Card>

        {/* Player Status List */}
        <Text style={styles.listTitle}>OYUNCU DURUMLARI</Text>
        <View style={styles.playersListWrap}>
          {playersList.map((player, idx) => {
            const hasDone = hasAnswered(player);
            const isSelf = player.id === me?.id;
            return (
              <StaggerRow key={player.id} index={idx} delay={60}>
                <Card
                  variant={isSelf ? 'accent' : 'surface'}
                  style={[
                    styles.playerRow,
                    isSelf && styles.playerRowSelf,
                    prototype.toast?.targetId === player.id && styles.playerRowNudged,
                  ]}
                >
                  <Pressable onPress={() => setProfilePlayer(player)} style={styles.playerIdentity}>
                    <Avatar avatarKey={player.avatarKey} size={42} ring={isSelf} />
                    <View style={styles.playerIdentityText}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.playerName, isSelf && { color: colors.orange }]}>
                          {player.name}
                        </Text>
                        {isSelf && <Badge tone="neutral">SEN</Badge>}
                      </View>
                      <Text style={styles.playerScore}>{player.score} Puan</Text>
                    </View>
                  </Pressable>

                  {hasDone ? (
                    <PopView duration={300}>
                      <View style={styles.answeredBadge}>
                        <CheckCircle2 color="#171026" size={14} strokeWidth={2.5} />
                        <Text style={styles.answeredText}>Tamamlandı</Text>
                      </View>
                    </PopView>
                  ) : (
                    <View style={styles.pendingWrap}>
                      <View style={styles.pendingBadge}>
                        <Clock color={colors.yellow} size={14} />
                        <Text style={styles.pendingText}>Cevap Bekleniyor</Text>
                      </View>
                      {!isSelf ? (
                        <Pressable
                          disabled={!prototype.canNudge(stageId, player.id)}
                          onPress={() => {
                            trigger('light');
                            prototype.nudge(stageId, player.id, me?.name ?? 'Sen', player.name);
                          }}
                          style={[
                            styles.nudgeBtn,
                            !prototype.canNudge(stageId, player.id) && styles.nudgeBtnUsed,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`${player.name} oyuncusunu dürt`}
                        >
                          <Vibrate
                            color={prototype.canNudge(stageId, player.id) ? colors.orange : colors.textMuted}
                            size={18}
                          />
                        </Pressable>
                      ) : null}
                    </View>
                  )}
                </Card>
              </StaggerRow>
            );
          })}
        </View>

        <Pressable
          onPress={() => {
            if (testMode) prototype.clearAnswers(stageId);
            setTestMode((value) => !value);
          }}
          style={styles.testToggle}
          accessibilityRole="button"
        >
          <FlaskConical color={colors.purpleSoft} size={16} />
          <Text style={styles.testToggleText}>
            {testMode ? 'Test simülasyonunu gizle' : 'Geliştirici test simülasyonu'}
          </Text>
        </Pressable>
        {testMode ? (
          <Card variant="surface" style={styles.testPanel}>
            <Text style={styles.testTitle}>Oyuncu cevaplarını simüle et</Text>
            <Text style={styles.testDescription}>
              Durumları değiştir; tüm oyuncular tamamladığında sonraki aşama otomatik açılır.
            </Text>
            {playersList.map((player) => {
              const answered = hasAnswered(player);
              return (
                <Pressable
                  key={`simulate-${player.id}`}
                  onPress={() => prototype.setAnswered(stageId, player.id, !answered)}
                  style={styles.testPlayer}
                >
                  <Text style={styles.testPlayerName}>{player.name}</Text>
                  <Badge tone={answered ? 'lime' : 'yellow'}>
                    {answered ? 'Tamamlandı' : 'Bekliyor'}
                  </Badge>
                </Pressable>
              );
            })}
          </Card>
        ) : null}

        {/* Tactical party tip */}
        <Card variant="comic" style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Sparkles color={colors.yellow} size={18} />
            <Text style={styles.tipTitle}>TUZAK Taktik İpucu</Text>
          </View>
          <Text style={styles.tipBody}>
            Ne kadar çok rakibi kendi uydurduğun cevaba inandırırsan, kişi başı +50 puan ve 3 kişide Blok hakkı kazanırsın!
          </Text>
        </Card>

      </ScrollView>
      <StickyActionBar>
        <View style={styles.waitingNotice}>
          <Text style={styles.waitingNoticeText}>
            {allSubmitted ? 'Herkes tamamladı! Sonraki aşama açılıyor…' : 'Cevaplar geldikçe otomatik devam edeceğiz.'}
          </Text>
        </View>
      </StickyActionBar>
      <PlayerProfileSheet
        player={profilePlayer}
        isSelf={profilePlayer?.id === me?.id}
        visible={profilePlayer !== null}
        onClose={() => setProfilePlayer(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.md,
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
  waitingNotice: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  waitingNoticeText: {
    ...typography.small,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  toast: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    zIndex: 5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.orange,
    backgroundColor: colors.bgSurface,
  },
  toastText: {
    ...typography.small,
    color: colors.textPrimary,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  playerRowNudged: {
    borderColor: colors.orange,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 113, 59, 0.12)',
  },
  playerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  playerIdentityText: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  pendingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nudgeBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 113, 59, 0.18)',
    borderWidth: 1,
    borderColor: colors.orange,
  },
  nudgeBtnUsed: {
    opacity: 0.45,
    borderColor: colors.border,
    backgroundColor: colors.bgSurfaceAlt,
  },
  testToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
  testToggleText: {
    ...typography.small,
    color: colors.purpleSoft,
    fontFamily: 'Poppins-SemiBold',
  },
  testPanel: {
    marginBottom: spacing.lg,
    gap: 8,
  },
  testTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  testDescription: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  testPlayer: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  testPlayerName: {
    ...typography.small,
    color: colors.textPrimary,
  },
});
