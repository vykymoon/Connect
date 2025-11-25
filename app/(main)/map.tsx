import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      {/* Aquí integraremos el mapa más adelante */}
      <View style={styles.placeholderMap}>
        <Ionicons name="map-outline" size={60} color="#ccc" />
        <Text style={styles.mapText}>Cargando mapa...</Text>
      </View>
      
      <View style={styles.overlay}>
        <Text style={styles.title}>Explorar</Text>
        <Text style={styles.subtitle}>Encuentra lugares cerca de ti.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  placeholderMap: { flex: 1, backgroundColor: '#F0F2F5', justifyContent: 'center', alignItems: 'center' },
  mapText: { marginTop: 10, color: '#999', fontSize: 16 },
  overlay: { position: 'absolute', bottom: 50, left: 20, right: 20, backgroundColor: 'white', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 5 },
});