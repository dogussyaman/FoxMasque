import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { Trophy, Crown, Medal, Flame } from 'lucide-react-native';
import { Screen, ScreenHeader, Card, Badge, Avatar } from '@/components/ui';
import { colors, spacing, typography, radii } from '@/theme';
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
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Liderlik"
          subtitle="En çok zartalayan parti şampiyonları"
          right={
            <View style={styles.badgeWrap}>
              <Flame color={colors.orange} size={18} />
              <Text style={styles.badgeText}>Sezon 1</Text>
            </View>
          }
        />

        {/* Tab Filters */}
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => onTabSelect('all')}
            style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Genel Sıralama</Text>
          </Pressable>
          <Pressable
            onPress={() => onTabSelect('weekly')}
            style={[styles.filterBtn, filter === 'weekly' && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === 'weekly' && styles.filterTextActive]}>Haftalık</Text>
          </Pressable>
          <Pressable
            onPress={() => onTabSelect('friends')}
            style={[styles.filterBtn, filter === 'friends' && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === 'friends' && styles.filterTextActive]}>Arkadaşlar</Text>
          </Pressable>
        </View>

        {/* Top 3 Podium */}
        {topThree.length >= 3 ? (
          <View style={styles.podiumContainer}>
            {/* 2nd place */}
            <View style={[styles.podiumCol, styles.secondPlace]}>
              <Avatar avatarKey={topThree[1].avatarKey} size={54} />
              <View style={[styles.rankCircle, { backgroundColor: '#94A3B8' }]}>
                <Text style={styles.rankNum}>2</Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>
                {topThree[1].name}
              </Text>
              <Text style={styles.podiumScore}>{topThree[1].score} p</Text>
              <View style={[styles.podiumBar, { height: 75, backgroundColor: 'rgba(148, 163, 184, 0.25)' }]} />
            </View>

            {/* 1st place */}
            <View style={[styles.podiumCol, styles.firstPlace]}>
              <View style={styles.crownWrap}>
                <Crown color="#FBBF24" size={26} fill="#FBBF24" />
              </View>
              <Avatar avatarKey={topThree[0].avatarKey} size={68} />
              <View style={[styles.rankCircle, { backgroundColor: '#FBBF24' }]}>
                <Text style={styles.rankNum}>1</Text>
              </View>
              <Text style={[styles.podiumName, { fontFamily: 'Poppins-Bold' }]} numberOfLines={1}>
                {topThree[0].name}
              </Text>
              <Text style={[styles.podiumScore, { color: colors.orange }]}>{topThree[0].score} p</Text>
              <View style={[styles.podiumBar, { height: 105, backgroundColor: 'rgba(251, 191, 36, 0.3)' }]} />
            </View>

            {/* 3rd place */}
            <View style={[styles.podiumCol, styles.thirdPlace]}>
              <Avatar avatarKey={topThree[2].avatarKey} size={54} />
              <View style={[styles.rankCircle, { backgroundColor: '#D97706' }]}>
                <Text style={styles.rankNum}>3</Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>
                {topThree[2].name}
              </Text>
              <Text style={styles.podiumScore}>{topThree[2].score} p</Text>
              <View style={[styles.podiumBar, { height: 55, backgroundColor: 'rgba(217, 119, 6, 0.25)' }]} />
            </View>
          </View>
        ) : null}

        {/* Remainder list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tüm Yarışmacılar</Text>
          <Card>
            {rest.map((p, index) => {
              const rank = index + 4;
              const isMe = currentPlayer?.id === p.id;
              return (
                <View key={p.id} style={[styles.row, isMe && styles.meRow]}>
                  <Text style={styles.rankText}>{rank}</Text>
                  <Avatar avatarKey={p.avatarKey} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, isMe && { color: colors.purpleSoft, fontFamily: 'Poppins-Bold' }]}>
                      {p.name} {isMe ? '(Sen)' : ''}
                    </Text>
                    <Text style={styles.subtext}>Seviye {Math.floor(p.score / 150) + 1}</Text>
                  </View>
                  <Badge tone={isMe ? 'purple' : 'neutral'}>{p.score} p</Badge>
                </View>
              );
            })}
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgSurfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    ...typography.caption,
    color: colors.orange,
    fontFamily: 'Poppins-SemiBold',
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgSurfaceAlt,
    borderRadius: radii.xl,
    padding: 4,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.purple,
  },
  filterText: {
    ...typography.small,
    color: colors.textMuted,
    fontFamily: 'Poppins-Medium',
  },
  filterTextActive: {
    color: colors.textOnAccent,
    fontFamily: 'Poppins-SemiBold',
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
    marginTop: spacing.md,
    marginBottom: spacing['2xl'],
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
    ...typography.bodyMedium,
    color: colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  podiumScore: {
    ...typography.caption,
    color: colors.textSecondary,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 8,
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
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  meRow: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: radii.md,
    paddingHorizontal: 8,
  },
  rankText: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    width: 22,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  name: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  subtext: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
