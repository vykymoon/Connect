import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AuthProvider, { useAuth } from '../src/providers/AuthProvider';

// ... (Tu componente InitialLayout se queda IGUAL) ...
const InitialLayout = () => {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (session && inAuthGroup) {
      router.replace('/(main)');
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // CAMBIO IMPORTANTE AQUÍ: Usamos Stack en lugar de Slot para manejar el modal
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Tus grupos de rutas normales */}
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(main)" />
      
      {/* La Pantalla de Cámara como MODAL */}
      <Stack.Screen 
        name="camera" 
        options={{ 
          presentation: 'modal', // Esto hace la magia visual
          animation: 'slide_from_bottom',
          headerShown: false 
        }} 
      />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}