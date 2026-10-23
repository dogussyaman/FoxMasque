import React, { forwardRef, useState } from 'react';
import {
  TextInput,
  type TextInputProps,
  StyleSheet,
  Platform,
  type StyleProp,
  type TextStyle,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from 'react-native';
import { colors, radii, spacing, typography } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

export interface InputProps extends TextInputProps {
  focusedBorderColor?: string;
  variant?: 'card' | 'surface' | 'dark';
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      style,
      focusedBorderColor,
      variant = 'card',
      onFocus,
      onBlur,
      placeholderTextColor,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const { colors: themeColors } = useTheme();

    const handleFocus: NonNullable<TextInputProps['onFocus']> = (e) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur: NonNullable<TextInputProps['onBlur']> = (e) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const bgMap = {
      card: themeColors.bgCard,
      surface: themeColors.bgSurfaceAlt,
      dark: themeColors.bgDark,
    };

    return (
      <TextInput
        ref={ref}
        placeholderTextColor={placeholderTextColor ?? themeColors.textMuted}
        underlineColorAndroid="transparent"
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[
          styles.base,
          { backgroundColor: bgMap[variant], color: themeColors.textPrimary },
          style,
          isFocused && { borderColor: focusedBorderColor ?? themeColors.orange },
        ]}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 16,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : {}),
  },
});
