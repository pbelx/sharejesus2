// app/login.tsx - Updated with AuthManager and Signup Option
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import apiService from '@/services/apiService';
import AuthManager from '@/utils/authManager';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert, Image, KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function LoginScreen() {   
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Initialize AuthManager when component mounts
  useEffect(() => {
    const initAuth = async () => {
      try {
        await AuthManager.initialize();
        
        // Check if already authenticated
        if (AuthManager.isAuthenticated()) {
          console.log('✅ Already authenticated, redirecting...');
          router.replace('/(tabs)' as any);
        }
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
      }
    };

    initAuth();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Attempting login...');
      
      const response = await apiService.login({
        userName: username,
        password: password,
      });

      if (response.success && response.data && response.data.jwt) {
        console.log('✅ Login successful, setting up authentication...');
        
        // Use AuthManager to set token (this will notify all services)
        await AuthManager.setAuthToken(response.data.jwt);
        
        console.log('✅ JWT Token stored and services notified');
        console.log('👤 User Data:', response.data.person);
        
        // Debug auth status
        if (__DEV__) {
          await AuthManager.debugAuthStatus();
        }
        
        router.replace('/(tabs)' as any);
      } else {
        const errorMessage = response.error || 'Login failed. Please check your credentials.';
        Alert.alert('Login Failed', errorMessage);
        console.error('❌ Login failed:', response);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('❌ Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Add debug function for development
  const debugAuth = async () => {
    if (__DEV__) {
      console.log('🔍 Manual Auth Debug:');
      await AuthManager.debugAuthStatus();
      
      // Also run the existing auth debugger
      const { AuthDebugger } = await import('@/utils/authDebug');
      await AuthDebugger.runCompleteAuthDiagnostic();
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'white',
      paddingTop: 10,
      paddingBottom: 3
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 20,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 10,
      color: '#4472C4',
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 40,
      color: Colors.light.text,
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      color: '#4472C4',
    },
    input: {
      borderWidth: 1,
      borderColor: Colors.dark.icon,
      borderRadius: 8,
      padding: 15,
      fontSize: 16,
      backgroundColor: Colors.dark.tint,
      color: '#000',
    },
    passwordInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.dark.icon,
      borderRadius: 8,
      backgroundColor: Colors.dark.tint,
    },
    passwordInput: {
      flex: 1,
      padding: 15,
      fontSize: 16,
      color: '#000',
    },
    eyeIcon: {
      paddingHorizontal: 15,
    },
    loginButton: {
      backgroundColor: '#4472C4',
      borderRadius: 8,
      padding: 15,
      alignItems: 'center',
      marginTop: 20,
    },
    loginButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: 10,
    },
    logo: {
      width: 220,
      height: 220,
      alignSelf: 'center',
      marginBottom: 30,
    },
    linkContainer: {
      alignItems: 'center',
    },
    forgotPassword: {
      textAlign: 'center',
      marginTop: 15,
      color: '#4472C4',
      fontSize: 14,
    },
    linkText: {
      color: '#000',
      fontSize: 16,
      textDecorationLine: 'underline',
      marginTop: 10,
    },
    debugButton: {
      backgroundColor: '#FF6B6B',
      borderRadius: 8,
      padding: 10,
      alignItems: 'center',
      marginTop: 10,
    },
    debugButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold',
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={dynamicStyles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require('../assets/images/logo.png')}
            style={dynamicStyles.logo}
            resizeMode="contain"
          />
          
          <Text style={dynamicStyles.title}>Welcome Back</Text>
          <Text style={dynamicStyles.subtitle}>Sign in to continue</Text>

          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.label}>Username</Text>
            <TextInput
              style={dynamicStyles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.label}>Password</Text>
            <View style={dynamicStyles.passwordInputContainer}>
              <TextInput
                style={dynamicStyles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity 
                onPress={togglePasswordVisibility} 
                style={dynamicStyles.eyeIcon}
                disabled={loading}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={dynamicStyles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <View style={dynamicStyles.loadingContainer}>
                <ActivityIndicator color="white" />
                <Text style={dynamicStyles.loadingText}>Signing In...</Text>
              </View>
            ) : (
              <Text style={dynamicStyles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.linkContainer}>
            <Text style={dynamicStyles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={dynamicStyles.linkContainer} 
            onPress={() => router.push('/Signup')}
            disabled={loading}
          >
            <Text style={dynamicStyles.linkText}>Do not have an account? Sign Up</Text>
          </TouchableOpacity>

          {/* Debug button for development */}
          {/* {__DEV__ && (
            <TouchableOpacity
              style={dynamicStyles.debugButton}
              onPress={debugAuth}
            >
              <Text style={dynamicStyles.debugButtonText}>Debug Auth</Text>
            </TouchableOpacity>
          )} */}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}