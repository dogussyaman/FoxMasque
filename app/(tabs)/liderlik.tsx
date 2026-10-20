import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { Trophy, Crown, Medal, Flame } from 'lucide-react-native';
import { Screen, ScreenHeader, Card, Badge, Avatar } from '@/components/ui';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import type { Player } from '@/types/game';

type FilterType = 'all' | 'weekly' | 'friends';

export default function LiderlikScreen() {
  const { service, currentPlayer } = useGameStore();
  const { trigger } = useHaptics();
  const [filter, setFilter] = useState<FilterType>('all');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    service.getLeaderboard().then((lb) => {
      if (mounted) {
        setPlayers(lb);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [service]);

  const topThree = players.slice(0, 3);
  const rest = players.slice(3);

  const onTabSelect = (tab: FilterType) => {
    trigger('light');
    setFilter(tab);
  };

  return (
    <Screen gradient diagonalSlice padded={false} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Liderlik"
          subtitle="En çok zartalayan parti şampiyonları"
          right={
            <View style={styles.badgeWrap}>
              <Flame color={colors.orange} size={16} />
              <Text style={styles.badgeText}>SEZON 1</Text>
            </View>
          }
        />

        {/* Tab Filters */}
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => onTabSelect('all')}
            style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Genel Sıralama
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onTabSelect('weekly')}
            style={[styles.filterBtn, filter === 'weekly' && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === 'weekly' && styles.filterTextActive]}>
              Haftalık
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onTabSelect('friends')}
            style={[styles.filterBtn, filter === 'friends' && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === 'friends' && styles.filterTextActive]}>
              Arkadaşlar
            </Text>
          </Pressable>
        </View>

        {/* Top 3 Podium */}
        {topThree.length >= 3 && (
          <View style={styles.podiumContainer}>
            {/* 2nd place */}
            <View style={[styles.podiumCol, styles.secondPlace]}>
              <Avatar avatarKey={topThree[1].avatarKey} size={50} />
              <View style={styles.silverBadge}>
                <Text style={styles.rankNum}>2</Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>
                {topThree[1].name}
              </Text>
              <Text style={styles.podiumScore}>{topThree[1].score} P</Text>
              <View style={styles.pillarSecond}>
                <Medal color="#C0C0C0" size={20} />
              </View>
            </View>

            {/* 1st place */}
            <View style={[styles.podiumCol, styles.firstPlace]}>
              <View style={styles.crownWrap}>
                <Crown color={colors.yellow} size={24} fill={colors.yellow} />
              </View>
              <Avatar avatarKey={topThree[0].avatarKey} size={62} ring />
              <View style={styles.goldBadge}>
                <Text style={styles.rankNum}>1</Text>
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
            <View style={[styles.podiumCol, styles.thirdPlace]}>
              <Avatar avatarKey={topThree[2].avatarKey} size={46} />
              <View style={styles.bronzeBadge}>
                <Text style={styles.rankNum}>3</Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>
                {topThree[2].name}
              </Text>
              <Text style={styles.podiumScore}>{topThree[2].score} P</Text>
              <View style={styles.pillarThird}>
                <Medal color="#CD7F32" size={18} />
              </View>
            </View>
          </View>
        )}

        {/* Remainder list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TÜM YARIŞMACILAR</Text>
          <View style={styles.rankedListWrap}>
            {rest.map((p, index) => {
              const rank = index + 4;
              const isMe = currentPlayer?.id === p.id;
              return (
                <Card
                  key={p.id}
                  variant={isMe ? 'accent' : 'surface'}
                  style={[styles.playerRow, isMe && styles.meRow]}
                >
                  <Text style={styles.rankText}>#{rank}</Text>
                  <Avatar avatarKey={p.avatarKey} size={40} ring={isMe} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.name, isMe && { color: colors.orange }]}>
                      {p.name} {isMe ? '(Sen)' : ''}
                    </Text>
                    <Text style={styles.subtext}>Seviye {Math.floor(p.score / 150) + 1}</Text>
                  </View>
                  <Badge tone={isMe ? 'orange' : 'neutral'} sticker>{p.score} P</Badge>
                </Card>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 28,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 113, 59, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.orange,
  },
  badgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: colors.orange,
    letterSpacing: 0.8,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    padding: 4,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.orange,
    ...shadows.glowOrange,
  },
  filterText: {
    ...typography.small,
    color: colors.textSecondary,
    fontFamily: 'Poppins-Medium',
  },
  filterTextActive: {
    color: '#FFF',
    fontFamily: 'Poppins-Bold',
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
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
  crownWrap: {
    marginBottom: -4,
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
  rankNum: {
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
    height: 68,
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
    height: 52,
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#CD7F32',
    borderBottomWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  rankedListWrap: {
    gap: 8,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  meRow: {
    borderColor: colors.orange,
    borderWidth: 1.5,
  },
  rankText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: colors.textMuted,
    width: 30,
  },
  name: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  subtext: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
});
