import { Tabs } from 'expo-router';
import { AppProvider, useApp } from '@/context/AppContext';
import { Colors } from '@/constants/theme';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { LANGUAGES, Lang } from '@/constants/i18n';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

function TabLayout() {
  const { t, lang, setLang } = useApp();

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.langBar}>
        {LANGUAGES.map((l) => (
          <TouchableOpacity
            key={l.key}
            onPress={() => setLang(l.key as Lang)}
            style={[styles.langBtn, lang === l.key && styles.langBtnActive]}
          >
            <Text style={[styles.langText, lang === l.key && styles.langTextActive]}>
              {l.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primaryLight,
          tabBarInactiveTintColor: Colors.textLight,
          tabBarStyle: {
            backgroundColor: Colors.primaryDark,
            borderTopWidth: 0,
            height: 62,
            paddingBottom: 8,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          headerStyle: { backgroundColor: Colors.primaryDark },
          headerTintColor: Colors.white,
          headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('home'),
            headerTitle: t('appName'),
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size - 4, color }}>🗺️</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="plan"
          options={{
            title: t('plan'),
            headerTitle: t('landPlanning'),
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size - 4 }}>🌱</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="water"
          options={{
            title: t('water'),
            headerTitle: t('waterCalc'),
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size - 4 }}>💧</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="weather"
          options={{
            title: t('weather'),
            headerTitle: t('weather'),
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size - 4 }}>🌤️</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: t('bookings'),
            headerTitle: t('nurseryLocator'),
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size - 4 }}>🛒</Text>
            ),
          }}
        />
      </Tabs>
    </>
  );
}

export default function RootTabsLayout() {
  return (
    <AppProvider>
      <TabLayout />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  langBar: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryDark,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 6,
    gap: 6,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  langBtnActive: {
    backgroundColor: Colors.accent,
  },
  langText: {
    color: Colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  langTextActive: {
    color: Colors.primaryDark,
  },
});
