import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image, ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/providers/AuthProvider';

const { width } = Dimensions.get('window');

export default function UserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams(); 
  const { session } = useAuth();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>({});
  const [stats, setStats] = useState({ points: 0, todo: 0, hobbies: 0, friends: 0 });
  const [badges, setBadges] = useState<any[]>([]);
  const [completedHistory, setCompletedHistory] = useState<any[]>([]);
  const [mutualFriendsCount, setMutualFriendsCount] = useState(0);

  useEffect(() => {
    if (userId) {
      fetchFriendProfile();
    }
  }, [userId]);

  async function fetchFriendProfile() {
    try {
      setLoading(true);
      const targetId = Array.isArray(userId) ? userId[0] : userId;

      // 1. PERFIL
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single();
      
      if (profile) setUserData(profile);

      // 2. TAREAS
      const { data: tasks } = await supabase
        .from('user_tasks')
        .select(`status, created_at, habits_catalog (points, category, title, icon_name)`)
        .eq('user_id', targetId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      let points = 0, todo = 0, hobbies = 0;
      const history: any[] = [];

      if (tasks) {
        tasks.forEach((t: any) => {
          if (t.habits_catalog) {
             points += (t.habits_catalog.points || 0);
             todo++;
             if (['Health', 'Mindset', 'Hobbies'].includes(t.habits_catalog.category)) hobbies++;
             history.push(t);
          }
        });
      }
      setCompletedHistory(history);

      // 3. MEDALLAS
      const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badges_catalog (name, icon_name, color_hex)')
        .eq('user_id', targetId);
      setBadges(userBadges || []);

      // 4. AMIGOS EN COMÚN
      const { data: theirFriends } = await supabase.from('follows').select('following_id').eq('follower_id', targetId);
      const { data: myFriends } = await supabase.from('follows').select('following_id').eq('follower_id', session?.user.id);

      const theirIds = theirFriends?.map(f => f.following_id) || [];
      const myIds = myFriends?.map(f => f.following_id) || [];
      
      const mutuals = theirIds.filter(id => myIds.includes(id));
      setMutualFriendsCount(mutuals.length);

      setStats({ points, todo, hobbies, friends: theirIds.length });

    } catch (error) {
      console.log("Error fetching friend profile:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0047FF" />
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      
      <View style={styles.backgroundContainer} pointerEvents="none">
        <View style={[styles.bubble, styles.topMainBubble]} />
        <View style={[styles.bubble, { top: 250, left: -50, width: 200, height: 200, backgroundColor: '#0047FF', opacity: 0.05 }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header con Flecha Atrás */}
        <View style={styles.header}>
          {/* CAMBIO IMPORTANTE AQUÍ: Navegación explícita a Profile */}
          <TouchableOpacity 
            onPress={() => router.push('/(main)/profile')} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          
          <View style={styles.friendBadge}>
            <Ionicons name="people" size={14} color="#0047FF" />
            <Text style={styles.friendBadgeText}>Friend</Text>
          </View>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            {userData.avatar_url ? (
              <Image source={{ uri: userData.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={40} color="#ccc" />
              </View>
            )}
          </View>
          <View>
            <Text style={styles.userName}>{userData.username || 'User'}</Text>
            <Text style={styles.mutualText}>{mutualFriendsCount} Mutual Friends</Text>
          </View>
        </View>

        {/* Score */}
        <View style={styles.scoreContainer}>
          <View style={styles.scoreCircleOuterRing}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNumber}>{stats.points}</Text>
              <Text style={styles.scoreLabel}>total earned</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={styles.statCircle}>
              <Text style={styles.statNumber}>{stats.todo}</Text>
            </View>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statCircle}>
              <Text style={styles.statNumber}>{stats.hobbies}</Text>
            </View>
            <Text style={styles.statLabel}>Hobbies</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statCircle}>
              <Text style={styles.statNumber}>{stats.friends}</Text>
            </View>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
        </View>

        {/* Badges */}
        {badges.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medals</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {badges.map((b: any, i) => (
                <View key={i} style={styles.badgeItem}>
                  <View style={[styles.badgeIcon, { backgroundColor: b.badges_catalog.color_hex }]}>
                    <Ionicons name={b.badges_catalog.icon_name} size={24} color="#fff" />
                  </View>
                  <Text style={styles.badgeName} numberOfLines={1}>{b.badges_catalog.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Medals</Text>
                <Text style={{color: '#999', fontStyle: 'italic'}}>No medals yet.</Text>
            </View>
        )}

        {/* Completed History */}
        {completedHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {completedHistory.slice(0, 5).map((t: any, i) => (
              <View key={i} style={styles.historyItem}>
                <View style={[styles.historyIcon, { backgroundColor: '#E6FFFA' }]}>
                   <Ionicons name="checkmark-circle" size={20} color="#00B894" />
                </View>
                <View style={{flex: 1}}>
                   <Text style={styles.historyTitle}>{t.habits_catalog.title}</Text>
                   <Text style={styles.historyDate}>{formatDate(t.created_at)}</Text>
                </View>
                <Text style={{fontWeight:'bold', color:'#00B894'}}>+{t.habits_catalog.points}</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 40 },
  backgroundContainer: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
  bubble: { position: 'absolute', borderRadius: 999 },
  topMainBubble: { top: -150, right: -100, width: width * 1.2, height: width * 1.2, backgroundColor: '#E6EFFF', opacity: 0.8 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  backButton: { padding: 8, backgroundColor: '#F5F6FA', borderRadius: 12 },
  friendBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6EFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 5 },
  friendBadgeText: { color: '#0047FF', fontWeight: 'bold', fontSize: 12 },

  userCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 30, marginTop: 10 },
  avatarContainer: { marginRight: 15 },
  avatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: '#fff', shadowColor: "#0047FF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  avatarPlaceholder: { backgroundColor: '#F0F2F5', alignItems: 'center', justifyContent: 'center', width: 70, height: 70, borderRadius: 35 },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
  mutualText: { fontSize: 14, color: '#666', marginTop: 2 },

  scoreContainer: { alignItems: 'center', marginBottom: 35 },
  scoreCircleOuterRing: { padding: 10, borderRadius: 999, backgroundColor: 'rgba(0, 71, 255, 0.05)' },
  scoreCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: "#0047FF", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 12, borderWidth: 1, borderColor: '#F5F8FF' },
  scoreNumber: { fontSize: 42, fontWeight: '900', color: '#0047FF' },
  scoreLabel: { fontSize: 12, color: '#666', textTransform: 'uppercase' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 40 },
  statItem: { alignItems: 'center', gap: 8 },
  statCircle: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0047FF', shadowColor: "#0047FF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, elevation: 4 },
  statNumber: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#333' },

  section: { paddingHorizontal: 20, marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 15 },
  horizontalScroll: { paddingBottom: 10 },
  badgeItem: { alignItems: 'center', marginRight: 15, width: 70 },
  badgeIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, elevation: 4 },
  badgeName: { fontSize: 10, color: '#555', textAlign: 'center', fontWeight: '600' },

  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F6FA' },
  historyIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  historyTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  historyDate: { fontSize: 12, color: '#999' },
});