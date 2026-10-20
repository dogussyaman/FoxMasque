import { Tabs } from 'expo-router';
import { Home, Users, Trophy, User as UserIcon } from 'lucide-react-native';
import { colors } from '@/theme';
import { StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.bar,
        tabBarActiveTintColor: colors.purpleSoft,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.label,
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
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
  },
});
