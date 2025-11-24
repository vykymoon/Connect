import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  const [facing, setFacing] = useState<CameraType>('back');
  const [photo, setPhoto] = useState<string | null>(null);

  // 1. Cargando permisos
  if (!permission) {
    return <View style={styles.container} />;
  }

  // 2. Permiso denegado
  if (!permission.granted) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.textInfo}>Camera permission is required</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.btnPermission}>
          <Text style={styles.textBtn}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  async function takePicture() {
    if (cameraRef.current) {
      try {
        const photoData = await cameraRef.current.takePictureAsync({ quality: 0.7 });
        setPhoto(photoData?.uri || null);
      } catch (e) {
        console.log(e);
      }
    }
  }

  function confirmPhoto() {
    if (photo) {
      router.dismiss();
      router.push({
        pathname: '/(main)/settings',
        params: { avatarFromCamera: photo }
      });
    }
  }

  // --- VISTA PREVIA (FOTO TOMADA) ---
  if (photo) {
    return (
      <SafeAreaView style={styles.container}>
        <Image source={{ uri: photo }} style={styles.preview} />
        <View style={styles.controlsContainer}>
          <TouchableOpacity onPress={() => setPhoto(null)} style={styles.circleBtn}>
            <Ionicons name="trash-outline" size={30} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={confirmPhoto} style={[styles.circleBtn, { backgroundColor: '#0047FF' }]}>
            <Ionicons name="checkmark" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- CÁMARA EN VIVO ---
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        
        {/* Botón Cerrar (Arriba) */}
        <SafeAreaView style={styles.topControls}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Controles (Abajo) */}
        <View style={styles.bottomControls}>
          <TouchableOpacity onPress={toggleCameraFacing} style={styles.sideBtn}>
            <Ionicons name="camera-reverse-outline" size={30} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={takePicture} style={styles.captureBtn}>
            <View style={styles.captureInner} />
          </TouchableOpacity>

          {/* Espacio vacío para equilibrar */}
          <View style={styles.sideBtn} /> 
        </View>

      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centeredContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 20 },
  
  textInfo: { color: 'white', fontSize: 16, marginBottom: 20, textAlign: 'center' },
  btnPermission: { backgroundColor: '#0047FF', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  textBtn: { color: 'white', fontWeight: 'bold' },

  camera: { flex: 1 },
  preview: { flex: 1, resizeMode: 'contain' },

  topControls: { position: 'absolute', top: 0, left: 0, right: 0, padding: 20, alignItems: 'flex-start' },
  closeBtn: { width: 40, height: 40, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  bottomControls: { position: 'absolute', bottom: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' },
  
  captureBtn: { width: 80, height: 80, borderRadius: 40, borderWidth: 5, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  sideBtn: { width: 50, alignItems: 'center' },

  controlsContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 30, backgroundColor: '#000' },
  circleBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' },
});