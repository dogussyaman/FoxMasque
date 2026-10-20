import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Share,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import {
  ChevronLeft,
  Share2,
  Bell,
  Play,
  CheckCircle2,
  Circle,
  Crown,
  UserPlus,
  Flame,
} from 'lucide-react-native';
import { Screen, Button, Card, Avatar, Badge, FeedbackBanner } from '@/components/ui';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { mascotImages } from '@/assets/illustrations';

export default function LobbyScreen() {
  const { roomCode, roomState, currentPlayer, service, lastNudge } = useGameStore();
  const { trigger } = useHaptics();

  const [nudgeBanner, setNudgeBanner] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto navigate when phase changes
  useEffect(() => {
    if (roomState?.phase === 'ability_select') {
      router.replace('/ability-select');
    } else if (
      roomState?.phase === 'fake_answer' ||
      roomState?.phase === 'guess' ||
      roomState?.phase === 'question'
    ) {
      router.replace('/question');
    }
  }, [roomState?.phase]);

  // Handle incoming nudges
  useEffect(() => {
    if (lastNudge && currentPlayer && lastNudge.toId === currentPlayer.id) {
      trigger('heavy');
      setNudgeBanner('Biri seni dürttü! Lütfen hazır ol!');
      const timer = setTimeout(() => setNudgeBanner(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [lastNudge, currentPlayer, trigger]);

  const playersList = roomState ? Object.values(roomState.players) : [];
  const me = playersList.find((p) => p.id === currentPlayer?.id) || currentPlayer;
  const isHost = me?.isHost ?? false;
  const readyCount = playersList.filter((p) => p.isReady).length;
  const canStart = readyCount >= 2;
  const maxPlayers = roomState?.config.maxPlayers ?? 8;
  const emptySlotsCount = Math.max(0, Math.min(4, maxPlayers - playersList.length));

  const toggleReady = async () => {
    if (!roomCode || !me) return;
    trigger('medium');
    try {
      await service.setReady(roomCode, !me.isReady);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const nudgePlayer = async (targetId: string, targetName: string) => {
    if (!roomCode) return;
    trigger('light');
    try {
      await service.nudgePlayer(roomCode, targetId);
      setNudgeBanner(`${targetName} oyuncusuna dürtme gönderildi!`);
      setTimeout(() => setNudgeBanner(null), 3000);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleShare = async () => {
    trigger('light');
    if (!roomCode) return;
    try {
      await Share.share({
        message: `ZARTO parti oyununa davetlisin! Oda kodumuz: ${roomCode}. Hemen katıl ve blöfünü konuştur!`,
      });
    } catch {}
  };

  const handleStartGame = async () => {
    if (!roomCode || !canStart) return;
    trigger('medium');
    setStarting(true);
    setError(null);
    try {
      await service.startGame(roomCode);
    } catch (e) {
      setError((e as Error).message);
      setStarting(false);
    }
  };

  const handleBack = async () => {
    if (roomCode) {
      try {
        await service.leaveRoom(roomCode);
      } catch {}
    }
    router.replace('/(tabs)');
  };

  return (
    <Screen gradient diagonalSlice>
      <View style={styles.topBar}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <ChevronLeft color={colors.textPrimary} size={22} />
        </Pressable>
        <Text style={styles.screenTitle}>Oyun Lobisi</Text>
        <Pressable onPress={handleShare} style={styles.shareBtn}>
          <Share2 color={colors.orange} size={20} strokeWidth={2.5} />
        </Pressable>
      </View>

      {nudgeBanner ? (
        <View style={{ marginBottom: 12 }}>
          <FeedbackBanner tone="warning" title="Dürtme Geldi!" message={nudgeBanner} />
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Room Code Showcase Card */}
        <Card variant="surface" glow="orange" style={styles.codeCard}>
          <View style={styles.codeTopRow}>
            <View style={styles.kickerWrap}>
              <Flame color={colors.orange} size={14} />
              <Text style={styles.kickerText}>ODA KODU</Text>
            </View>
            <Pressable onPress={handleShare} style={styles.miniSharePill}>
              <Share2 color="#FFF" size={13} />
              <Text style={styles.miniShareText}>Paylaş</Text>
            </Pressable>
          </View>

          <Text style={styles.codeText}>{roomCode || '-----'}</Text>
          <Text style={styles.codeHint}>Kodu arkadaşlarınla paylaşarak odaya davet et</Text>

          <View style={styles.metaRow}>
            <Badge tone="purple" sticker>{roomState?.config.totalRounds ?? 5} Tur</Badge>
            <Badge tone="yellow" sticker>{roomState?.config.roundSeconds ?? 15} sn Soru</Badge>
            <Badge tone="lime" sticker>{roomState?.config.selectedCategoryIds.length ?? 6} Kategori</Badge>
          </View>
        </Card>

        {/* Players List Header */}
        <View style={styles.playersHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.sectionTitle}>Oyuncular</Text>
            <Badge tone="purple">{playersList.length} / {maxPlayers}</Badge>
          </View>
          <Badge tone={canStart ? 'lime' : 'yellow'} sticker>
            {readyCount}/{playersList.length} HAZIR
          </Badge>
        </View>

        {/* Players Cards */}
        <View style={styles.playersListWrap}>
          {playersList.map((player) => {
            const isSelf = player.id === me?.id;
            return (
              <Card
                key={player.id}
                variant={isSelf ? 'accent' : 'surface'}
                style={[styles.playerCard, isSelf && styles.playerCardSelf]}
              >
                <Avatar avatarKey={player.avatarKey} size={46} online={player.isOnline} ring={isSelf} />

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.nameWrap}>
                    <Text style={[styles.playerName, isSelf && { color: colors.orange }]}>
                      {player.name}
                    </Text>
                    {player.isHost && (
                      <View style={styles.hostCrownBadge}>
                        <Crown color={colors.yellow} size={12} />
                        <Text style={styles.hostCrownText}>HOST</Text>
                      </View>
                    )}
                    {isSelf && <Badge tone="neutral">SEN</Badge>}
                  </View>
                  <Text style={styles.playerScore}>{player.score} Puan</Text>
                </View>

                {player.isReady ? (
                  <View style={styles.readyBadge}>
                    <CheckCircle2 color="#171026" size={16} strokeWidth={2.5} />
                    <Text style={styles.readyText}>HAZIR</Text>
                  </View>
                ) : (
                  <View style={styles.unreadyRow}>
                    <View style={styles.notReadyBadge}>
                      <Circle color={colors.textMuted} size={14} />
                      <Text style={styles.notReadyText}>Bekliyor</Text>
                    </View>
                    {!isSelf && (
                      <Pressable
                        onPress={() => nudgePlayer(player.id, player.name)}
                        style={styles.nudgeBtn}
                      >
                        <Bell color={colors.orange} size={18} strokeWidth={2.2} />
                      </Pressable>
                    )}
                  </View>
                )}
              </Card>
            );
          })}

          {/* Empty Placeholder Slots */}
          {Array.from({ length: emptySlotsCount }).map((_, idx) => (
            <View key={`empty-${idx}`} style={styles.emptySlotCard}>
              <View style={styles.emptySlotIcon}>
                <UserPlus color={colors.textMuted} size={18} />
              </View>
              <Text style={styles.emptySlotText}>Arkadaşını Bekliyor…</Text>
            </View>
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Action Controls */}
        <View style={styles.actionsWrap}>
          <Button
            label={me?.isReady ? 'Hazır Değilim (Beklet)' : 'Hazırım! Oyuna Başla'}
            onPress={toggleReady}
            variant={me?.isReady ? 'secondary' : 'lime'}
            fullWidth
            style={{ marginBottom: 12 }}
          />

          {isHost ? (
            <Button
              label={canStart ? 'Oyunu Başlat!' : 'En az 2 hazır oyuncu bekleniyor'}
              onPress={handleStartGame}
              variant="orange"
              disabled={!canStart || starting}
              loading={starting}
              fullWidth
              icon={<Play color="#FFF" size={20} strokeWidth={2.5} />}
            />
          ) : (
            <View style={styles.waitingNotice}>
              <Image source={mascotImages.lobby} style={styles.miniMascotWait} resizeMode="contain" />
              <Text style={styles.waitingText}>
                Oda sahibinin oyunu başlatması bekleniyor…
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
  },
  scroll: {
    paddingBottom: 48,
  },
  codeCard: {
    alignItems: 'center',
    marginVertical: spacing.sm,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: colors.orange,
  },
  codeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  kickerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kickerText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: colors.orange,
    letterSpacing: 1.5,
  },
  miniSharePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.orange,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  miniShareText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#FFF',
  },
  codeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 42,
    lineHeight: 48,
    color: '#FFF',
    letterSpacing: 8,
    marginVertical: 4,
  },
  codeHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  playersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
  },
  playersListWrap: {
    gap: 8,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  playerCardSelf: {
    borderColor: colors.orange,
    borderWidth: 1.5,
  },
  nameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  playerName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  hostCrownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 209, 102, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.yellow,
  },
  hostCrownText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
    color: colors.yellow,
  },
  playerScore: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.lime,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.md,
  },
  readyText: {
    fontSize: 11,
    color: '#171026',
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.5,
  },
  unreadyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notReadyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  notReadyText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  nudgeBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 113, 59, 0.2)',
    borderWidth: 1,
    borderColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 247, 240, 0.15)',
    gap: 12,
  },
  emptySlotIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgSurfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  actionsWrap: {
    marginTop: spacing.xl,
  },
  waitingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  miniMascotWait: {
    width: 40,
    height: 40,
  },
  waitingText: {
    ...typography.small,
    color: colors.textSecondary,
    fontFamily: 'Poppins-Medium',
  },
  errorText: {
    ...typography.small,
    color: colors.danger,
    marginTop: spacing.md,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
  },
});
