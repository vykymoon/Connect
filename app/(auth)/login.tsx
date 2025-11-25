import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../src/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Error', error.message);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      {/* Manchas Azules de Fondo */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomRight} />

      <View style={styles.content}>
        <Text style={styles.headerTitle}>Login</Text>
        <Text style={styles.headerSubtitle}>Good to see you back! </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <Ionicons name="mail-outline" size={20} color="#aaa" style={styles.inputIcon} />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Ionicons name="lock-closed-outline" size={20} color="#aaa" style={styles.inputIcon} />
        </View>

        <TouchableOpacity style={styles.mainButton} onPress={signInWithEmail} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainButtonText}>Next</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  blobTopRight: { position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: '#E6EFFF' },
  blobBottomRight: { position: 'absolute', top: 100, right: -80, width: 150, height: 150, borderRadius: 75, backgroundColor: '#0047FF' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  headerTitle: { fontSize: 36, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 10 },
  headerSubtitle: { fontSize: 16, color: '#666', marginBottom: 40 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F6FA', borderRadius: 15, paddingHorizontal: 15, marginBottom: 15, height: 55 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: '100%', color: '#333' },
  mainButton: { backgroundColor: '#0047FF', borderRadius: 30, height: 55, alignItems: 'center', justifyContent: 'center', marginTop: 20, shadowColor: '#0047FF', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  mainButtonText: { color: 'white', fontSize: 18, fontWeight: '600' },
  cancelButton: { alignItems: 'center', marginTop: 20 },
  cancelText: { color: '#666' },
});