import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
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
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
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
