import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/providers/AuthProvider';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { session } = useAuth();
  
  const [username, setUsername] = useState('User');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const [stats, setStats] = useState({
    points: 500,
    todoCount: 12,
    hobbiesCount: 7,
    friendsCount: 5
  });

  // Fecha actual automática (ej: November 2025)
  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  useFocusEffect(
    useCallback(() => {
      if (session) getProfile();
    }, [session])
  );

  async function getProfile() {
    try {
      if (!session?.user) return;
      setEmail(session.user.email || '');

      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setUsername(data.username || 'User');
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- HEADER SUPERIOR --- */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          
          {/* BOTÓN SETTINGS (Igualado al del Home) */}
          <TouchableOpacity 
            style={styles.settingsButton} 
            onPress={() => router.push('/(main)/settings')}
          >
            {/* CAMBIO: Color cambiado a #0047FF (Azul) */}
            <Ionicons name="settings-outline" size={24} color="#0047FF" />
          </TouchableOpacity>
        </View>

        {/* --- TARJETA DE USUARIO --- */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={40} color="#ccc" />
              </View>
            )}
            <View style={styles.onlineBadge} />
          </View>
          <View>
            <Text style={styles.userName}>{username}</Text>
            <Text style={styles.userEmail}>{email}</Text>
          </View>
        </View>

        {/* --- ESTADÍSTICAS --- */}
        <View style={styles.monthSelectorContainer}>
          <View style={styles.monthPill}>
            <Text style={styles.monthText}>{dateLabel}</Text>
          </View>
        </View>

        <View style={styles.scoreContainer}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{stats.points || '--'}</Text>
            <Text style={styles.scoreLabel}>pts</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarWrapper}>
            <View style={[styles.progressSegment, { flex: 3, backgroundColor: '#FF9F0A' }]} />
            <View style={[styles.progressSegment, { flex: 2, backgroundColor: '#FF5790' }]} />
            <View style={[styles.progressSegment, { flex: 4, backgroundColor: '#A2E555' }]} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statCircle, { backgroundColor: '#0047FF' }]}>
              <Text style={styles.statNumber}>{stats.todoCount || '--'}</Text>
            </View>
            <Text style={styles.statLabel}>ToDo</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statCircle, { backgroundColor: '#0047FF' }]}>
              <Text style={styles.statNumber}>{stats.hobbiesCount || '--'}</Text>
            </View>
            <Text style={styles.statLabel}>Hobbies</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statCircle, { backgroundColor: '#0047FF' }]}>
              <Text style={styles.statNumber}>{stats.friendsCount || '--'}</Text>
            </View>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 120 }, 

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A' },
  
  // CAMBIO: Padding ajustado a 5 (antes 8) para ser idéntico al Home
  settingsButton: { padding: 5, backgroundColor: '#F5F6FA', borderRadius: 12 },

  userCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 40 },
  avatarContainer: { marginRight: 15 },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#fff' },
  avatarPlaceholder: { backgroundColor: '#F0F2F5', alignItems: 'center', justifyContent: 'center' },
  onlineBadge: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#A2E555', borderWidth: 2, borderColor: '#fff' },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  userEmail: { fontSize: 14, color: '#666' },

  monthSelectorContainer: { alignItems: 'center', marginBottom: 20 },
  monthPill: { backgroundColor: '#F5F6FA', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
  monthText: { color: '#0047FF', fontWeight: '600', fontSize: 14, textTransform: 'capitalize' },

  scoreContainer: { alignItems: 'center', marginBottom: 30 },
  scoreCircle: {
    width: 180, height: 180, borderRadius: 90, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5,
    borderWidth: 1, borderColor: '#FAFAFA'
  },
  scoreNumber: { fontSize: 42, fontWeight: 'bold', color: '#1A1A1A' },
  scoreLabel: { fontSize: 16, color: '#666', marginTop: -5 },

  progressContainer: { paddingHorizontal: 40, marginBottom: 40 },
  progressBarWrapper: { flexDirection: 'row', height: 18, borderRadius: 9, overflow: 'hidden', width: '100%' },
  progressSegment: { height: '100%' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-evenly', paddingHorizontal: 10 },
  statItem: { alignItems: 'center', gap: 10 },
  statCircle: {
    width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center',
    shadowColor: "#0047FF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4
  },
  statNumber: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
});