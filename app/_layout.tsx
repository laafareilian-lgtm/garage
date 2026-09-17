import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.primary,
          headerTitleStyle: { fontWeight: '700', color: Colors.text },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="nouvelle-entree"
          options={{ title: 'Nouvelle entrée', presentation: 'modal' }}
        />
        <Stack.Screen name="vehicule/[id]" options={{ title: 'Véhicule' }} />
        <Stack.Screen
          name="intervention/[id]"
          options={{ title: 'Intervention' }}
        />
        <Stack.Screen name="devis/[id]" options={{ title: 'Devis' }} />
        <Stack.Screen name="facture/[id]" options={{ title: 'Facture' }} />
        <Stack.Screen name="client/[id]" options={{ title: 'Client' }} />
      </Stack>
    </>
  );
}
