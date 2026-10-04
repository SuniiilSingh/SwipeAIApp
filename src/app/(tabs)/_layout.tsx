import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { registerForPushNotificationsAsync } from '@/services/notifications';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 0);
  const calculatedHeight = 60 + bottomInset;

  useEffect(() => {
    // Re-verify push notification registration for authenticated user
    registerForPushNotificationsAsync().catch(() => {});
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: calculatedHeight,
            paddingBottom: Math.max(bottomInset, 8),
          },
        ],
        tabBarActiveTintColor: '#E94057',
        tabBarInactiveTintColor: '#6B7082',
        tabBarLabelStyle: styles.tabLabel,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconBox}>
              <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>❤️</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Tribes',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconBox}>
              <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>🧬</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconBox}>
              <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>💬</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'VibeStore',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconBox}>
              <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>⚡</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconBox}>
              <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>👤</Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#121318',
    borderTopWidth: 1,
    borderTopColor: '#20222B',
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: {
    fontSize: 18,
    opacity: 0.6,
  },
  tabEmojiFocused: {
    opacity: 1.0,
    transform: [{ scale: 1.15 }],
  },
});
