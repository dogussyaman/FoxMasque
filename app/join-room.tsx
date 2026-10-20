import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, LogIn, Users } from 'lucide-react-native';
import { Screen, Button, Card, Avatar, Badge } from '@/components/ui';
import { colors, spacing, typography, radii } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { AVATAR_KEYS, type AvatarKey } from '@/features/game/players';
import type { RoomSummary } from '@/services/types';

export default function JoinRoomScreen() {
  const { service, currentPlayer, setCurrentPlayer, setRoomCode, setRoomState } = useGameStore();
  const { trigger } = useHaptics();

  const [code, setCode] = useState('');
  const [name, setName] = useState(currentPlayer?.name ?? 'Oyuncu');
  const [avatarKey, setAvatarKey] = useState<AvatarKey>((currentPlayer?.avatarKey as AvatarKey) ?? 'panda');
  const [openRooms, setOpenRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    service.listOpenRooms().then(setOpenRooms).catch(() => {});
  }, [service]);

  const handleJoin = async (targetCode?: string) => {
    const finalCode = (targetCode || code).trim().toUpperCase();
    if (!finalCode) {
      setError('Lütfen bir oda kodu gir.');
      return;
    }
    trigger('medium');
    setLoading(true);
    setError(null);
    try {
      const res = await service.joinRoom(finalCode, name.trim() || 'Oyuncu', avatarKey);
      setRoomCode(finalCode);
      const state = await service.getRoomState(finalCode);
      setRoomState(state);
      if (state?.players[res.playerId]) {
        setCurrentPlayer(state.players[res.playerId]);
      }
      router.replace('/lobby');
    } catch (e) {
      setError((e as Error).message || 'Odaya katılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={colors.textPrimary} size={24} />
        </Pressable>
        <Text style={styles.screenTitle}>Odaya Katıl</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Code Input Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Oda Kodu</Text>
          <TextInput
            value={code}
            onChangeText={(txt) => setCode(txt.toUpperCase())}
            placeholder="KODU GİR (Örn: ABC24)"
            placeholderTextColor={colors.textMuted}
            style={styles.codeInput}
            maxLength={6}
            autoCapitalize="characters"
          />
        </Card>

        {/* Profile Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Oyuncu İsmi</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="İsmin"
            placeholderTextColor={colors.textMuted}
            style={styles.nameInput}
            maxLength={16}
          />

          <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Avatarın</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarScroll}>
            {AVATAR_KEYS.map((key) => {
              const active = avatarKey === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    trigger('light');
                    setAvatarKey(key);
                  }}
                  style={[styles.avatarBox, active && styles.avatarBoxActive]}
                >
                  <Avatar avatarKey={key} size={42} />
                </Pressable>
              );
            })}
          </ScrollView>
        </Card>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          label="Odaya Katıl"
          onPress={() => handleJoin()}
          variant="primary"
          loading={loading}
          fullWidth
          icon={<LogIn color="#FFF" size={20} />}
        />

        {/* Open Rooms List */}
        {openRooms.length > 0 ? (
          <View style={styles.openRoomsWrap}>
            <Text style={styles.sectionTitle}>Açık Odalar ({openRooms.length})</Text>
            {openRooms.map((room) => (
              <Pressable
                key={room.code}
                onPress={() => handleJoin(room.code)}
                style={styles.roomRow}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.roomCode}>{room.code}</Text>
                  <Text style={styles.roomHost}>Kurucu: {room.hostName}</Text>
                </View>
                <View style={styles.roomRight}>
                  <Badge tone="purple">
                    <Users size={12} color="#FFF" /> {room.playerCount} Oyuncu
                  </Badge>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
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
  screenTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  scroll: {
    paddingBottom: 40,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  codeInput: {
    backgroundColor: colors.bgSurfaceAlt,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    letterSpacing: 4,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  nameInput: {
    backgroundColor: colors.bgSurfaceAlt,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  avatarScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  avatarBox: {
    padding: 4,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarBoxActive: {
    borderColor: colors.purpleSoft,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
  },
  errorText: {
    ...typography.small,
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  openRoomsWrap: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgSurface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  roomCode: {
    ...typography.h4,
    color: colors.purpleSoft,
    letterSpacing: 2,
  },
  roomHost: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  roomRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
