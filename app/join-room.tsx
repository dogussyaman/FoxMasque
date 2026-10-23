import { useTheme, useThemeStyles } from '@/theme/ThemeProvider';
import type { ThemeColors } from '@/theme/ThemeProvider';
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
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, LogIn, Users, KeyRound, Sparkles, Eye, EyeOff } from 'lucide-react-native';
import { Screen, Button, Card, Avatar, Badge, StickyActionBar, Input } from '@/components/ui';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { AVATAR_KEYS, DICEBEAR_AVATAR_KEYS } from '@/features/game/players';
import type { RoomSummary } from '@/services/types';
import { mascotImages } from '@/assets/illustrations';

export default function JoinRoomScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const {
    service,
    currentPlayer,
    authStatus,
    setCurrentPlayer,
    setRoomCode,
    setRoomState,
  } = useGameStore();
  const params = useLocalSearchParams<{ code?: string | string[]; invite?: string | string[] }>();
  const { trigger } = useHaptics();

  const initialCode = typeof params.code === 'string' ? params.code.trim().toUpperCase() : '';
  const initialInvite = typeof params.invite === 'string' ? params.invite : '';
  const invalidInitialLink = (params.code !== undefined && !/^[A-Z0-9]{5,6}$/.test(initialCode))
    ? 'Davet bağlantısındaki oda kodu geçersiz.'
    : (initialInvite && !/^[A-Za-z0-9_-]{43}$/.test(initialInvite))
      ? 'Davet bağlantısı geçersiz.'
      : null;
  const [code, setCode] = useState(/^[A-Z0-9]{5,6}$/.test(initialCode) ? initialCode : '');
  const [roomPassword, setRoomPassword] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [inviteToken, setInviteToken] = useState(
    /^[A-Za-z0-9_-]{43}$/.test(initialInvite) ? initialInvite : ''
  );
  const [showRoomPassword, setShowRoomPassword] = useState(false);
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const [avatarOverride, setAvatarOverride] = useState<string | null>(null);
  const name = nameOverride ?? currentPlayer?.name ?? 'Oyuncu';
  const avatarKey = avatarOverride ?? currentPlayer?.avatarKey ?? 'fox';
  const [openRooms, setOpenRooms] = useState<RoomSummary[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(invalidInitialLink);
  const [isFocused, setIsFocused] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    if (authStatus === 'signed_out') {
      router.replace({
        pathname: '/auth',
        params: {
          returnTo: '/join-room',
          code: typeof params.code === 'string' ? params.code : undefined,
          invite: typeof params.invite === 'string' ? params.invite : undefined,
        },
      });
    }
  }, [authStatus, params.code, params.invite]);

  useEffect(() => {
    if (authStatus !== 'signed_in') return;
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
  }, [authStatus, service]);

  const handleJoin = async (targetCode?: string) => {
    if (submitting.current) return;
    const finalCode = (targetCode || code).trim().toUpperCase();
    if (!/^[A-Z0-9]{5,6}$/.test(finalCode)) {
      setError('Lütfen geçerli 5-6 karakterli bir oda kodu gir.');
      return;
    }
    submitting.current = true;
    setCode(finalCode);
    trigger('medium');
    setLoading(true);
    setError(null);
    try {
      const hasInvite = !!inviteToken && finalCode === code;
      const passwordConfirmed = requiresPassword && finalCode === code;
      if (!hasInvite && !passwordConfirmed) {
        const access = await service.checkRoomAccess(finalCode);
        if (access === 'password_required') {
          setCode(finalCode);
          setRequiresPassword(true);
          setRoomPassword('');
          setLoading(false);
          return;
        }
      }
      const res = await service.joinRoom(
        finalCode,
        name.trim() || 'Oyuncu',
        avatarKey,
        passwordConfirmed ? roomPassword || undefined : undefined,
        hasInvite ? inviteToken : undefined
      );
      setRoomCode(finalCode);
      const state = await service.getRoomState(finalCode);
      setRoomState(state);
      if (state?.players[res.playerId]) {
        setCurrentPlayer(state.players[res.playerId]);
      }
      router.replace('/lobby');
    } catch (e) {
      const cause = e as { code?: string; message?: string };
      if (requiresPassword && finalCode === code && cause.code === 'ROOM_ACCESS_DENIED') {
        setRoomPassword('');
        setError('Oda şifresi yanlış. Yeniden dene.');
      } else if (cause.code === 'ROOM_UNAVAILABLE') {
        setRequiresPassword(false);
        setRoomPassword('');
        setError('Oda bulunamadı veya yeni katılıma açık değil. Oda kodunu kontrol et.');
      } else if (cause.code === 'ROOM_FULL') {
        setError('Oda dolu. Başka bir odayı deneyebilirsin.');
      } else if (cause.code === 'GAME_ALREADY_STARTED') {
        setError('Oyun başladı; yeni oyuncu kabul edilmiyor.');
      } else if (cause.code === 'INVITE_INVALID') {
        setInviteToken('');
        setError('Davet bağlantısı geçersiz, süresi dolmuş veya kullanılmış.');
      } else if (cause.code === 'INVITE_UNAVAILABLE') {
        setError('Bu davet bağlantısı canlı oyun modunda kullanılabilir.');
      } else {
        setError(cause.message || 'Odaya katılırken bir hata oluştu.');
      }
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
                Arkadaşının verdiği 5-6 karakterli oda kodunu yaz ve lobiye ışınlan!
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
              <Text style={styles.sectionLabel}>Oda Kodu</Text>
            </View>

            <TextInput
              value={code}
              onChangeText={(txt) => {
                setError(null);
                setCode(txt.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                setRequiresPassword(false);
                setRoomPassword('');
                setInviteToken('');
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

          {requiresPassword ? (
            <Card variant="surface" style={styles.sectionCard}>
              <View style={styles.codeHeaderRow}>
                <KeyRound color={colors.purpleSoft} size={18} />
                <Text style={styles.sectionLabel}>Oda Şifresi</Text>
              </View>
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
          ) : null}

          <Pressable
            onPress={() => setShowProfileEditor((visible) => !visible)}
            style={styles.profileEditToggle}
            accessibilityRole="button"
          >
            <Text style={styles.profileEditText}>
              {name} olarak katıl · {showProfileEditor ? 'Profili gizle' : 'Profili düzenle'}
            </Text>
          </Pressable>
          {showProfileEditor ? (
            <Card variant="surface" style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Lobiye Giriş İsmin</Text>
              <Input
                value={name}
                onChangeText={setNameOverride}
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
                        setAvatarOverride(key);
                      }}
                      style={[styles.avatarBox, active && styles.avatarBoxActive]}
                    >
                      <Avatar avatarKey={key} size={42} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Card>
          ) : null}

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
            label={requiresPassword ? 'Şifreyle Katıl' : 'Lobiye Katıl'}
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
  profileEditToggle: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  profileEditText: {
    ...typography.caption,
    color: colors.textSecondary,
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
