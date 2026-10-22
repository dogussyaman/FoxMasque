import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { SoundPreference } from './soundPreference';

const HAPTICS_PREFERENCE_KEY = '@foxmasque/haptics-enabled';
type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const impactStyles: Record<'light' | 'medium' | 'heavy', Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

function reportError(operation: string, error: unknown) {
  if (__DEV__) console.warn(`[HapticsService] ${operation} failed.`, error);
}

class HapticsService {
  private readonly preference = new SoundPreference(
    AsyncStorage,
    HAPTICS_PREFERENCE_KEY,
    (operation, error) => reportError(operation, error)
  );

  public trigger(style: HapticStyle = 'light'): void {
    if (
      Platform.OS === 'web' ||
      !this.preference.isReady() ||
      !this.preference.isEnabled()
    ) return;

    const feedback = style === 'success' || style === 'warning' || style === 'error'
      ? Haptics.notificationAsync(
          style === 'success'
            ? Haptics.NotificationFeedbackType.Success
            : style === 'warning'
              ? Haptics.NotificationFeedbackType.Warning
              : Haptics.NotificationFeedbackType.Error
        )
      : Haptics.impactAsync(impactStyles[style]);
    void feedback.catch((error: unknown) => reportError('feedback', error));
  }

  public isEnabled(): boolean {
    return this.preference.isEnabled();
  }

  public isReady(): boolean {
    return this.preference.isReady();
  }

  public setEnabled(enabled: boolean): void {
    this.preference.setEnabled(enabled);
  }

  public subscribe(listener: (enabled: boolean) => void): () => void {
    return this.preference.subscribe(listener);
  }

  public subscribeReady(listener: () => void): () => void {
    return this.preference.subscribeReady(listener);
  }
}

export const hapticsService = new HapticsService();
