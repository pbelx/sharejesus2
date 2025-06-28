// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          // Determine icon based on route name (file name)
          if (route.name === 'index') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'post') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'menu') {
            iconName = focused ? 'menu' : 'menu-outline';
          } else {
            iconName = 'ellipse-outline'; // Default icon
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3260AD',
        tabBarInactiveTintColor: '#1e1b1b',
        tabBarStyle: {
          backgroundColor: '#E6E6E6',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          // Adjust height and paddingBottom to account for safe area insets
          height: (Platform.OS === 'ios' ? 60 : 60) + insets.bottom, // Base height + bottom inset
          // paddingBottom: Platform.OS === 'ios' ? 25 + insets.bottom /2 : 10 + insets.bottom, // Original padding + bottom inset
          paddingTop: 5,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false, // Hide header for all tab screens
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Post',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
        }}
      />
    </Tabs>
  );
}