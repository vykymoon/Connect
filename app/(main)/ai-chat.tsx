import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AIChatScreen() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState('todo');

  return (
    <SafeAreaView style={styles.container}>
      
      {/* --- ENCABEZADO --- */}
      <View style={styles.header}>
        {/* Botón de Atrás (Estilo igualado a Settings) */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()} 
        >
          {/* Icono cambiado a color negro #1A1A1A para coincidir con Settings */}
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>AI Assistant</Text>
      </View>

      {/* --- ÁREA DEL CHAT --- */}
      <ScrollView contentContainerStyle={styles.chatContent}>
        <View style={styles.botMessage}>
          <Text style={styles.botText}>
            Hello, Amanda! Welcome to Customer Care Service. We will be happy to help you. Please, provide us more details about your issue before we can start.
          </Text>
        </View>
      </ScrollView>

      {/* --- PANEL INFERIOR --- */}
      <View style={styles.bottomSheet}>
        <Text style={styles.sheetTitle}>Ask your personal assistant</Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={[styles.optionChip, selectedOption === 'todo' && styles.optionChipActive]}
            onPress={() => setSelectedOption('todo')}
          >
            {selectedOption === 'todo' && (
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 5 }} />
            )}
            <Text style={[styles.optionText, selectedOption === 'todo' && styles.optionTextActive]}>
              I want ToDo Suggestions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionChip, selectedOption === 'hobbies' && styles.optionChipActive]}
            onPress={() => setSelectedOption('hobbies')}
          >
            <Text style={[styles.optionText, selectedOption === 'hobbies' && styles.optionTextActive]}>
              I want to discover new hobbies
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={styles.optionChip}>
              <Text style={styles.optionText}>Other</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionChip}>
              <Text style={styles.optionText}>Other</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={[styles.optionChip, {alignSelf: 'flex-start'}]}>
              <Text style={styles.optionText}>Other</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.nextButton}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  
  // Header Actualizado
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  
  // ESTILO ACTUALIZADO (Igual que en Settings)
  backButton: { 
    padding: 5, 
    borderRadius: 10, 
    backgroundColor: '#F5F6FA', 
    marginRight: 15 // Mantenemos el margen para separar del texto
  },
  
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },

  chatContent: { paddingHorizontal: 20, paddingBottom: 20 },
  botMessage: { backgroundColor: '#E6EFFF', padding: 20, borderRadius: 15, borderTopLeftRadius: 0, maxWidth: '85%' },
  botText: { fontSize: 15, color: '#333', lineHeight: 22 },

  bottomSheet: { padding: 20, paddingBottom: 40 },
  sheetTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 20 },
  optionsContainer: { gap: 10, marginBottom: 30 },
  optionChip: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#0047FF', flexDirection: 'row', alignItems: 'center' },
  optionChipActive: { backgroundColor: '#0047FF' },
  optionText: { color: '#0047FF', fontSize: 15, fontWeight: '500' },
  optionTextActive: { color: '#fff' },
  actionBar: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  nextButton: { flex: 1, backgroundColor: '#0047FF', paddingVertical: 18, borderRadius: 15, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  closeButton: { width: 56, height: 56, backgroundColor: '#0047FF', borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});