import { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Crown, Sparkles, Home, RotateCcw } from 'lucide-react-native';
import { Screen, Button, Card, Badge, Avatar } from '@/components/ui';
import { colors, spacing, typography, radii } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';

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
    <Screen>
      <View style={styles.topHeader}>
        <View style={styles.crownWrap}>
          <Crown color="#FBBF24" size={36} fill="#FBBF24" />
        </View>
        <Text style={styles.title}>
          {isMeWinner ? 'Tebrikler, Kazandın! 🏆' : 'Parti Sona Erdi!'}
        </Text>
        <Text style={styles.subtitle}>
          Şampiyon: {winner?.name ?? 'Bilinmiyor'} ({winner?.score ?? 0} Puan)
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Top 3 Podium */}
        {topThree.length >= 2 ? (
          <View style={styles.podiumContainer}>
            {/* 2nd place */}
            <View style={[styles.podiumCol, styles.secondPlace]}>
              <Avatar avatarKey={topThree[1].avatarKey} size={50} />
              <View style={[styles.rankCircle, { backgroundColor: '#94A3B8' }]}>
                <Text style={styles.rankNum}>2</Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>
                {topThree[1].name}
              </Text>
              <Text style={styles.podiumScore}>{topThree[1].score} p</Text>
              <View style={[styles.podiumBar, { height: 70, backgroundColor: 'rgba(148, 163, 184, 0.25)' }]} />
            </View>

            {/* 1st place */}
            <View style={[styles.podiumCol, styles.firstPlace]}>
              <View style={styles.miniCrown}>
                <Crown color="#FBBF24" size={22} fill="#FBBF24" />
              </View>
              <Avatar avatarKey={topThree[0].avatarKey} size={64} />
              <View style={[styles.rankCircle, { backgroundColor: '#FBBF24' }]}>
                <Text style={styles.rankNum}>1</Text>
              </View>
              <Text style={[styles.podiumName, { fontFamily: 'Poppins-Bold' }]} numberOfLines={1}>
                {topThree[0].name}
              </Text>
              <Text style={[styles.podiumScore, { color: colors.orange }]}>{topThree[0].score} p</Text>
              <View style={[styles.podiumBar, { height: 100, backgroundColor: 'rgba(251, 191, 36, 0.3)' }]} />
            </View>

            {/* 3rd place */}
            {topThree[2] ? (
              <View style={[styles.podiumCol, styles.thirdPlace]}>
                <Avatar avatarKey={topThree[2].avatarKey} size={50} />
                <View style={[styles.rankCircle, { backgroundColor: '#D97706' }]}>
                  <Text style={styles.rankNum}>3</Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {topThree[2].name}
                </Text>
                <Text style={styles.podiumScore}>{topThree[2].score} p</Text>
                <View style={[styles.podiumBar, { height: 50, backgroundColor: 'rgba(217, 119, 6, 0.25)' }]} />
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Remainder list */}
        {rest.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tüm Sıralama</Text>
            <Card style={styles.restCard}>
              {rest.map((player, idx) => {
                const rank = idx + 4;
                const isMe = player.id === currentPlayer?.id;
                return (
                  <View key={player.id} style={[styles.restRow, isMe && styles.meRow]}>
                    <Text style={styles.restRank}>#{rank}</Text>
                    <Avatar avatarKey={player.avatarKey} size={36} />
                    <Text style={[styles.restName, isMe && { color: colors.purpleSoft, fontFamily: 'Poppins-Bold' }]}>
                      {player.name} {isMe ? '(Sen)' : ''}
                    </Text>
                    <Badge tone="neutral">{player.score} p</Badge>
                  </View>
                );
              })}
            </Card>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionsWrap}>
          <Button
            label="Yeni Parti Başlat"
            onPress={handlePlayAgain}
            variant="primary"
            fullWidth
            icon={<RotateCcw color="#FFF" size={20} />}
            style={{ marginBottom: 12 }}
          />
          <Button
            label="Ana Sayfaya Dön"
            onPress={handleGoHome}
            variant="secondary"
            fullWidth
            icon={<Home color={colors.textPrimary} size={20} />}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  crownWrap: {
    marginBottom: 6,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  scroll: {
    paddingBottom: 40,
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    paddingHorizontal: 8,
  },
  podiumCol: {
    flex: 1,
    alignItems: 'center',
  },
  firstPlace: {
    transform: [{ translateY: -10 }],
  },
  secondPlace: {},
  thirdPlace: {},
  miniCrown: {
    marginBottom: 4,
  },
  rankCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10,
    zIndex: 2,
    borderWidth: 2,
    borderColor: colors.bgDark,
  },
  rankNum: {
    color: '#000',
    fontSize: 11,
    fontFamily: 'Poppins-Bold',
  },
  podiumName: {
    ...typography.caption,
    color: colors.textPrimary,
    marginTop: 6,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
  },
  podiumScore: {
    ...typography.caption,
    color: colors.textSecondary,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 6,
  },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  restCard: {
    padding: 0,
    overflow: 'hidden',
  },
  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  meRow: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  restRank: {
    ...typography.caption,
    color: colors.textMuted,
    width: 28,
  },
  restName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  actionsWrap: {
    marginTop: spacing.xl,
  },
});
