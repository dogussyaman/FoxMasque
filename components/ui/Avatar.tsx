import { Image, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, typography } from '@/theme';
import { avatarOf, diceBearAvatarSvg } from '@/features/game/players';

interface AvatarProps {
  avatarKey: string;
  size?: number;
  online?: boolean;
  ring?: boolean;
}

export function Avatar({ avatarKey, size = 44, online, ring }: AvatarProps) {
  const av = avatarOf(avatarKey);
  const imageUri = /^(https?:|file:|content:)/.test(avatarKey) ? avatarKey : null;
  const diceBearSvg = imageUri ? null : diceBearAvatarSvg(avatarKey);
  return (
    <View style={{ position: 'relative' }}>
      <LinearGradient
        colors={[av.gradient[0], av.gradient[1]]}
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
            borderWidth: ring ? 2 : 0,
            borderColor: ring ? colors.purpleSoft : 'transparent',
          },
        ]}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} />
        ) : diceBearSvg ? (
          <SvgXml xml={diceBearSvg} width={size} height={size} />
        ) : (
          <Text style={{ fontSize: size * 0.5 }}>{av.emoji}</Text>
        )}
      </LinearGradient>
      {online !== undefined ? (
        <View
          style={[
            styles.dot,
            { backgroundColor: online ? colors.success : colors.textMuted },
          ]}
        />
      ) : null}
    </View>
  );
}

export function AvatarStack({ keys, max = 4, size = 32 }: { keys: string[]; max?: number; size?: number }) {
  const shown = keys.slice(0, max);
  const extra = Math.max(0, keys.length - max);
  return (
    <View style={styles.stack}>
      {shown.map((k, i) => (
        <View key={i} style={{ marginLeft: i === 0 ? 0 : -size * 0.35, zIndex: shown.length - i }}>
          <Avatar avatarKey={k} size={size} />
        </View>
      ))}
      {extra > 0 ? (
        <View style={[styles.extra, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={styles.extraText}>+{extra}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.bgDark,
  },
  stack: { flexDirection: 'row', alignItems: 'center' },
  extra: {
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  extraText: { ...typography.caption, color: colors.textSecondary },
});
