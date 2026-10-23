import { Modal, StyleSheet, Text, View, Pressable } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme';
import type { ReactNode } from 'react';
import { X } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface ModalSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function ModalSheet({ visible, onClose, title, children, footer }: ModalSheetProps) {
  const { colors: themeColors } = useTheme();
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={[styles.backdrop, { backgroundColor: themeColors.overlay }]} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: themeColors.bgSurface, borderColor: themeColors.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.textPrimary }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X color={themeColors.textSecondary} size={22} />
            </Pressable>
          </View>
          <View style={styles.body}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: radii['2xl'],
    borderTopRightRadius: radii['2xl'],
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
    borderColor: colors.border,
    borderTopWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: { ...typography.h3, color: colors.textPrimary },
  body: {},
  footer: { marginTop: spacing.xl },
});
