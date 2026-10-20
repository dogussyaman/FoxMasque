import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import {
  useFonts,
} from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { SplashScreen } from 'expo-router';
import { colors } from '@/theme';
import { ActivityIndicator, View } from 'react-native';
import { GameStoreProvider } from '@/store/gameStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgDarkest, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.purpleSoft} size="large" />
      </View>
    );
  }

  return (
    <GameStoreProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="create-room" />
        <Stack.Screen name="join-room" />
        <Stack.Screen name="category-select" />
        <Stack.Screen name="lobby" />
        <Stack.Screen name="ability-select" />
        <Stack.Screen name="question" />
        <Stack.Screen name="waiting" />
        <Stack.Screen name="result" />
        <Stack.Screen name="scoreboard" />
        <Stack.Screen name="game-over" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </GameStoreProvider>
  );
}
