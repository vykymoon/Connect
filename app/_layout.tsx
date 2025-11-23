import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

// CORRECCIÓN AQUÍ: 
// AuthProvider va SIN llaves (porque ahora es default)
// useAuth va CON llaves (porque es export nombrado)
import AuthProvider, { useAuth } from '../src/providers/AuthProvider';

const InitialLayout = () => {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Usuario sin sesión intenta entrar a la app -> Login
      router.replace('/(auth)/welcome');
    } else if (session && inAuthGroup) {
      // Usuario con sesión intenta entrar a login -> Main
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

  return <Slot />;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}