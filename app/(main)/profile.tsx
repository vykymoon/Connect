import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  
  const [myBadges, setMyBadges] = useState<any[]>([]);
  
  // Estado para el desglose de categorías
  const [hobbiesBreakdown, setHobbiesBreakdown] = useState<Record<string, number>>({});
  const [hobbiesModalVisible, setHobbiesModalVisible] = useState(false);

  const [stats, setStats] = useState({
    points: 0, 
    todoCount: 0,
    hobbiesCount: 0,
    completedToday: 0 
  });

  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  useFocusEffect(
    useCallback(() => {
      if (session) {
        getProfile();
        getStats();
      }
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

  async function getStats() {
    try {
      if (!session?.user) return;

      const { data: tasksData } = await supabase
        .from('user_tasks')
        .select(`
          status,
          created_at,
          habits_catalog (points, category)
        `)
        .eq('user_id', session.user.id)
        .eq('status', 'completed');

      let totalEarned = 0;
      let totalCompleted = 0;
      let totalHobbies = 0;
      let todayCount = 0;
      const todayString = new Date().toLocaleDateString();
      
      // Objeto temporal para contar categorías
      const breakdown: Record<string, number> = {
        Health: 0,
        Study: 0,
        Mindset: 0,
        Productivity: 0
      };

      if (tasksData) {
        tasksData.forEach((item: any) => {
          const habit = item.habits_catalog;
          const itemDate = new Date(item.created_at).toLocaleDateString();
          
          if (itemDate === todayString) todayCount += 1;

          if (habit) {
            totalEarned += (habit.points || 0);
            totalCompleted += 1;
            
            // Sumar al desglose si la categoría existe
            if (breakdown[habit.category] !== undefined) {
              breakdown[habit.category] += 1;
              totalHobbies += 1; // Hobbies cuenta todas estas categorías
            }
          }
        });
      }

      setHobbiesBreakdown(breakdown); // Guardamos el desglose

      const { data: badgesData } = await supabase
        .from('user_badges')
        .select('id, badges_catalog (name, icon_name, color_hex, price)')
        .eq('user_id', session.user.id);

      let totalSpent = 0;
      if (badgesData) {
        setMyBadges(badgesData); 
        badgesData.forEach((item: any) => {
          totalSpent += (item.badges_catalog?.price || 0);
        });
      }

      setStats({
        points: totalEarned - totalSpent,
        todoCount: totalCompleted,
        hobbiesCount: totalHobbies,
        completedToday: todayCount
      });

    } catch (error) {
      console.log('Error calculating stats:', error);
    }
  }

  const dailyGoal = 3;
  const progressPercent = Math.min((stats.completedToday / dailyGoal) * 100, 100);
  const isGoalMet = stats.completedToday >= dailyGoal;

  const getProgressColor = (count: number) => {
    if (count <= 0) return 'transparent';
    if (count === 1) return '#FF885B';
    if (count === 2) return '#9F44D3';
    return '#0047FF';
  };
  const currentColor = getProgressColor(stats.completedToday);

  // Helper para iconos y colores de categoría en el modal
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Health': return { icon: 'heart-outline', color: '#28C76F' };
      case 'Study': return { icon: 'book-outline', color: '#0047FF' };
      case 'Mindset': return { icon: 'leaf-outline', color: '#7367F0' };
      case 'Productivity': return { icon: 'flash-outline', color: '#FF9F43' };
      default: return { icon: 'apps-outline', color: '#666' };
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      
      <View style={styles.backgroundContainer} pointerEvents="none">
        <View style={[styles.bubble, styles.topMainBubble]} />
        <View style={[styles.bubble, { top: -80, right: -60, width: 180, height: 180, backgroundColor: '#00C6FF', opacity: 0.15 }]} />
        <View style={[styles.bubble, { top: 250, left: width / 2 - 100, width: 200, height: 200, backgroundColor: '#0047FF', opacity: 0.08 }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/(main)/settings')}>
            <Ionicons name="settings-outline" size={24} color="#0047FF" />
          </TouchableOpacity>
        </View>

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
          <View style={{flex: 1}}>
            <Text style={styles.userName} numberOfLines={1}>{username}</Text>
            <Text style={styles.userEmail} numberOfLines={1}>{email}</Text>
          </View>
        </View>

        <View style={styles.monthSelectorContainer}>
          <View style={styles.monthPill}>
            <Text style={styles.monthText}>{dateLabel}</Text>
          </View>
        </View>

        <View style={styles.scoreContainer}>
          <View style={[styles.scoreCircleOuterRing, isGoalMet && styles.glowingRing]}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNumber}>
                {stats.points > 0 ? stats.points : '--'}
              </Text>
              <Text style={styles.scoreLabel}>available pts</Text>
            </View>
          </View>

          {myBadges.length > 0 && (
            <View style={styles.badgeCounterBubble}>
              <Ionicons name="medal" size={14} color="#fff" />
              <Text style={styles.badgeCounterText}>{myBadges.length}</Text>
            </View>
          )}
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressLabelContainer}>
            <Text style={styles.progressTitle}>Daily Goal</Text>
            <Text style={[styles.progressCount, { color: currentColor || '#666' }]}>
              {stats.completedToday} / {dailyGoal}
            </Text>
          </View>

          <View style={[styles.progressBarBackground, isGoalMet && styles.glowingBarContainer]}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: currentColor }]} />
          </View>
          
          <Text style={styles.progressMessage}>
            {stats.completedToday === 0 && "Start your first habit!"}
            {stats.completedToday === 1 && "Good start! Keep going."}
            {stats.completedToday === 2 && "Almost there!"}
            {stats.completedToday >= 3 && "Goal reached! You're on fire! 🔥"}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={styles.statCircle}>
              <Text style={styles.statNumber}>
                {stats.todoCount > 0 ? stats.todoCount : '--'}
              </Text>
            </View>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          {/* BOTÓN DE HOBBIES CON MODAL */}
          <TouchableOpacity 
            style={styles.statItem} 
            onPress={() => setHobbiesModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.statCircle}>
              <Text style={styles.statNumber}>
                {stats.hobbiesCount > 0 ? stats.hobbiesCount : '--'}
              </Text>
            </View>
            <Text style={styles.statLabel}>Hobbies</Text>
          </TouchableOpacity>

          <View style={styles.statItem}>
            <View style={[styles.statCircle, styles.statCircleInactive]}>
              <Text style={[styles.statNumber, styles.statNumberInactive]}>--</Text>
            </View>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
        </View>

        {myBadges.length > 0 && (
          <View style={styles.collectionSection}>
            <Text style={styles.collectionTitle}>My Collection</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
              {myBadges.map((item: any, index) => (
                <View key={index} style={styles.badgeItem}>
                  <View style={[styles.badgeIcon, { backgroundColor: item.badges_catalog.color_hex }]}>
                    <Ionicons name={item.badges_catalog.icon_name} size={24} color="#fff" />
                  </View>
                  <Text style={styles.badgeName} numberOfLines={1}>{item.badges_catalog.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

      </ScrollView>

      {/* --- MODAL DE DESGLOSE DE HOBBIES --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={hobbiesModalVisible}
        onRequestClose={() => setHobbiesModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setHobbiesModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Habits Breakdown</Text>
            <Text style={styles.modalSubtitle}>Completed tasks by category</Text>
            
            <View style={styles.breakdownContainer}>
              {Object.entries(hobbiesBreakdown).map(([category, count]) => {
                const { icon, color } = getCategoryIcon(category);
                return (
                  <View key={category} style={styles.breakdownRow}>
                    <View style={[styles.categoryIcon, { backgroundColor: color + '20' }]}>
                      <Ionicons name={icon as any} size={20} color={color} />
                    </View>
                    <Text style={styles.categoryName}>{category}</Text>
                    <Text style={styles.categoryCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 120 },

  backgroundContainer: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
  bubble: { position: 'absolute', borderRadius: 999 },
  topMainBubble: {
    top: -150, left: -100, width: width * 1.2, height: width * 1.2,
    backgroundColor: '#E6EFFF', opacity: 0.8, 
  },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20 },
  headerTitle: { fontSize: 34, fontWeight: '800', color: '#1A1A1A' },
  settingsButton: { padding: 5, backgroundColor: '#fff', borderRadius: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },

  userCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 40 },
  avatarContainer: { marginRight: 20, position: 'relative' },
  avatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: '#fff', shadowColor: "#0047FF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  avatarPlaceholder: { backgroundColor: '#F0F2F5', alignItems: 'center', justifyContent: 'center', width: 70, height: 70, borderRadius: 35 },
  onlineBadge: { position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#28C76F', borderWidth: 2, borderColor: '#fff' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#666', opacity: 0.8 },

  monthSelectorContainer: { alignItems: 'center', marginBottom: 25 },
  monthPill: { backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#F0F2F5' },
  monthText: { color: '#0047FF', fontWeight: '700', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 },

  scoreContainer: { alignItems: 'center', marginBottom: 35, position: 'relative' },
  scoreCircleOuterRing: { padding: 10, borderRadius: 999, backgroundColor: 'rgba(0, 71, 255, 0.05)' },
  glowingRing: { backgroundColor: 'rgba(0, 71, 255, 0.15)', shadowColor: "#0047FF", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 25 },
  scoreCircle: {
    width: 170, height: 170, borderRadius: 85, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: "#0047FF", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 12,
    borderWidth: 1, borderColor: '#F5F8FF'
  },
  scoreNumber: { fontSize: 56, fontWeight: '900', color: '#0047FF', letterSpacing: -1 },
  scoreLabel: { fontSize: 14, color: '#666', marginTop: -5, fontWeight: '600', textTransform: 'uppercase' },

  badgeCounterBubble: {
    position: 'absolute', top: 10, right: width / 2 - 75, backgroundColor: '#FF9F0A', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 5, zIndex: 10, borderWidth: 2, borderColor: '#fff'
  },
  badgeCounterText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  progressContainer: { paddingHorizontal: 40, marginBottom: 45 },
  progressLabelContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressTitle: { fontSize: 12, fontWeight: '700', color: '#666', textTransform: 'uppercase' },
  progressCount: { fontSize: 12, fontWeight: '700' },
  progressBarBackground: { height: 16, borderRadius: 8, backgroundColor: '#F0F2F5', overflow: 'hidden', width: '100%', borderWidth: 1, borderColor: '#F0F2F5' },
  progressBarFill: { height: '100%', borderRadius: 8 },
  glowingBarContainer: { shadowColor: "#0047FF", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5, borderColor: '#fff' },
  progressMessage: { textAlign: 'center', marginTop: 8, color: '#666', fontSize: 12, fontStyle: 'italic' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-evenly', paddingHorizontal: 20 },
  statItem: { alignItems: 'center', gap: 12 },
  statCircle: { width: 65, height: 65, borderRadius: 32.5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0047FF', shadowColor: "#0047FF", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  statCircleInactive: { backgroundColor: '#F0F2F5', shadowOpacity: 0.1, elevation: 2 },
  statNumber: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  statNumberInactive: { color: '#999' },
  statLabel: { fontSize: 13, fontWeight: '600', color: '#333' },

  collectionSection: { marginTop: 40, paddingHorizontal: 20 },
  collectionTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 15 },
  badgesScroll: { paddingBottom: 20 },
  badgeItem: { alignItems: 'center', marginRight: 15, width: 75 },
  badgeIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, elevation: 4 },
  badgeName: { fontSize: 11, color: '#555', textAlign: 'center', fontWeight: '600', lineHeight: 14 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: width * 0.85, backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 5, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  breakdownContainer: { gap: 15 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F6FA' },
  categoryIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  categoryName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#333' },
  categoryCount: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
});