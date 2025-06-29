// app/(tabs)/menu.tsx - Fixed logout implementation
import { router } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { homeStyles } from '../../styles/HomeStyles';
import AuthManager from '../../utils/authManager'; // Import AuthManager instead of apiService

export default function MenuScreen() {
  const handleLogout = async () => {
    try {
      console.log('🚪 Starting logout process...');
      
      // Use AuthManager to clear token - this will notify all services
      await AuthManager.clearAuthToken();
      
      console.log('✅ Logout successful, redirecting to login...');
      
      // Navigate to login screen
      router.replace('/login');
      
    } catch (error) {
      console.error('❌ Logout failed:', error);
      Alert.alert('Logout Error', 'An unexpected error occurred during logout.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Menu</Text>
        <Text style={styles.subtitle}>
          Settings, help, and more options
        </Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Basic styling for the MenuScreen, can be expanded or moved
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: homeStyles.container.backgroundColor,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: homeStyles.sectionTitle.fontSize,
    fontWeight: homeStyles.sectionTitle.fontWeight as 'bold',
    color: homeStyles.sectionTitle.color,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: homeStyles.actionButton.borderRadius,
    alignItems: 'center',
    marginTop: 20,
    minWidth: 200,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: homeStyles.actionButtonText.fontSize,
    fontWeight: homeStyles.actionButtonText.fontWeight as '600',
  },
});