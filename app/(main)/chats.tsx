import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const dummyChats = [
  { id: '1', name: 'Soporte Técnico', message: 'Su ticket ha sido resuelto.', time: '10:00 AM', unread: 0 },
  { id: '2', name: 'Juan Perez', message: '¿Te parece bien a las 3?', time: 'Yesterday', unread: 2 },
  { id: '3', name: 'Maria Gomez', message: '¡Gracias por la ayuda!', time: 'Monday', unread: 0 },
  { id: '4', name: 'Equipo de Ventas', message: 'Nueva oferta disponible.', time: 'Monday', unread: 0 },
  { id: '5', name: 'Carlos Ruiz', message: 'Ya envié los documentos.', time: 'Last Week', unread: 0 },
  { id: '6', name: 'Ana Lopez', message: 'Ok, nos vemos.', time: 'Last Week', unread: 0 },
  { id: '7', name: 'Bot', message: 'Bienvenido a la app.', time: 'Last Month', unread: 0 },
];

export default function ChatsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Chats</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <FlatList
        data={dummyChats}
        keyExtractor={(item) => item.id}
        // AGREGAMOS PADDING BOTTOM 100
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chatItem}>
            <View style={styles.avatar}>
               <Text style={styles.avatarText}>{item.name[0]}</Text>
            </View>
            <View style={styles.chatInfo}>
              <View style={styles.row}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              <Text style={styles.message} numberOfLines={1}>{item.message}</Text>
            </View>
            {item.unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  backButton: { padding: 5, backgroundColor: '#F5F6FA', borderRadius: 10 },
  title: { fontSize: 20, fontWeight: 'bold' },
  chatItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E6EFFF', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  avatarText: { color: '#0047FF', fontWeight: 'bold', fontSize: 18 },
  chatInfo: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  name: { fontWeight: 'bold', fontSize: 16 },
  time: { color: '#999', fontSize: 12 },
  message: { color: '#666' },
  badge: { backgroundColor: '#0047FF', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
});