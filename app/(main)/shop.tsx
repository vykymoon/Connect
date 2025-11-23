import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Shop() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tienda</Text>
        <Ionicons name="cart-outline" size={28} color="#1A1A1A" />
      </View>
      
      <View style={styles.content}>
        <Ionicons name="bag-handle-outline" size={80} color="#0047FF" />
        <Text style={styles.emptyText}>Próximamente</Text>
        <Text style={styles.subtitle}>Estamos preparando las mejores ofertas.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1A1A1A' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginTop: 20 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 10 },
});