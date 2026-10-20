import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme';
import type { CategoryId } from '@/features/game/categories';

interface CategoryChipProps {
  id: CategoryId;
  name: string;
  emoji: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export function CategoryChip({ name, emoji, selected, onPress, disabled }: CategoryChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.purpleGlow : colors.bgSurfaceAlt,
          borderColor: selected ? colors.purpleSoft : colors.border,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.label, { color: selected ? colors.purpleSoft : colors.textPrimary }]}>
        {name}
      </Text>
      {selected ? <Text style={styles.check}>✓</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1.5,
  },
  emoji: { fontSize: 20, marginRight: spacing.sm },
  label: { ...typography.bodyMedium, flex: 1 },
  check: { color: colors.purpleSoft, fontSize: 18, fontWeight: 'bold' },
});

void View;
