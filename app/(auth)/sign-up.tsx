import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../src/lib/supabase';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // <--- NUEVO ESTADO
  const [phone, setPhone] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 1. Seleccionar imagen
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

  // 2. Subida optimizada
  const uploadImage = async (uri: string, userId: string) => {
    try {
      const ext = uri.substring(uri.lastIndexOf('.') + 1);
      const fileName = `${userId}/${Date.now()}.${ext}`;

      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${ext}`,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicData.publicUrl;

    } catch (error) {
      console.error('Error subiendo imagen:', error);
      return null;
    }
  };

  // 3. Registro Actualizado
  async function signUpWithEmail() {
    // Validamos que el username no esté vacío
    if (!email || !password || !username) return Alert.alert('Error', 'Email, Password y Usuario son obligatorios');
    
    setLoading(true);
    
    try {
      // A. Crear usuario en Auth enviando la metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,      // <--- ENVIAMOS EL USERNAME
            phone_number: phone,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('No se creó el usuario');

      // B. Subida de foto (si existe)
      if (imageUri) {
        const avatarUrl = await uploadImage(imageUri, data.user.id);
        
        if (avatarUrl) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: avatarUrl })
            .eq('id', data.user.id);

          if (updateError) console.error('Error actualizando perfil:', updateError);
        }
      }

      Alert.alert('¡Cuenta creada!', 'Por favor inicia sesión.');
      router.replace('/(auth)/login');

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.blob} />
      <View style={styles.content}>
        <Text style={styles.headerTitle}>Create{'\n'}Account</Text>

        <TouchableOpacity style={styles.cameraContainer} onPress={pickImage}>
          <View style={[styles.cameraCircle, imageUri ? { borderStyle: 'solid', borderColor: 'transparent' } : {}]}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={{ width: 80, height: 80, borderRadius: 40 }} />
            ) : (
              <Ionicons name="camera-outline" size={30} color="#0047FF" />
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.form}>
          {/* CAMPO DE NOMBRE DE USUARIO (NUEVO) */}
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.inputField} 
              placeholder="Username" 
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <Ionicons name="person-outline" size={20} color="#999" style={styles.icon} />
          </View>

          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.inputField} 
              placeholder="Email" 
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            <Ionicons name="mail-outline" size={20} color="#999" style={styles.icon} />
          </View>

          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.inputField} 
              placeholder="Password" 
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.icon} />
          </View>

          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.inputField} 
              placeholder="Your number (Optional)" 
              placeholderTextColor="#999"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Ionicons name="call-outline" size={20} color="#999" style={styles.icon} />
          </View>

          <TouchableOpacity style={styles.mainButton} onPress={signUpWithEmail} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainButtonText}>Done</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  blob: { position: 'absolute', top: -20, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: '#0047FF' },
  content: { flex: 1, paddingHorizontal: 30, paddingTop: 60 },
  headerTitle: { fontSize: 36, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 20 },
  cameraContainer: { alignItems: 'flex-start', marginBottom: 30 },
  cameraCircle: { width: 80, height: 80, borderRadius: 40, borderStyle: 'dashed', borderWidth: 1, borderColor: '#0047FF', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F6FA' },
  form: { width: '100%' },
  
  // Estilos mejorados para Inputs con Iconos
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F5F6FA', 
    borderRadius: 15, 
    marginBottom: 15, 
    paddingHorizontal: 15,
    height: 55 
  },
  inputField: { 
    flex: 1, 
    height: '100%', 
    fontSize: 16, 
    color: '#333' 
  },
  icon: {
    marginLeft: 10
  },

  mainButton: { backgroundColor: '#0047FF', borderRadius: 30, height: 55, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  mainButtonText: { color: 'white', fontSize: 18, fontWeight: '600' },
  cancelButton: { alignItems: 'center', marginTop: 20 },
  cancelText: { color: '#666' },
});