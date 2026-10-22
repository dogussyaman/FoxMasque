import { useEffect, useRef, useState } from 'react';
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
import { ChevronLeft, LogIn, Users, KeyRound, Sparkles, Eye, EyeOff } from 'lucide-react-native';
import { Screen, Button, Card, Avatar, Badge, StickyActionBar, Input } from '@/components/ui';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { AVATAR_KEYS, DICEBEAR_AVATAR_KEYS } from '@/features/game/players';
import type { RoomSummary } from '@/services/types';
import { mascotImages } from '@/assets/illustrations';

export default function JoinRoomScreen() {
  const { service, currentPlayer, setCurrentPlayer, setRoomCode, setRoomState } = useGameStore();
  const { trigger } = useHaptics();

  const [code, setCode] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [showRoomPassword, setShowRoomPassword] = useState(false);
  const [name, setName] = useState(currentPlayer?.name ?? 'Oyuncu');
  const [avatarKey, setAvatarKey] = useState(currentPlayer?.avatarKey ?? 'fox');
  const [openRooms, setOpenRooms] = useState<RoomSummary[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    service.listOpenRooms()
      .then((rooms) => {
        if (active) setOpenRooms(rooms);
      })
      .catch((e) => {
        if (active) setError(`Açık odalar yüklenemedi: ${(e as Error).message}`);
      })
      .finally(() => {
        if (active) setLoadingRooms(false);
      });
    return () => {
      active = false;
    };
  }, [service]);

  const handleJoin = async (targetCode?: string) => {
    if (submitting.current) return;
    const finalCode = (targetCode || code).trim().toUpperCase();
    if (!/^[A-Z0-9]{5,6}$/.test(finalCode)) {
      setError('Lütfen geçerli 5-6 karakterli bir oda kodu gir.');
      return;
    }
    submitting.current = true;
    trigger('medium');
    setLoading(true);
    setError(null);
    try {
      const res = await service.joinRoom(
        finalCode,
        name.trim() || 'Oyuncu',
        avatarKey,
        roomPassword || undefined
      );
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
      submitting.current = false;
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
          style={{ flex: 1 }}
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
              placeholder="TUZAK"
              placeholderTextColor={colors.textMuted}
              style={[styles.giantCodeInput, isFocused && styles.giantCodeInputFocused]}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
              underlineColorAndroid="transparent"
            />
          </Card>

          <Card variant="surface" style={styles.sectionCard}>
            <View style={styles.codeHeaderRow}>
              <KeyRound color={colors.purpleSoft} size={18} />
              <Text style={styles.sectionLabel}>Oda Şifresi</Text>
            </View>
            <Text style={styles.roomPasswordHint}>Kilitli odalarda gereklidir; açık odalarda boş bırak.</Text>
            <View style={styles.roomPasswordRow}>
              <TextInput
                value={roomPassword}
                onChangeText={(value) => {
                  setError(null);
                  setRoomPassword(value);
                }}
                placeholder="Oda şifresi"
                placeholderTextColor={colors.textMuted}
                style={styles.roomPasswordInput}
                secureTextEntry={!showRoomPassword}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={72}
                accessibilityLabel="Oda şifresi"
              />
              <Pressable
                onPress={() => setShowRoomPassword((visible) => !visible)}
                accessibilityRole="button"
                accessibilityLabel={showRoomPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                style={styles.passwordVisibilityButton}
              >
                {showRoomPassword
                  ? <EyeOff color={colors.textSecondary} size={20} />
                  : <Eye color={colors.textSecondary} size={20} />}
              </Pressable>
            </View>
          </Card>

          {/* Profile Card */}
          <Card variant="surface" style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Lobiye Giriş İsmin</Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="Takma Adın"
              placeholderTextColor={colors.textMuted}
              style={styles.nameInput}
              maxLength={16}
              variant="surface"
              focusedBorderColor={colors.orange}
            />

            <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Avatarını Seç</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.avatarScroll}
            >
              {[...AVATAR_KEYS, ...DICEBEAR_AVATAR_KEYS].map((key) => {
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

          {/* Open Rooms Section */}
          {loadingRooms ? (
            <Text style={styles.roomPasswordHint}>Açık odalar aranıyor...</Text>
          ) : null}
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
                  disabled={loading}
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
        <StickyActionBar>
          {error ? (
            <View style={styles.errorWrap}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}
          <Button
            label="Lobiye Katıl"
            onPress={() => handleJoin()}
            variant="orange"
            loading={loading}
            fullWidth
            icon={<LogIn color="#FFF" size={20} />}
          />
        </StickyActionBar>
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
  scroll: { paddingBottom: spacing.md },
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
  roomPasswordHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  roomPasswordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgSurfaceAlt,
  },
  roomPasswordInput: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Medium',
  },
  passwordVisibilityButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  giantCodeInputFocused: {
    borderColor: colors.orange,
  },
  nameInput: {
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
