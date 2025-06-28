import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import apiService from '@/services/apiService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.login({
        userName: username,
        password: password,
      });

      if (response.success && response.data) {
        console.log('JWT Token stored successfully');
        console.log('User Data:', response.data.person);
        router.replace('/(tabs)' as any)
      } else {
        Alert.alert('Login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'white',
      paddingTop:10,
      paddingBottom:3
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
      color: Colors.dark.text,
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
    passwordVisibilityToggle: {
      padding: 15,
      justifyContent: 'center',
      alignItems: 'center',
    },
    inputFocused: {
      borderColor: colors.tint,
      borderWidth: 2,
    },
    loginButton: {
      backgroundColor: '#4472C4',
      borderRadius: 8,
      padding: 15,
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 20,
    },
    loginButtonDisabled: {
      backgroundColor: colors.icon,
    },
    loginButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    linkContainer: {
      alignItems: 'center',
    },
    linkText: {
      color: '#000',
      fontSize: 16,
      textDecorationLine: 'underline',
    },
    forgotPassword: {
      textAlign: 'center',
      marginTop: 15,
      color: '#4472C4',
      fontSize: 14,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={dynamicStyles.container}
      >
        <ScrollView
          contentContainerStyle={dynamicStyles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* <Text style={dynamicStyles.title}>Share Jesus Today</Text> */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={{ width: 250, height: 220, resizeMode: 'contain' }}
            />
          </View>
          <Text style={dynamicStyles.subtitle}>Welcome back! {'\n'}Please sign in to continue.</Text>

          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.label}>Username</Text>
            <TextInput
              style={dynamicStyles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              placeholderTextColor={colors.icon}
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
                placeholderTextColor={colors.icon}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                style={dynamicStyles.passwordVisibilityToggle}
                onPress={togglePasswordVisibility}
                disabled={loading}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#000000"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              dynamicStyles.loginButton,
              loading && dynamicStyles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={dynamicStyles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.linkContainer}>
            <Text style={dynamicStyles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.linkContainer} onPress={() => router.push('/Signup')}>
            <Text style={dynamicStyles.linkText}>Do not have an account? Sign Up</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}