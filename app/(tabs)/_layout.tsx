import { Tabs } from 'expo-router';
import { Home, Users, Trophy, User as UserIcon, Gamepad2 } from 'lucide-react-native';
import { colors, radii, shadows } from '@/theme';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;
  const barHeight = 54 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#171026',
          borderTopColor: 'rgba(255, 247, 240, 0.08)',
          borderTopWidth: 1,
          height: barHeight,
          paddingBottom: bottomInset > 0 ? bottomInset - 4 : 4,
          paddingTop: 6,
          elevation: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
        },
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarActiveTintColor: colors.purpleSoft,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabIconWrap : null}>
              <Home color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="oyna"
        options={{
          title: 'Oyna',
          tabBarActiveTintColor: colors.orange,
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.playButtonWrap,
                focused && styles.playButtonActive,
              ]}
            >
              <Gamepad2
                color={focused ? '#FFFFFF' : '#FFF7F0'}
                size={23}
                strokeWidth={2.4}
              />
            </View>
          ),
          tabBarLabelStyle: styles.playLabel,
        }}
      />
      <Tabs.Screen
        name="arkadaslar"
        options={{
          title: 'Arkadaşlar',
          tabBarActiveTintColor: colors.purpleSoft,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabIconWrap : null}>
              <Users color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="liderlik"
        options={{
          title: 'Liderlik',
          tabBarActiveTintColor: colors.yellow,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabIconWrap : null}>
              <Trophy color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarActiveTintColor: colors.lime,
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabIconWrap : null}>
              <UserIcon color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  item: {
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabIconWrap: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: radii.md,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    marginTop: 2,
  },
  playLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: colors.orange,
    marginTop: 2,
  },
  playButtonWrap: {
    width: 44,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#C2410C',
    borderWidth: 1,
    borderColor: '#FFA07A',
    ...shadows.glowOrange,
  },
  playButtonActive: {
    backgroundColor: '#FF5722',
    transform: [{ translateY: 1 }],
  },
});
