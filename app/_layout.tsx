import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={COLORS.dark} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopColor:  COLORS.border,
            borderTopWidth:  2,
            height:          64,
            paddingBottom:   8,
            paddingTop:      6,
          },
          tabBarActiveTintColor:   COLORS.dark,
          tabBarInactiveTintColor: '#9C8A4A',
          tabBarLabelStyle: {
            fontSize:      11,
            fontWeight:    '700',
            letterSpacing: 0.2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="form"
          options={{
            title: 'Baru',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Sejarah',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'time' : 'time-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="ticket"
          options={{
            title: 'Tiket',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={24} color={color} />
            ),
          }}
        />

        {/* Hide sub-routes from tab bar */}
        <Tabs.Screen name="history/[id]" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="ticket/[id]"  options={{ href: null, headerShown: false }} />
      </Tabs>
    </SafeAreaProvider>
  );
}