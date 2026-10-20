import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, LogIn, Users, KeyRound, Sparkles } from 'lucide-react-native';
import { Screen, Button, Card, Avatar, Badge } from '@/components/ui';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { AVATAR_KEYS, type AvatarKey } from '@/features/game/players';
import type { RoomSummary } from '@/services/types';
import { mascotImages } from '@/assets/illustrations';

export default function JoinRoomScreen() {
  const { service, currentPlayer, setCurrentPlayer, setRoomCode, setRoomState } = useGameStore();
  const { trigger } = useHaptics();

  const [code, setCode] = useState('');
  const [name, setName] = useState(currentPlayer?.name ?? 'Oyuncu');
  const [avatarKey, setAvatarKey] = useState<AvatarKey>((currentPlayer?.avatarKey as AvatarKey) ?? 'panda');
  const [openRooms, setOpenRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    service.listOpenRooms().then(setOpenRooms).catch(() => {});
  }, [service]);

  const handleJoin = async (targetCode?: string) => {
    const finalCode = (targetCode || code).trim().toUpperCase();
    if (!finalCode) {
      setError('Lütfen 5 haneli bir oda kodu gir.');
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
    <Screen gradient diagonalSlice>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color={colors.textPrimary} size={22} />
          </Pressable>
          <Text style={styles.screenTitle}>Odaya Katıl</Text>
          <Badge tone="orange" sticker>GİRİŞ</Badge>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Mascot Banner */}
          <View style={styles.mascotBanner}>
            <Image
              source={mascotImages.searching}
              style={styles.mascotImage}
              resizeMode="contain"
            />
            <View style={{ flex: 1, paddingLeft: 10 }}>
              <Text style={styles.mascotTitle}>Partiye Katılmaya Hazır mısın?</Text>
              <Text style={styles.mascotDesc}>
                Arkadaşının verdiği 5 haneli oda kodunu yaz ve lobiye ışınlan!
              </Text>
            </View>
          </View>

          {/* Giant Code Input Card */}
          <Card
            variant="surface"
            style={[
              styles.sectionCard,
              isFocused && styles.sectionCardFocused,
            ]}
          >
            <View style={styles.codeHeaderRow}>
              <KeyRound color={colors.orange} size={18} />
              <Text style={styles.sectionLabel}>5 Haneli Oda Kodu</Text>
            </View>

            <TextInput
              value={code}
              onChangeText={(txt) => {
                setError(null);
                setCode(txt.toUpperCase().replace(/[^A-Z0-9]/g, ''));
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="ZARTO"
              placeholderTextColor={colors.textMuted}
              style={styles.giantCodeInput}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </Card>

          {/* Profile Card */}
          <Card variant="surface" style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Lobiye Giriş İsmin</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Takma Adın"
              placeholderTextColor={colors.textMuted}
              style={styles.nameInput}
              maxLength={16}
            />

            <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Avatarını Seç</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.avatarScroll}
            >
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

          {/* Error Message with Warning Styling */}
          {error ? (
            <View style={styles.errorWrap}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* Main Action Button */}
          <Button
            label="Lobiye Katıl"
            onPress={() => handleJoin()}
            variant="orange"
            loading={loading}
            fullWidth
            icon={<LogIn color="#FFF" size={20} />}
            style={{ marginTop: spacing.xs }}
          />

          {/* Open Rooms Section */}
          {openRooms.length > 0 && (
            <View style={styles.openRoomsWrap}>
              <View style={styles.openRoomsHeader}>
                <Sparkles color={colors.yellow} size={16} />
                <Text style={styles.openRoomsTitle}>Açık Odalar ({openRooms.length})</Text>
              </View>

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
                  <Badge tone="purple">
                    <Users size={12} color="#FFF" /> {room.playerCount} Oyuncu
                  </Badge>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  screenTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
  },
  scroll: {
    paddingBottom: 48,
  },
  mascotBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  mascotImage: {
    width: 76,
    height: 76,
  },
  mascotTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  mascotDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionCardFocused: {
    borderColor: colors.orange,
    ...shadows.glowOrange,
  },
  codeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionLabel: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
  },
  giantCodeInput: {
    backgroundColor: colors.bgSurfaceAlt,
    borderRadius: radii.xl,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.orange,
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    letterSpacing: 6,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
  nameInput: {
    backgroundColor: colors.bgSurfaceAlt,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    marginTop: 6,
  },
  avatarScroll: {
    gap: 10,
    paddingVertical: 8,
  },
  avatarBox: {
    padding: 3,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarBoxActive: {
    borderColor: colors.orange,
    backgroundColor: 'rgba(255, 113, 59, 0.2)',
  },
  errorWrap: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.small,
    color: colors.dangerSoft,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  openRoomsWrap: {
    marginTop: spacing.xl,
  },
  openRoomsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  openRoomsTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginBottom: 8,
  },
  roomCode: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: colors.purpleSoft,
    letterSpacing: 2,
  },
  roomHost: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
