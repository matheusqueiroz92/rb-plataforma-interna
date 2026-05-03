import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProvedorQuery } from '@/lib/query-provider';
import { useAuthStore } from '@/lib/auth-store';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Protecao() {
  const router = useRouter();
  const segments = useSegments();
  const usuario = useAuthStore((s) => s.usuario);
  const token = useAuthStore((s) => s.accessToken);
  const hidratado = useAuthStore((s) => s.hidratado);

  useEffect(() => {
    if (!hidratado) return;
    SplashScreen.hideAsync().catch(() => {});

    const dentroDoAuth = segments[0] === '(auth)';
    const dentroTabs = segments[0] === '(tabs)';
    const temSessao = Boolean(token && usuario);

    if (!temSessao && !dentroDoAuth) {
      router.replace('/(auth)/login');
      return;
    }
    const rotaFilha = segments.at(1);
    if (temSessao && usuario?.precisaAceitarPop && rotaFilha !== 'aceite-pop') {
      router.replace('/(auth)/aceite-pop');
      return;
    }
    if (temSessao && !usuario?.precisaAceitarPop && !dentroTabs) {
      router.replace('/(tabs)/inicio');
    }
  }, [hidratado, token, usuario, segments, router]);

  return null;
}

export default function LayoutRaiz() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProvedorQuery>
          <Protecao />
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </ProvedorQuery>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
