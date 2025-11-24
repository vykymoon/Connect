import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';

export default function MainLayout() {
  return (
    <>
      <StatusBar style="dark" />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#0047FF',
          tabBarInactiveTintColor: '#C1C1C1',
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 0,
            elevation: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            height: Platform.OS === 'ios' ? 85 : 70,
            paddingBottom: Platform.OS === 'ios' ? 25 : 10,
            paddingTop: 10,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={28} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="favorites"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "heart" : "heart-outline"} size={28} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="map"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.mapIconContainer}>
                <Ionicons name={focused ? "location" : "location-outline"} size={32} color={color} />
                {focused && <View style={[styles.dot, { backgroundColor: color }]} />}
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="shop"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "checkbox" : "checkbox-outline"} size={28} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "person" : "person-outline"} size={28} color={color} />
            ),
          }}
        />

        {/* --- CAMBIO AQUÍ: CHATS VISIBLE PERO SIN BOTÓN --- */}
        <Tabs.Screen
          name="chats"
          options={{
            href: null, // Oculta el botón
            // Eliminamos 'display: none' para que la barra SE VEA
          }}
        />

      

        {/* Estos sí los ocultamos porque suelen ser pantalla completa */}
        <Tabs.Screen
          name="ai-chat"
          options={{
            href: null,
            tabBarStyle: { display: 'none' },
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            href: null,
            tabBarStyle: { display: 'none' },
          }}
        />
        <Tabs.Screen
          name="user-profile"
          options={{
            href: null,
            tabBarStyle: { display: 'none' },
          }}
        />

      </Tabs>
      
    </>
    
  );
}

const styles = StyleSheet.create({
  mapIconContainer: { alignItems: 'center', justifyContent: 'center', height: 50, width: 50 },
  dot: { height: 4, width: 4, borderRadius: 2, marginTop: 4 }
});