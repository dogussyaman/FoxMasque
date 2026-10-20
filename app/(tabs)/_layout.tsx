import { Tabs } from 'expo-router';
import { Home, Users, Trophy, User as UserIcon, Gamepad2 } from 'lucide-react-native';
import { colors } from '@/theme';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);
  const barHeight = 58 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.bar, { height: barHeight, paddingBottom: bottomInset }],
        tabBarActiveTintColor: colors.purpleSoft,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="oyna"
        options={{
          title: 'Oyna',
          tabBarIcon: ({ color }) => <Gamepad2 color={color} size={25} strokeWidth={2.4} />,
          tabBarLabelStyle: styles.playLabel,
        }}
      />
      <Tabs.Screen
        name="arkadaslar"
        options={{
          title: 'Arkadaşlar',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="liderlik"
        options={{
          title: 'Liderlik',
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.bgDark,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 68,
    paddingBottom: 9,
    paddingTop: 8,
    elevation: 12,
  },
  item: { paddingVertical: 1 },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
  },
  playLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 10,
  },
});
