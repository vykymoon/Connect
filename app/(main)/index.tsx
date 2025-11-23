import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/providers/AuthProvider';

export default function Home() {
  const { session } = useAuth();
  const [username, setUsername] = useState('User'); 
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const router = useRouter();

  // Usamos useFocusEffect para recargar el perfil si cambias la foto en Settings y vuelves
  useFocusEffect(
    React.useCallback(() => {
      if (session) getProfile();
    }, [session])
  );

  async function getProfile() {
    try {
      if (!session?.user) return;

      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (data) {
        if (data.username) setUsername(data.username);
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.log('Error cargando perfil:', error);
    }
  }

  // Funciones de navegación
  const goToTasks = () => router.push('/(main)/shop'); 
  const goToFavorites = () => router.push('/(main)/favorites');

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* --- HEADER --- */}
        <View style={styles.headerTopRow}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
          </View>
          
          <TouchableOpacity style={styles.myActivityButton}>
            <Text style={styles.myActivityText}>My Activity</Text>
          </TouchableOpacity>

          <View style={styles.headerIconsContainer}>
            <TouchableOpacity style={styles.iconButton}>
                <MaterialCommunityIcons name="sticker-emoji" size={24} color="#0047FF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="options-outline" size={24} color="#0047FF" />
            </TouchableOpacity>
            
            {/* BOTÓN SETTINGS CONECTADO */}
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => router.push('/(main)/settings')}
            >
                <Ionicons name="settings-outline" size={24} color="#0047FF" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.greetingText}>Hello, {username}!</Text>

        {/* --- AI ASSISTANT --- */}
        <View style={styles.aiBanner}>
          <View style={styles.aiTextContainer}>
            <Text style={styles.aiTitle}>AI Assistant</Text>
            {/* TEXTO ACTUALIZADO */}
            <Text style={styles.aiDescription}>
              Our AI assistant is designed to provide you with immediate and efficient support at any time.
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.aiArrowButton}
            onPress={() => router.push('/(main)/ai-chat')}
          >
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* --- RECENTLY VIEWED --- */}
        <Text style={styles.sectionTitle}>Recently viewed</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {[1, 2, 3, 4, 5].map((item) => (
            <View key={item} style={styles.recentCircleShadow}>
                <View style={styles.recentCircleContent} />
            </View>
          ))}
        </ScrollView>

        {/* --- TODO --- */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.sectionTitle}>ToDo</Text>
          <TouchableOpacity onPress={goToTasks}>
            <Text style={{ color: '#0047FF', fontWeight: '600' }}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.todoContainer}>
          <TouchableOpacity style={styles.todoPill} onPress={goToTasks}>
            <Text style={styles.todoText}>Task</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.todoPill} onPress={goToTasks}>
            <Text style={styles.todoText}>Drink Water</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.todoPill} onPress={goToTasks}>
            <Text style={styles.todoText}>To eat</Text>
          </TouchableOpacity>
        </View>

        {/* --- REELS --- */}
        <Text style={styles.sectionTitle}>Reels</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {[1, 2, 3].map((item) => (
            <TouchableOpacity 
              key={item} 
              style={styles.reelPlaceholder} 
              onPress={goToFavorites}
              activeOpacity={0.8}
            />
          ))}
        </ScrollView>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 150 },
  
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  
  avatarContainer: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  avatarPlaceholder: { width: '100%', height: '100%', backgroundColor: '#F0F2F5' },
  avatarImage: { width: '100%', height: '100%' },

  myActivityButton: { backgroundColor: '#0047FF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25 },
  myActivityText: { color: '#fff', fontWeight: '600' },
  headerIconsContainer: { flexDirection: 'row', gap: 15 },
  iconButton: { padding: 5, backgroundColor: '#F5F6FA', borderRadius: 12 },
  
  greetingText: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 25 },
  
  aiBanner: { backgroundColor: '#F5F6FA', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  aiTextContainer: { flex: 1, paddingRight: 20 },
  aiTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 5 },
  aiDescription: { fontSize: 12, color: '#666', lineHeight: 18 }, // LineHeight para mejor lectura
  aiArrowButton: { width: 40, height: 40, backgroundColor: '#0047FF', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 15 },
  horizontalScroll: { marginBottom: 30, marginHorizontal: -20, paddingHorizontal: 20 },
  recentCircleShadow: { marginRight: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3, borderRadius: 35 },
  recentCircleContent: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff' },
  
  todoContainer: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  todoPill: { backgroundColor: '#F0F2F5', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  todoText: { color: '#0047FF', fontWeight: '500' },
  
  reelPlaceholder: { width: 120, height: 180, backgroundColor: '#D9D9D9', borderRadius: 15, marginRight: 15 },
});