// Fixed SignupScreen.tsx
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import apiService from '@/services/apiService';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignupScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    city: '',
    country: '',
    state: '',
    zipCode: '',
    church: '',
    biography: '',
    gender: 'male', // default value
    dob: '',
  });
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { firstName, lastName, email } = formData;

    if (!firstName.trim() || firstName.length < 3) {
      Alert.alert('Error', 'First name must have at least 3 characters');
      return false;
    }

    if (!lastName.trim() || lastName.length < 3) {
      Alert.alert('Error', 'Last name must have at least 3 characters');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    // Ensure date is in YYYY-MM-DD format
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Format the data according to the API specification from Java code
      const signupData = {
        active: true,
        address: '',
        biography: formData.biography || '',
        church: formData.church || '',
        churchFrom: '', // Will be filled from radio buttons in full implementation
        city: formData.city || '',
        country: formData.country || '',
        dob: formatDate(formData.dob) || '',
        email: formData.email,
        firstName: formData.firstName,
        gender: formData.gender.toLowerCase(),
        lastName: formData.lastName,
        otp: 0,
        otpVerified: true,
        phone: '',
        state: formData.state || '',
        zipCode: formData.zipCode || '',
        howDidYouKnowAboutUs: '', // Will be filled from spinner
        otherSpecify: '', // Will be filled if "Other" is selected
      };

      console.log('Sending signup data:', signupData);

      const response = await apiService.signUp(signupData);

      if (response.success) {
        if (response.data && response.data.otp) {
          Alert.alert(
            'Success', 
            'Signup successful! OTP sent to your email.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Navigate to OTP verification screen
                  console.log('Navigate to OTP verification with email:', formData.email);
                  router.push(`/VerifyOtp?email=${formData.email}`);
                }
              }
            ]
          );
        } else {
          // Alert.alert('Success', 'Account created successfully! Please log in.');
          router.replace('/login');
        }
      } else {
        Alert.alert('Signup failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#4472C4',
      paddingTop:20,
      paddingBottom:20
    
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
    row: {
      flexDirection: 'row',
      gap: 10,
    },
    inputContainer: {
      marginBottom: 20,
      flex: 1,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      color: colors.text,
    },
    requiredLabel: {
      color: colors.text,
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
    inputFocused: {
      borderColor: colors.tint,
      borderWidth: 2,
    },
    signupButton: {
      backgroundColor: Colors.dark.tint,
      borderRadius: 8,
      padding: 15,
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 20,
    },
    signupButtonDisabled: {
      backgroundColor: colors.icon,
    },
    signupButtonText: {
      color: '#000',
      fontSize: 16,
      fontWeight: '600',
    },
    linkContainer: {
      alignItems: 'center',
    },
    linkText: {
      color: Colors.dark.text,
      fontSize: 16,
      textDecorationLine: 'underline',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginTop: 20,
      marginBottom: 10,
      color: colors.text,
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
          showsVerticalScrollIndicator={false}
        >
          <Text style={dynamicStyles.title}>Create Account</Text>
          <Text style={dynamicStyles.subtitle}>Join Share Jesus Today community</Text>

          <View style={dynamicStyles.row}>
            <View style={dynamicStyles.inputContainer}>
              <Text style={dynamicStyles.label}>
                First Name
              </Text>
              <TextInput
                style={dynamicStyles.input}
                value={formData.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
                placeholder="First name"
                placeholderTextColor={colors.icon}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            <View style={dynamicStyles.inputContainer}>
              <Text style={dynamicStyles.label}>
                Last Name
              </Text>
              <TextInput
                style={dynamicStyles.input}
                value={formData.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
                placeholder="Last name"
                placeholderTextColor={colors.icon}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>
          </View>

          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.label}>Email Address</Text>
            <TextInput
              style={dynamicStyles.input}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Enter your email"
              placeholderTextColor={colors.icon}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.label}>City</Text>
            <TextInput
              style={dynamicStyles.input}
              value={formData.city}
              onChangeText={(value) => handleInputChange('city', value)}
              placeholder="Your city"
              placeholderTextColor={colors.icon}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.label}>Country</Text>
            <TextInput
              style={dynamicStyles.input}
              value={formData.country}
              onChangeText={(value) => handleInputChange('country', value)}
              placeholder="Your country"
              placeholderTextColor={colors.icon}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={dynamicStyles.row}>
            <View style={dynamicStyles.inputContainer}>
              <Text style={dynamicStyles.label}>State</Text>
              <TextInput
                style={dynamicStyles.input}
                value={formData.state}
                onChangeText={(value) => handleInputChange('state', value)}
                placeholder="State"
                placeholderTextColor={colors.icon}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            <View style={dynamicStyles.inputContainer}>
              <Text style={dynamicStyles.label}>Zip Code</Text>
              <TextInput
                style={dynamicStyles.input}
                value={formData.zipCode}
                onChangeText={(value) => handleInputChange('zipCode', value)}
                placeholder="Zip code"
                placeholderTextColor={colors.icon}
                editable={!loading}
              />
            </View>
          </View>

          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.label}>Church</Text>
            <TextInput
              style={dynamicStyles.input}
              value={formData.church}
              onChangeText={(value) => handleInputChange('church', value)}
              placeholder="Your church"
              placeholderTextColor={colors.icon}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.label}>Biography</Text>
            <TextInput
              style={dynamicStyles.input}
              value={formData.biography}
              onChangeText={(value) => handleInputChange('biography', value)}
              placeholder="Tell us about yourself"
              placeholderTextColor={colors.icon}
              multiline
              numberOfLines={3}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[
              dynamicStyles.signupButton,
              loading && dynamicStyles.signupButtonDisabled,
            ]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={dynamicStyles.signupButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.linkContainer} onPress={() => router.push('/login')}>
            <Text style={dynamicStyles.linkText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ALSO UPDATE YOUR apiService.ts - Add this method:

// In your apiService.ts, replace the existing signUp method with:
/*
  // User Registration Methods - Updated to match Android implementation
  async signUp(userData: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/person/sign-up', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Keep the register method for backward compatibility but point to correct endpoint
  async register(userData: any): Promise<ApiResponse<any>> {
    return this.signUp(userData);
  }
*/