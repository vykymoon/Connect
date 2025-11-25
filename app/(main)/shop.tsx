import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/providers/AuthProvider';

const { width } = Dimensions.get('window');

// --- TIPOS ---
type Habit = {
  id: number;
  title: string;
  category: string;
  points: number;
  icon_name: any;
};

type UserTask = {
  id: string;
  habit_id: number;
  status: string;
  created_at: string;
  habits_catalog: Habit;
};

// Tipo nuevo para Medallas
type Badge = { 
  id: number; 
  name: string; 
  description: string; 
  price: number; 
  rarity: string; 
  icon_name: any; 
  color_hex: string; 
};

export default function ShopScreen() {
  const { session } = useAuth();
  
  // Estados de Hábitos
  const [recommendations, setRecommendations] = useState<Habit[]>([]);
  const [myHabits, setMyHabits] = useState<UserTask[]>([]);
  const [completedHabits, setCompletedHabits] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  
  // Estados de Modals
  const [habitsModalVisible, setHabitsModalVisible] = useState(false); // Modal "See All"
  const [badgesModalVisible, setBadgesModalVisible] = useState(false); // Modal Medallas

  // Estados de Gamificación (Puntos y Medallas)
  const [badgesCatalog, setBadgesCatalog] = useState<Badge[]>([]);
  const [myBadges, setMyBadges] = useState<number[]>([]);
  const [currentPoints, setCurrentPoints] = useState(0);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [session])
  );

  async function fetchData() {
    try {
      if (!session?.user) return;

      // 1. TAREAS DEL USUARIO
      const { data: allUserTasks } = await supabase
        .from('user_tasks')
        .select('id, habit_id, status, created_at, habits_catalog (id, title, category, points, icon_name)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      const tasks = (allUserTasks as any[]) || [];
      setMyHabits(tasks.filter(t => t.status === 'pending'));
      setCompletedHabits(tasks.filter(t => t.status === 'completed'));

      // 2. CALCULAR PUNTOS (Ganados - Gastados)
      let totalEarned = 0;
      tasks.filter(t => t.status === 'completed').forEach(t => {
        totalEarned += (t.habits_catalog?.points || 0);
      });

      // 3. OBTENER MEDALLAS COMPRADAS Y GASTO
      const { data: userBadgesData } = await supabase
        .from('user_badges')
        .select('badge_id, badges_catalog (price)')
        .eq('user_id', session.user.id);

      let totalSpent = 0;
      const ownedIds: number[] = [];
      
      if (userBadgesData) {
        userBadgesData.forEach((item: any) => {
          ownedIds.push(item.badge_id);
          totalSpent += (item.badges_catalog?.price || 0);
        });
      }
      setMyBadges(ownedIds);
      setCurrentPoints(totalEarned - totalSpent);

      // 4. CATÁLOGO DE HÁBITOS
      const { data: catalogData } = await supabase
        .from('habits_catalog')
        .select('*')
        .order('points', { ascending: false });

      if (catalogData) {
        const availableHabits = catalogData.filter(habit => {
          const isAlreadyTaken = tasks.some(t => t.habit_id === habit.id);
          return !isAlreadyTaken; 
        });
        setRecommendations(availableHabits);
      }

      // 5. CATÁLOGO DE MEDALLAS
      const { data: badgesData } = await supabase
        .from('badges_catalog')
        .select('*')
        .order('price', { ascending: true });
      
      if (badgesData) setBadgesCatalog(badgesData);

    } catch (error) {
      console.log('Error data:', error);
    } finally {
      setLoading(false);
    }
  }

  // --- LÓGICA HÁBITOS ---
  async function addHabitToUser(habitId: number, habitTitle: string) {
    if (!session?.user) return;
    setAddingId(habitId);

    try {
      const { error } = await supabase
        .from('user_tasks')
        .insert({ user_id: session.user.id, habit_id: habitId, status: 'pending' });

      if (error) throw error;
      fetchData(); 
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setAddingId(null);
    }
  }

  const handleLongPress = (task: UserTask) => {
    Alert.alert(
      task.habits_catalog.title,
      'Choose an action:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Drop Habit', style: 'destructive', onPress: () => dropHabit(task) },
        { text: 'Mark as Completed', onPress: () => completeHabit(task) },
      ]
    );
  };

  async function completeHabit(task: UserTask) {
    const updatedTask = { ...task, status: 'completed', created_at: new Date().toISOString() };
    setMyHabits(prev => prev.filter(h => h.id !== task.id)); 
    setCompletedHabits(prev => [updatedTask, ...prev]); 

    try {
      const { error } = await supabase
        .from('user_tasks')
        .update({ status: 'completed', created_at: new Date().toISOString() })
        .eq('id', task.id);
      if (error) throw error;
      fetchData(); // Recargar para actualizar puntos
    } catch (error) {
      console.log(error);
      fetchData(); 
    }
  }

  async function dropHabit(task: UserTask) {
    setMyHabits(prev => prev.filter(h => h.id !== task.id)); 
    setRecommendations(prev => {
      const exists = prev.find(h => h.id === task.habits_catalog.id);
      if (exists) return prev;
      return [task.habits_catalog, ...prev];
    });

    try {
      const { error } = await supabase
        .from('user_tasks')
        .delete()
        .eq('id', task.id);
      if (error) throw error;
    } catch (error) {
      console.log(error);
      fetchData(); 
    }
  }

  // --- LÓGICA COMPRA DE MEDALLAS ---
  const handleBuyBadge = (badge: Badge) => {
    if (myBadges.includes(badge.id)) {
      Alert.alert('Already Owned', 'You already have this medal in your collection.');
      return;
    }
    if (currentPoints < badge.price) {
      Alert.alert('Insufficient Points', `You need ${badge.price - currentPoints} more points.`);
      return;
    }

    Alert.alert(
      'Purchase Medal',
      `Buy "${badge.name}" for ${badge.price} pts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy', onPress: () => processPurchase(badge) }
      ]
    );
  };

  async function processPurchase(badge: Badge) {
    try {
      const { error } = await supabase
        .from('user_badges')
        .insert({ user_id: session?.user.id, badge_id: badge.id });

      if (error) throw error;
      Alert.alert('Success!', `You unlocked: ${badge.name}`);
      fetchData(); // Actualizar puntos y medallas
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
           ' • ' + 
           date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // --- COMPONENTES RENDERIZABLES ---
  const HabitCard = ({ habit, style }: { habit: Habit, style?: any }) => (
    <TouchableOpacity 
      key={habit.id} 
      style={[styles.card, style]}
      onPress={() => addHabitToUser(habit.id, habit.title)}
      disabled={addingId === habit.id}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={[styles.cardIconContainer, { backgroundColor: getCategoryColor(habit.category) + '20' }]}> 
          <Ionicons name={habit.icon_name} size={32} color={getCategoryColor(habit.category)} />
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{habit.title}</Text>
        <Text style={styles.cardCategory}>{habit.category}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardPoints}>{habit.points}</Text>
        <Text style={styles.cardPointsLabel}>Points</Text>
      </View>
      {addingId === habit.id && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#0047FF" />
        </View>
      )}
    </TouchableOpacity>
  );

  const BadgeItem = ({ badge }: { badge: Badge }) => {
    const isOwned = myBadges.includes(badge.id);
    return (
      <TouchableOpacity 
        style={[styles.badgeCard, isOwned && styles.badgeOwned]}
        onLongPress={() => handleBuyBadge(badge)}
        delayLongPress={300}
        activeOpacity={0.7}
      >
        <View style={[styles.badgeIconContainer, { backgroundColor: badge.color_hex }]}>
          <Ionicons name={badge.icon_name} size={30} color="#fff" />
        </View>
        <View style={styles.badgeInfo}>
          <Text style={styles.badgeName}>{badge.name}</Text>
          <Text style={styles.badgePrice}>{isOwned ? 'Owned' : `${badge.price} pts`}</Text>
        </View>
        {isOwned && (
          <View style={styles.ownedCheck}>
            <Ionicons name="checkmark-circle" size={20} color="#28C76F" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      <View style={styles.backgroundContainer} pointerEvents="none">
        <View style={[styles.bubble, { top: -50, right: -50, width: 200, height: 200, backgroundColor: '#E6EFFF', opacity: 0.8 }]} />
        <View style={[styles.bubble, { top: 150, left: -40, width: 150, height: 150, backgroundColor: '#0047FF', opacity: 0.05 }]} />
        <View style={[styles.bubble, { top: 300, right: 20, width: 80, height: 80, backgroundColor: '#00C6FF', opacity: 0.1 }]} />
        <View style={[styles.bubble, { bottom: 100, left: -60, width: 250, height: 250, backgroundColor: '#E6EFFF', opacity: 0.6 }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>To Do</Text>
          <View style={{ flexDirection: 'row', gap: 15 }}>
            {/* BOTÓN TIENDA DE MEDALLAS */}
            <TouchableOpacity onPress={() => setBadgesModalVisible(true)}>
              <Ionicons name="medal-outline" size={24} color="#0047FF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={fetchData}>
              <Ionicons name="refresh" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* SECCIÓN 1: MY HABITS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Habits</Text>
        </View>

        <View style={styles.myHabitsContainer}>
          {myHabits.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyText}>No active habits.</Text>
              <Text style={styles.emptySubtext}>Add one below!</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
              {myHabits.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.circleWrapper}
                  onLongPress={() => handleLongPress(item)}
                  delayLongPress={300}
                  activeOpacity={0.5} 
                >
                  <View style={[styles.habitCircle, { borderColor: getCategoryColor(item.habits_catalog.category) }]}>
                    <Ionicons 
                      name={item.habits_catalog.icon_name || 'star'} 
                      size={28} 
                      color={getCategoryColor(item.habits_catalog.category)} 
                    />
                  </View>
                  <Text style={styles.circleText} numberOfLines={1}>{item.habits_catalog.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={{ height: 20 }} />

        {/* SECCIÓN 2: MOST POPULAR */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Most Popular</Text>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => setHabitsModalVisible(true)}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <View style={styles.arrowButton}>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
          {recommendations.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </ScrollView>

        <View style={{ height: 20 }} />

        {/* SECCIÓN 3: COMPLETED */}
        {completedHabits.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Completed</Text>
              <Text style={styles.seeAllText}>History</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
              {completedHabits.map((task) => (
                <View key={task.id} style={[styles.card, styles.completedCard]}>
                  <View style={styles.cardContent}>
                    <View style={[styles.cardIconContainer, { backgroundColor: '#E6FFFA' }]}> 
                      <Ionicons name="checkmark-circle" size={32} color="#00B894" />
                    </View>
                    <Text style={[styles.cardTitle, { color: '#666' }]} numberOfLines={2}>
                      {task.habits_catalog.title}
                    </Text>
                    <Text style={styles.completedDate}>
                      {formatDate(task.created_at)}
                    </Text>
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={[styles.cardPoints, { color: '#00B894' }]}>Done</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </>
        )}

      </ScrollView>

      {/* --- MODAL 1: SEE ALL HABITS --- */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={habitsModalVisible}
        presentationStyle="pageSheet"
        onRequestClose={() => setHabitsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Available Habits</Text>
            <TouchableOpacity onPress={() => setHabitsModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>Discover new ways to improve your daily routine.</Text>
          <FlatList
            data={recommendations}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.modalListContent}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <HabitCard habit={item} style={{ width: '48%', marginBottom: 15, marginRight: 0 }} />}
          />
        </SafeAreaView>
      </Modal>

      {/* --- MODAL 2: MEDAL SHOP --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={badgesModalVisible}
        onRequestClose={() => setBadgesModalVisible(false)}
      >
        <View style={styles.medalModalOverlay}>
          <View style={styles.medalModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Medal Shop</Text>
              <TouchableOpacity onPress={() => setBadgesModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.pointsAvailable}>
              Available: <Text style={{color: '#0047FF'}}>{currentPoints} pts</Text>
            </Text>
            <Text style={styles.modalSubtitle}>Long press to purchase</Text>

            <FlatList
              data={badgesCatalog}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => <BadgeItem badge={item} />}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'Health': return '#28C76F';
    case 'Study': return '#0047FF'; 
    case 'Mindset': return '#7367F0';
    case 'Productivity': return '#FF9F43';
    default: return '#0047FF';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 120 },
  backgroundContainer: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
  bubble: { position: 'absolute', borderRadius: 999 },
  
  header: { paddingHorizontal: 20, paddingTop: 10, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#1A1A1A' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  seeAllText: { color: '#666', marginRight: 10, fontSize: 14 },
  arrowButton: { backgroundColor: '#0047FF', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  myHabitsContainer: { paddingLeft: 20, minHeight: 110 },
  horizontalList: { paddingRight: 20, paddingBottom: 10 },
  circleWrapper: { alignItems: 'center', marginRight: 20, width: 75 },
  habitCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5 },
  circleText: { fontSize: 12, color: '#333', textAlign: 'center', width: '100%', fontWeight: '500' },
  emptyStateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingRight: 20, marginTop: 10 },
  emptyText: { color: '#333', fontWeight: 'bold', fontSize: 16 },
  emptySubtext: { color: '#666', marginTop: 5 },

  // Cards
  card: { width: 140, height: 190, backgroundColor: '#fff', borderRadius: 20, marginRight: 15, padding: 12, justifyContent: 'space-between', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, marginBottom: 10, marginLeft: 2 },
  completedCard: { backgroundColor: '#FAFAFA', opacity: 0.9 }, 
  cardContent: { flex: 1, alignItems: 'center', paddingTop: 10 },
  cardIconContainer: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A', textAlign: 'center', marginBottom: 4 },
  cardCategory: { fontSize: 10, color: '#999', textTransform: 'uppercase' },
  completedDate: { fontSize: 10, color: '#999', textAlign: 'center', marginTop: 5, fontStyle: 'italic' },
  cardFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 4 },
  cardPoints: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  cardPointsLabel: { fontSize: 12, color: '#666', marginBottom: 3 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', borderRadius: 20 },

  // Styles Habits Modal
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
  closeButton: { padding: 5, backgroundColor: '#F5F6FA', borderRadius: 20 },
  modalSubtitle: { paddingHorizontal: 20, color: '#666', marginBottom: 20 },
  modalListContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // Styles Medal Modal
  medalModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  medalModalContent: { backgroundColor: '#fff', height: '75%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
  pointsAvailable: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 5 },
  
  // Badge Card
  badgeCard: { width: '48%', backgroundColor: '#F9FAFB', borderRadius: 20, padding: 15, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  badgeOwned: { borderColor: '#28C76F', backgroundColor: '#F0FFF4' },
  badgeIconContainer: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 10, shadowColor: "#000", shadowOffset: {width:0, height:4}, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
  badgeInfo: { alignItems: 'center' },
  badgeName: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A', textAlign: 'center', marginBottom: 2 },
  badgePrice: { fontSize: 12, color: '#666', fontWeight: '600' },
  ownedCheck: { position: 'absolute', top: 10, right: 10 },
});