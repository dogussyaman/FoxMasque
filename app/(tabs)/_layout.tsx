import { Tabs } from 'expo-router';
import { LiquidGlassTabBar } from '@/components/navigation/LiquidGlassTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <LiquidGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
        }}
      />
      <Tabs.Screen
        name="oyna"
        options={{
          title: 'Oyna',
        }}
      />
      <Tabs.Screen
        name="arkadaslar"
        options={{
          title: 'Arkadaşlar',
        }}
      />
      <Tabs.Screen
        name="liderlik"
        options={{
          title: 'Liderlik',
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
        }}
      />
    </Tabs>
  );
}
