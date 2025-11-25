import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useIsFocused } from '@react-navigation/native';
import { ResizeMode, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Vibration,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/providers/AuthProvider';

const { width, height } = Dimensions.get('window');

export default function ReelsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isFocused = useIsFocused();
  
  let tabBarHeight = 0;
  try { tabBarHeight = useBottomTabBarHeight(); } catch (e) { tabBarHeight = 70; }
  const VIDEO_HEIGHT = height - tabBarHeight; 

  const [reels, setReels] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados Nuevo Post
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [tempVideoUri, setTempVideoUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (params.videoFromCamera) {
      setTempVideoUri(params.videoFromCamera as string);
      setUploadModalVisible(true);
    }
  }, [params.videoFromCamera]);

  useFocusEffect(
    React.useCallback(() => {
      fetchReels();
    }, [])
  );

  async function fetchReels() {
    try {
      const { data, error } = await supabase
        .from('reels')
        .select(`*, profiles:user_id (username, avatar_url)`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setReels(data);
    } catch (error) {
      console.log("Error fetching reels:", error);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReels();
    setRefreshing(false);
  };

  const handleDeleteReel = async (reelId: number) => {
    try {
      setReels(prev => prev.filter(r => r.id !== reelId));
      const { error } = await supabase.from('reels').delete().eq('id', reelId);
      if (error) throw error;
      Alert.alert("Deleted", "Your reel has been removed.");
    } catch (error: any) {
      Alert.alert("Error", "Could not delete reel.");
      fetchReels(); 
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.5,
      videoMaxDuration: 60,
    });

    if (!result.canceled) {
      setTempVideoUri(result.assets[0].uri);
      setUploadModalVisible(true);
    }
  };

  const handleCreateReel = () => {
    Alert.alert("Create Reel", "Share your moments", [
      { text: "Cancel", style: "cancel" },
      { text: "Record Video", onPress: () => router.push('/camera') },
      { text: "Choose from Gallery", onPress: pickVideo }
    ]);
  };

  const handlePostReel = async () => {
    if (!session?.user || !tempVideoUri) return;
    setUploading(true);

    try {
      const ext = tempVideoUri.substring(tempVideoUri.lastIndexOf('.') + 1);
      const fileName = `${session.user.id}/${Date.now()}.${ext}`;
      const response = await fetch(tempVideoUri);
      const arrayBuffer = await response.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('reels')
        .upload(fileName, arrayBuffer, { contentType: `video/${ext}`, upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('reels').getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('reels')
        .insert({
          user_id: session.user.id,
          video_url: urlData.publicUrl,
          description: description.trim(),
        });

      if (dbError) throw dbError;

      Alert.alert("Success", "Reel posted successfully!");
      setUploadModalVisible(false);
      setTempVideoUri(null);
      setDescription('');
      fetchReels(); 

    } catch (error: any) {
      Alert.alert("Upload Failed", error.message);
    } finally {
      setUploading(false);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <View style={styles.container}>
      {isFocused && <StatusBar style="light" />}
      
      <SafeAreaView style={styles.headerContainer}>
        <TouchableOpacity onPress={onRefresh} activeOpacity={0.7}>
           <Text style={styles.headerTitle}>Reels</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCreateReel}>
          <Ionicons name="add-circle-outline" size={32} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      {reels.length === 0 ? (
        <View style={[styles.emptyContainer, { height: VIDEO_HEIGHT }]}>
          <Ionicons name="videocam-off-outline" size={60} color="#666" />
          <Text style={{color: '#666', marginTop: 10}}>No reels yet.</Text>
          <TouchableOpacity onPress={fetchReels} style={{marginTop: 20}}>
             <Text style={{color: '#0047FF'}}>Tap to Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reels}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <ReelItem 
              item={item} 
              isActive={index === activeIndex && isFocused} 
              currentUserId={session?.user.id}
              height={VIDEO_HEIGHT}
              onDelete={() => handleDeleteReel(item.id)}
            />
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          snapToInterval={VIDEO_HEIGHT}
          decelerationRate="fast"
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      {/* MODAL NEW POST */}
      <Modal
        animationType="slide"
        presentationStyle="pageSheet" 
        visible={uploadModalVisible}
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Post</Text>
              <TouchableOpacity onPress={handlePostReel} disabled={uploading}>
                {uploading ? <ActivityIndicator color="#0047FF" /> : <Text style={styles.postButtonText}>Share</Text>}
              </TouchableOpacity>
            </View>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                <View style={styles.composeRow}>
                  <View style={styles.previewWrapper}>
                    {tempVideoUri && <Video source={{ uri: tempVideoUri }} style={styles.miniPreview} resizeMode={ResizeMode.COVER} shouldPlay={false} isMuted />}
                  </View>
                  <View style={styles.captionInputContainer}>
                    <TextInput style={styles.captionInput} placeholder="Write a caption..." placeholderTextColor="#999" value={description} onChangeText={setDescription} multiline maxLength={150} />
                  </View>
                </View>
                <View style={styles.divider} />
                <Text style={styles.charCount}>{description.length}/150</Text>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  );
}

// --- REEL ITEM ---
const ReelItem = ({ item, isActive, currentUserId, height, onDelete }: { item: any, isActive: boolean, currentUserId?: string, height: number, onDelete: () => void }) => {
  const video = useRef<Video>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  // ESTADO DE AMISTAD: 'none' | 'following' | 'friend'
  const [friendStatus, setFriendStatus] = useState<'none' | 'following' | 'friend'>('none');

  useEffect(() => {
    // Verificar estado de amistad al cargar el reel
    checkFriendStatus();
  }, []);

  useEffect(() => {
    const managePlayback = async () => {
      try {
        if (video.current) {
          if (isActive) await video.current.playAsync();
          else await video.current.pauseAsync();
        }
      } catch (e) {}
    };
    managePlayback();
  }, [isActive]);

  // --- LÓGICA DE AMIGOS ---
  const checkFriendStatus = async () => {
    if (!currentUserId || currentUserId === item.user_id) return;

    // 1. ¿Yo lo sigo a él?
    const { data: iFollow } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', currentUserId)
      .eq('following_id', item.user_id)
      .single();

    if (iFollow) {
      // 2. ¿Él me sigue a mí?
      const { data: theyFollow } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', item.user_id)
        .eq('following_id', currentUserId)
        .single();

      if (theyFollow) {
        setFriendStatus('friend'); // Amistad mutua
      } else {
        setFriendStatus('following'); // Solo lo sigo yo
      }
    } else {
      setFriendStatus('none');
    }
  };

  const handleFriendAction = async () => {
    if (!currentUserId) return;
    Vibration.vibrate(10);

    if (friendStatus === 'none') {
      // AGREGAR AMIGO (SEGUIR)
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: currentUserId, following_id: item.user_id });
      
      if (!error) {
        // Verificamos si se vuelve amigo instantáneamente
        const { data: theyFollow } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', item.user_id)
          .eq('following_id', currentUserId)
          .single();
          
        setFriendStatus(theyFollow ? 'friend' : 'following');
        if (theyFollow) Alert.alert("New Friend! 🎉", `You are now friends with ${item.profiles.username}`);
      }
    } else {
      // DEJAR DE SEGUIR (UNFRIEND)
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', item.user_id);
        
      if (!error) setFriendStatus('none');
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleSingleTap = () => {
    Vibration.vibrate(10); 
    Alert.alert("Hint", "Long press to manage this reel.");
  };

  const handleOptions = () => {
    Vibration.vibrate(50); 
    if (currentUserId === item.user_id) {
      Alert.alert("Options", "Manage your reel", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete Reel", style: "destructive", onPress: onDelete }
      ]);
    } else {
      Alert.alert("Options", "Report content", [
        { text: "Cancel", style: "cancel" },
        { text: "Report", onPress: () => console.log("Reported") }
      ]);
    }
  };

  // Renderizado del Botón de Amigo Dinámico
  const renderFriendButton = () => {
    // No mostrar botón si es mi propio video
    if (currentUserId === item.user_id) return null;

    if (friendStatus === 'friend') {
      return (
        <TouchableOpacity style={[styles.friendBtn, { backgroundColor: '#28C76F', borderColor: '#28C76F' }]} onPress={handleFriendAction}>
          <Text style={styles.friendText}>Friend</Text>
        </TouchableOpacity>
      );
    } else if (friendStatus === 'following') {
      return (
        <TouchableOpacity style={[styles.friendBtn, { backgroundColor: '#333' }]} onPress={handleFriendAction}>
          <Text style={styles.friendText}>Sent</Text>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity style={styles.friendBtn} onPress={handleFriendAction}>
          <Text style={styles.friendText}>Add Friend</Text>
        </TouchableOpacity>
      );
    }
  };

  return (
    <View style={{ width: width, height: height, backgroundColor: 'black' }}>
      <Video
        ref={video}
        style={StyleSheet.absoluteFill}
        source={{ uri: item.video_url }}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay={isActive}
        isMuted={isMuted}
        posterSource={{ uri: 'https://via.placeholder.com/400x800/000000/FFFFFF?text=Loading...' }}
        usePoster
      />
      
      <View style={styles.uiContainer}>
        <View style={styles.leftColumn}>
          <View style={styles.userRow}>
            <Image source={{ uri: item.profiles?.avatar_url || 'https://via.placeholder.com/50' }} style={styles.avatar} />
            <Text style={styles.username}>{item.profiles?.username || 'User'}</Text>
            
            {/* BOTÓN DE AMIGO DINÁMICO */}
            {renderFriendButton()}

          </View>
          <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
        </View>

        <View style={styles.rightColumn}>
          
          {/* BOTÓN MUTE */}
          <TouchableOpacity style={styles.actionBtn} onPress={toggleMute}>
            <Ionicons name={isMuted ? "volume-mute-outline" : "volume-high-outline"} size={30} color="#fff" />
            <Text style={styles.actionText}>{isMuted ? "Muted" : "Audio"}</Text>
          </TouchableOpacity>

          {/* BOTÓN 3 PUNTOS */}
          <TouchableOpacity style={styles.actionBtn} onPress={handleSingleTap} onLongPress={handleOptions} activeOpacity={0.4} delayLongPress={400}>
             <Ionicons name="ellipsis-horizontal" size={30} color="#fff" />
             <Text style={styles.actionText}>More</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width:1, height:1}, textShadowRadius: 3 },
  emptyContainer: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },

  modalContainer: { flex: 1, backgroundColor: '#fff', paddingTop: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: '#ddd' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  cancelText: { fontSize: 16, color: '#000' },
  postButtonText: { color: '#0047FF', fontWeight: 'bold', fontSize: 16 },
  modalScroll: { padding: 15 },
  composeRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  previewWrapper: { width: 70, height: 100, backgroundColor: '#eee', marginRight: 15, borderRadius: 4, overflow: 'hidden' },
  miniPreview: { width: '100%', height: '100%' },
  captionInputContainer: { flex: 1, height: 100 },
  captionInput: { flex: 1, fontSize: 16, color: '#1A1A1A', textAlignVertical: 'top', paddingTop: 5 },
  divider: { height: 0.5, backgroundColor: '#ddd', marginVertical: 5 },
  charCount: { textAlign: 'right', color: '#999', fontSize: 12 },

  uiContainer: { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 15, paddingBottom: 20 },
  leftColumn: { flex: 1, marginRight: 60, justifyContent: 'flex-end' },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#fff', marginRight: 8 },
  username: { color: '#fff', fontWeight: 'bold', fontSize: 15, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width:1, height:1}, textShadowRadius: 3 },
  
  // ESTILOS BOTÓN FRIEND
  friendBtn: { 
    marginLeft: 10, paddingVertical: 4, paddingHorizontal: 10, 
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 6, 
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' 
  },
  friendText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  description: { color: '#fff', fontSize: 14, marginBottom: 8, lineHeight: 18, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: {width:1, height:1}, textShadowRadius: 4 },
  rightColumn: { alignItems: 'center', gap: 20, paddingBottom: 10 },
  actionBtn: { alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width:1, height:1}, textShadowRadius: 3 },
});