import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { AppAlertHost } from '@/src/components/ui/AppAlert';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
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

  // Kullanıcı giriş yaptıktan sonra login/register ekranına donanım
  // "geri" tuşuyla dönebilmemesi gerekiyor. Yukarıdaki router.replace
  // çoğu durumda auth stack'ini geçmişten temizliyor, ama Android'de
  // "geri" tuşu bazen alttaki eski stack girdisine erişebiliyor. Bu
  // yüzden, kimliği doğrulanmış kullanıcı ana (tabs) ekranındayken
  // donanım geri tuşunu burada yakalayıp login'e düşmek yerine
  // uygulamadan çıkıyoruz — Android'de ana ekranda "geri"ye basmanın
  // standart, beklenen davranışı zaten budur.
  useEffect(() => {
    if (loading || !user) {
      return;
    }

    const isAtAuthenticatedRoot = segments[0] === '(tabs)';

    if (!isAtAuthenticatedRoot) {
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
      <View style={styles.loadingContainer}>
        <View style={styles.loadingLogo}>
          <View style={styles.loadingPixel} />
          <View style={styles.loadingPixel} />
          <View style={styles.loadingPixel} />
          <View style={styles.loadingPixel} />
        </View>

        <ActivityIndicator
          size="small"
          color="#FF2A85"
          style={styles.loadingIndicator}
        />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
 
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider value={DarkTheme}>
          <AuthGate>
            <Stack
              screenOptions={{
                contentStyle: {
                  backgroundColor: '#0A0714',
                },
                headerShown: false,
              }}
            >
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="auth"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="modal"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                }}
              />
            </Stack>
          </AuthGate>

          <AppAlertHost />

          <StatusBar
            style="light"
            translucent
            backgroundColor="transparent"
          />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0714',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingLogo: {
    width: 52,
    height: 52,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    padding: 4,
    marginBottom: 20,
  },

  loadingPixel: {
    width: 20,
    height: 20,
    backgroundColor: '#FF2A85',
  },

  loadingIndicator: {
    marginTop: 4,
  },
});
