import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Favorites() {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="heart-outline" size={80} color="#0047FF" />
      </View>
      <Text style={styles.title}>Mis Favoritos</Text>
      <Text style={styles.subtitle}>Aquí aparecerán tus elementos guardados.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 20 },
  iconContainer: { backgroundColor: '#F5F6FA', padding: 30, borderRadius: 100, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
});