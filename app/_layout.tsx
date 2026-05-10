import { Tabs, useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { COLORS } from '../constants/theme';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';

// This component handles the redirect logic.
// It watches the auth state and the current route segment,
// and pushes to /login whenever the user is not authenticated.
// It also pushes to / whenever an authenticated user tries
// to navigate to /login — preventing the back button from
// returning to the login screen after a successful login.
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const segments = useSegments();
  const router   = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait until we've checked SecureStore

    const inLoginScreen = segments[0] === 'login';

    if (!isLoggedIn && !inLoginScreen) {
      // User is not logged in — send them to login
      router.replace('/login');
    } else if (isLoggedIn && inLoginScreen) {
      // User is already logged in — send them to home
      router.replace('/');
    }
  }, [isLoggedIn, isLoading, segments]);

  return <>{children}</>;
}

function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 58 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor:  COLORS.border,
          borderTopWidth:  2,
          height:          tabBarHeight,
          paddingBottom:   insets.bottom > 0 ? insets.bottom : 10,
          paddingTop:      6,
          elevation:       8,
          shadowColor:     '#000',
          shadowOffset:    { width: 0, height: -2 },
          shadowOpacity:   0.06,
          shadowRadius:    4,
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
      <Tabs.Screen name="login"        options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="history/[id]" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="ticket/[id]"  options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={COLORS.dark} />
      <AuthProvider>
        <AuthGuard>
          <TabLayout />
        </AuthGuard>
      </AuthProvider>
    </SafeAreaProvider>
  );
}