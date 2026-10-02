import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Silkscreen_400Regular,
  Silkscreen_700Bold,
} from '@expo-google-fonts/silkscreen';
import { DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppAlertHost } from '@/src/components/ui/AppAlert';
import { PixelSprite } from '@/src/components/ui/PixelSprite';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { configureNotificationHandler } from '@/src/features/notifications/notificationService';
import { colors } from '@/src/theme';

void SplashScreen.preventAutoHideAsync();
configureNotificationHandler();

export const unstable_settings = {
  anchor: '(tabs)',
};

const NAVIGATION_THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.paper,
    card: colors.paper,
    text: colors.ink,
    border: colors.ink,
    primary: colors.pink,
  },
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      router.replace('/auth/login');
      return;
    }

    if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, router]);

  // Giriş yapmış kullanıcı ana ekrandayken Android donanım "geri" tuşu
  // alttaki eski auth stack girdisine düşmek yerine uygulamadan çıkar.
  useEffect(() => {
    if (loading || !user || segments[0] !== '(tabs)') {
      return;
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        BackHandler.exitApp();
        return true;
      },
    );

    return () => subscription.remove();
  }, [loading, user, segments]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <PixelSprite name="pixo" cell={9} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    Silkscreen_400Regular,
    Silkscreen_700Bold,
  });

  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  // Yazı tipleri yüklenene kadar splash ekranı görünür kalır.
  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider value={NAVIGATION_THEME}>
          <AuthGate>
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: colors.paper },
                headerShown: false,
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="auth" />
            </Stack>
          </AuthGate>

          <AppAlertHost />

          <StatusBar style="dark" />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  loading: {
    flex: 1,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
