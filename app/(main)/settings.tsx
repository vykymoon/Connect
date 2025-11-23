import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/providers/AuthProvider';

export default function SettingsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); // Estado para el teléfono
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (session) getProfile();
  }, [session]);

  // 1. OBTENER DATOS DEL PERFIL (Incluyendo teléfono)
  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) return;
      
      setEmail(session.user.email || '');

      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, phone_number') // Pedimos también el teléfono
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.log('Error fetching profile:', error);
      }

      if (data) {
        setUsername(data.username || '');
        setPhone(data.phone_number || ''); // Cargamos el teléfono
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
       console.log(error);
    } finally {
      setLoading(false);
    }
  }

  // 2. SELECCIONAR FOTO
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // 3. SUBIR FOTO
  const uploadImage = async (uri: string) => {
    try {
      const userId = session?.user.id;
      const ext = uri.substring(uri.lastIndexOf('.') + 1);
      const fileName = `${userId}/${Date.now()}.${ext}`;

      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, { contentType: `image/${ext}`, upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  // 4. GUARDAR CAMBIOS (Incluyendo teléfono)
  async function updateProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      let finalAvatarUrl = avatarUrl;

      if (imageUri) {
        const uploadedUrl = await uploadImage(imageUri);
        if (uploadedUrl) finalAvatarUrl = uploadedUrl;
      }

      const updates = {
        id: session.user.id,
        username,
        phone_number: phone, // Guardamos el teléfono
        avatar_url: finalAvatarUrl,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;
      
      Alert.alert('Success', 'Profile updated successfully!');
      router.back();

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
             <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>Your Profile</Text>

          {/* AVATAR SECTION */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.avatar} />
              ) : avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={50} color="#ccc" />
                </View>
              )}
              
              <View style={styles.editIconBadge}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* FORMULARIO */}
          <View style={styles.form}>
            
            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="User_name"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Phone Number (Nuevo) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+1 234 567 890"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
               <Text style={styles.inputLabel}>Email</Text>
               <View style={[styles.inputContainer, styles.disabledInput]}>
                <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: '#666' }]}
                  value={email}
                  editable={false}
                  placeholder="gmail@example.com"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
               <Text style={styles.inputLabel}>Password</Text>
               <View style={[styles.inputContainer, styles.disabledInput]}>
                <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: '#666' }]}
                  value="**********"
                  secureTextEntry
                  editable={false}
                />
              </View>
            </View>

          </View>
          
          {/* Espacio extra para scroll */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* FOOTER FIXED */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={updateProfile} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backButton: { padding: 5, borderRadius: 10, backgroundColor: '#F5F6FA' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },

  content: { paddingHorizontal: 20, paddingTop: 10 },
  sectionLabel: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 25, textAlign: 'center' },

  avatarSection: { alignItems: 'center', marginBottom: 35 },
  avatarWrapper: { position: 'relative', shadowColor: "#0047FF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 8 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: '#fff' },
  avatarPlaceholder: { backgroundColor: '#F0F2F5', alignItems: 'center', justifyContent: 'center' },
  editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0047FF', width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },

  form: { gap: 20 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 14, color: '#1A1A1A', fontWeight: '600', marginLeft: 5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F6FA', borderRadius: 16, paddingHorizontal: 15, height: 56, borderWidth: 1, borderColor: 'transparent' },
  disabledInput: { opacity: 0.8, backgroundColor: '#F0F2F5' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1A1A1A', height: '100%' },

  footer: { padding: 20, paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: '#fff' },
  saveButton: { backgroundColor: '#0047FF', borderRadius: 16, paddingVertical: 18, alignItems: 'center', shadowColor: "#0047FF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});