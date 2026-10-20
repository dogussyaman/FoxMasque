import { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { Crown, Sparkles, Home, RotateCcw, Trophy, Award } from 'lucide-react-native';
import { Screen, Button, Card, Badge, Avatar } from '@/components/ui';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { mascotImages } from '@/assets/illustrations';

export default function GameOverScreen() {
  const { roomState, currentPlayer, roomCode, service } = useGameStore();
  const { trigger } = useHaptics();

  useEffect(() => {
    trigger('success');
  }, [trigger]);

  const playersList = roomState
    ? Object.values(roomState.players).sort((a, b) => b.score - a.score)
    : [];

  const winner = playersList[0];
  const topThree = playersList.slice(0, 3);
  const rest = playersList.slice(3);

  const myRankIndex = playersList.findIndex((p) => p.id === currentPlayer?.id);
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : null;
  const isMeWinner = winner?.id === currentPlayer?.id;
  const isHost = currentPlayer?.isHost || playersList.find((p) => p.id === currentPlayer?.id)?.isHost;

  useEffect(() => {
    if (roomState?.phase === 'lobby') {
      router.replace('/lobby');
    }
  }, [roomState?.phase]);

  const handlePlayAgain = async () => {
    trigger('medium');
    if (roomCode && isHost) {
      try {
        await service.rematch(roomCode);
        router.replace('/lobby');
        return;
      } catch {}
    }
    router.replace('/create-room');
  };

  const handleGoHome = () => {
    trigger('light');
    router.replace('/(tabs)');
  };

  return (
    <Screen gradient diagonalSlice>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Grand Champion Mascot Banner */}
        <View style={styles.topHeader}>
          <View style={styles.winnerMascotCircle}>
            <Image
              source={mascotImages.winner}
              style={styles.winnerMascot}
              resizeMode="contain"
            />
          </View>

          <View style={styles.trophyPill}>
            <Crown color={colors.yellow} size={15} fill={colors.yellow} />
            <Text style={styles.trophyPillText}>FoxMasque ŞAMPİYONU</Text>
          </View>

          <Text style={styles.winnerName}>{winner?.name ?? 'Şampiyon'}</Text>
          <Text style={styles.winnerScore}>{winner?.score ?? 0} Toplam Puan</Text>

          {isMeWinner ? (
            <Badge tone="yellow" sticker style={{ marginTop: 6 }}>
              🏆 TEBRİKLER, ŞAMPİYON SENSİN!
            </Badge>
          ) : myRank ? (
            <Badge tone="purple" sticker style={{ marginTop: 6 }}>
              Sıralaman: #{myRank} • {currentPlayer?.score ?? 0} Puan
            </Badge>
          ) : null}
        </View>

        {/* Top 3 Final Podium */}
        {topThree.length >= 2 && (
          <View style={styles.podiumContainer}>
            {/* 2nd place */}
            <View style={[styles.podiumCol, styles.secondPlace]}>
              <Avatar avatarKey={topThree[1].avatarKey} size={48} />
              <View style={styles.silverBadge}>
                <Text style={styles.podiumRankNum}>2</Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>
                {topThree[1].name}
              </Text>
              <Text style={styles.podiumScore}>{topThree[1].score} P</Text>
              <View style={styles.pillarSecond}>
                <Text style={styles.pillarLabel}>2.</Text>
              </View>
            </View>

            {/* 1st place */}
            <View style={[styles.podiumCol, styles.firstPlace]}>
              <View style={styles.miniCrown}>
                <Crown color={colors.yellow} size={22} fill={colors.yellow} />
              </View>
              <Avatar avatarKey={topThree[0].avatarKey} size={60} ring />
              <View style={styles.goldBadge}>
                <Text style={styles.podiumRankNum}>1</Text>
              </View>
              <Text style={[styles.podiumName, styles.podiumNameFirst]} numberOfLines={1}>
                {topThree[0].name}
              </Text>
              <Text style={[styles.podiumScore, styles.podiumScoreFirst]}>
                {topThree[0].score} P
              </Text>
              <View style={styles.pillarFirst}>
                <Trophy color={colors.yellow} size={26} />
              </View>
            </View>

            {/* 3rd place */}
            {topThree[2] && (
              <View style={[styles.podiumCol, styles.thirdPlace]}>
                <Avatar avatarKey={topThree[2].avatarKey} size={44} />
                <View style={styles.bronzeBadge}>
                  <Text style={styles.podiumRankNum}>3</Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {topThree[2].name}
                </Text>
                <Text style={styles.podiumScore}>{topThree[2].score} P</Text>
                <View style={styles.pillarThird}>
                  <Text style={styles.pillarLabel}>3.</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Remainder list */}
        {rest.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DİĞER YARIŞMACILAR</Text>
            <View style={styles.restListWrap}>
              {rest.map((player, idx) => {
                const rank = idx + 4;
                const isMe = player.id === currentPlayer?.id;
                return (
                  <Card
                    key={player.id}
                    variant={isMe ? 'accent' : 'surface'}
                    style={[styles.restRow, isMe && styles.meRow]}
                  >
                    <Text style={styles.restRank}>#{rank}</Text>
                    <Avatar avatarKey={player.avatarKey} size={36} ring={isMe} />
                    <Text style={[styles.restName, isMe && { color: colors.orange }]}>
                      {player.name} {isMe ? '(Sen)' : ''}
                    </Text>
                    <Badge tone={isMe ? 'orange' : 'neutral'} sticker>
                      {player.score} P
                    </Badge>
                  </Card>
                );
              })}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsWrap}>
          <Button
            label="Yeniden Oyna (Rematch)"
            onPress={handlePlayAgain}
            variant="orange"
            fullWidth
            icon={<RotateCcw color="#FFF" size={20} />}
            style={{ marginBottom: 12 }}
          />
          <Button
            label="Ana Sayfaya Dön"
            onPress={handleGoHome}
            variant="secondary"
            fullWidth
            icon={<Home color={colors.textPrimary} size={18} />}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 48,
    paddingTop: 4,
  },
  topHeader: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  winnerMascotCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.bgCard,
    borderWidth: 3,
    borderColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...shadows.glow,
  },
  winnerMascot: {
    width: 130,
    height: 130,
  },
  trophyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 209, 102, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.yellow,
    marginBottom: 6,
  },
  trophyPillText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: colors.yellow,
    letterSpacing: 1,
  },
  winnerName: {
    ...typography.h1,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
  },
  winnerScore: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: colors.orange,
    marginTop: 2,
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    marginVertical: spacing.lg,
    paddingHorizontal: 8,
  },
  podiumCol: {
    flex: 1,
    alignItems: 'center',
  },
  firstPlace: {
    transform: [{ translateY: -12 }],
  },
  secondPlace: {},
  thirdPlace: {},
  miniCrown: {
    marginBottom: -4,
  },
  goldBadge: {
    position: 'absolute',
    bottom: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#171026',
  },
  silverBadge: {
    position: 'absolute',
    bottom: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#C0C0C0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#171026',
  },
  bronzeBadge: {
    position: 'absolute',
    bottom: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#CD7F32',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#171026',
  },
  podiumRankNum: {
    color: '#171026',
    fontSize: 11,
    fontFamily: 'Poppins-Bold',
  },
  podiumName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: colors.textPrimary,
    marginTop: 10,
    textAlign: 'center',
  },
  podiumNameFirst: {
    fontSize: 14,
    color: colors.yellow,
  },
  podiumScore: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  podiumScoreFirst: {
    fontSize: 13,
    color: colors.orange,
  },
  pillarFirst: {
    width: '100%',
    height: 90,
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.yellow,
    borderBottomWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  pillarSecond: {
    width: '100%',
    height: 65,
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#C0C0C0',
    borderBottomWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarThird: {
    width: '100%',
    height: 48,
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#CD7F32',
    borderBottomWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: colors.textMuted,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  restListWrap: {
    gap: 8,
    marginBottom: spacing.xl,
  },
  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  meRow: {
    borderColor: colors.orange,
    borderWidth: 1.5,
  },
  restRank: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: colors.textMuted,
    width: 28,
  },
  restName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    marginLeft: 8,
  },
  actionsWrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
