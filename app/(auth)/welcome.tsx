import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Icono central simulando el planeta del diseño */}
      <View style={styles.iconContainer}>
        <Ionicons name="planet-outline" size={120} color="#0047FF" />
        {/* Anillo decorativo simple */}
        <View style={styles.ring} />
      </View>

      <Text style={styles.title}>Connect</Text>
      <Text style={styles.subtitle}>Level up your life, one habit{'\n'}at a time.</Text>

      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('/(auth)/sign-up')}
        >
          <Text style={styles.buttonText}>Let's get started</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.linkContainer} 
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.linkText}>I already have an account</Text>
          <View style={styles.circleButton}>
             <Ionicons name="arrow-forward" size={20} color="white" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 20 },
  iconContainer: { marginBottom: 40, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 160, height: 60, borderRadius: 100, borderWidth: 4, borderColor: '#0047FF', transform: [{ rotate: '-20deg' }], zIndex: -1, opacity: 0.2 },
  title: { fontSize: 40, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24, marginBottom: 50 },
  bottomContainer: { width: '100%', position: 'absolute', bottom: 50 },
  button: { backgroundColor: '#0047FF', padding: 18, borderRadius: 30, alignItems: 'center', marginBottom: 20 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '600' },
  linkContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  linkText: { color: '#666', fontSize: 14 },
  circleButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#0047FF', alignItems: 'center', justifyContent: 'center' },
});