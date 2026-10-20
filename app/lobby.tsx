import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Share } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Share2, Bell, Play, CheckCircle2, Circle } from 'lucide-react-native';
import { Screen, Button, Card, Avatar, Badge, FeedbackBanner } from '@/components/ui';
import { colors, spacing, typography, radii } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';

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
    } else if (roomState?.phase === 'question') {
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
        message: `ZARTO parti oyununa davetlisin! Oda kodumuz: ${roomCode}. Hemen katıl!`,
      });
    } catch {
      // share dismissed
    }
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

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.replace('/(tabs)')} style={styles.backBtn}>
          <ChevronLeft color={colors.textPrimary} size={24} />
        </Pressable>
        <Text style={styles.screenTitle}>Oyun Lobisi</Text>
        <Pressable onPress={handleShare} style={styles.shareBtn}>
          <Share2 color={colors.textPrimary} size={20} />
        </Pressable>
      </View>

      {nudgeBanner ? (
        <View style={{ marginBottom: 12 }}>
          <FeedbackBanner tone="warning" title="Dürtme!" message={nudgeBanner} />
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Room Code Card */}
        <Card style={styles.codeCard}>
          <Text style={styles.codeLabel}>ODA KODU</Text>
          <Text style={styles.codeText}>{roomCode || '-----'}</Text>
          <Text style={styles.codeHint}>Bu kodu arkadaşlarına vererek odaya davet et</Text>

          <View style={styles.metaRow}>
            <Badge tone="purple">{roomState?.config.totalRounds ?? 5} Tur</Badge>
            <Badge tone="neutral">{roomState?.config.roundSeconds ?? 15} sn / Soru</Badge>
            <Badge tone="neutral">{roomState?.config.selectedCategoryIds.length ?? 6} Kategori</Badge>
          </View>
        </Card>

        {/* Players List */}
        <View style={styles.playersHeader}>
          <Text style={styles.sectionTitle}>
            Oyuncular ({playersList.length}/{roomState?.config.maxPlayers ?? 10})
          </Text>
          <Badge tone={canStart ? 'success' : 'warning'}>
            {readyCount}/{playersList.length} Hazır
          </Badge>
        </View>

        <Card style={styles.playersCard}>
          {playersList.map((player) => {
            const isSelf = player.id === me?.id;
            return (
              <View key={player.id} style={[styles.playerRow, isSelf && styles.playerRowSelf]}>
                <Avatar avatarKey={player.avatarKey} size={44} online={player.isOnline} />
                <View style={{ flex: 1 }}>
                  <View style={styles.nameWrap}>
                    <Text style={[styles.playerName, isSelf && { color: colors.purpleSoft }]}>
                      {player.name}
                    </Text>
                    {player.isHost ? <Badge tone="warning">KURUCU</Badge> : null}
                    {isSelf ? <Badge tone="neutral">SEN</Badge> : null}
                  </View>
                  <Text style={styles.playerScore}>{player.score} Puan</Text>
                </View>

                {player.isReady ? (
                  <View style={styles.readyBadge}>
                    <CheckCircle2 color={colors.success} size={18} />
                    <Text style={styles.readyText}>Hazır</Text>
                  </View>
                ) : (
                  <View style={styles.unreadyRow}>
                    <View style={styles.notReadyBadge}>
                      <Circle color={colors.textMuted} size={16} />
                      <Text style={styles.notReadyText}>Bekliyor</Text>
                    </View>
                    {!isSelf ? (
                      <Pressable
                        onPress={() => nudgePlayer(player.id, player.name)}
                        style={styles.nudgeBtn}
                      >
                        <Bell color={colors.orange} size={16} />
                      </Pressable>
                    ) : null}
                  </View>
                )}
              </View>
            );
          })}
        </Card>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Action Controls */}
        <View style={styles.actionsWrap}>
          <Button
            label={me?.isReady ? 'Hazır Değilim' : 'Hazırım!'}
            onPress={toggleReady}
            variant={me?.isReady ? 'secondary' : 'success'}
            fullWidth
            style={{ marginBottom: 12 }}
          />

          {isHost ? (
            <Button
              label={canStart ? 'Oyunu Başlat' : 'En az 2 hazır oyuncu bekleniyor'}
              onPress={handleStartGame}
              variant="primary"
              disabled={!canStart || starting}
              loading={starting}
              fullWidth
              icon={<Play color="#FFF" size={20} />}
            />
          ) : (
            <View style={styles.waitingNotice}>
              <Text style={styles.waitingText}>Ev sahibinin oyunu başlatması bekleniyor…</Text>
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
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.bgSurfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.bgSurfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  scroll: {
    paddingBottom: 40,
  },
  codeCard: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  codeLabel: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 2,
  },
  codeText: {
    ...typography.h1,
    color: colors.purpleSoft,
    letterSpacing: 6,
    marginVertical: 4,
  },
  codeHint: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  playersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  playersCard: {
    padding: 0,
    overflow: 'hidden',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  playerRowSelf: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  nameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  playerScore: {
    ...typography.caption,
    color: colors.textMuted,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  readyText: {
    ...typography.caption,
    color: colors.success,
    fontFamily: 'Poppins-SemiBold',
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
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  notReadyText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  nudgeBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsWrap: {
    marginTop: spacing.xl,
  },
  waitingNotice: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  waitingText: {
    ...typography.small,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  errorText: {
    ...typography.small,
    color: colors.danger,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
