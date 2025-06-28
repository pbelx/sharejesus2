// app/VerifyOtp.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Clipboard,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TextInput
} from 'react-native';
import apiService from '../services/apiService';

const { width } = Dimensions.get('window');

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  useEffect(() => {
    // Focus first input on mount
    setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0]?.focus();
      }
    }, 100);
    
    // If no email, go back
    if (!email) {
      router.back();
    }
  }, [email, router]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    // Handle backspace
    if (key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current field is empty, clear previous field and focus it
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else if (otp[index]) {
        // If current field has value, just clear it
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardContent = await Clipboard.getString();
      
      // Validate pasted data (should be 5 digits)
      if (!/^\d{5}$/.test(clipboardContent)) {
        Alert.alert('Invalid OTP', 'Please paste a valid 5-digit OTP');
        return;
      }

      // Distribute digits across inputs
      const newOtp = clipboardContent.split('');
      setOtp(newOtp);
      
      // Focus last input
      inputRefs.current[4]?.focus();
      
      setSuccess('OTP pasted successfully');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to paste from clipboard');
    }
  };

  const verifyOtp = async () => {
    const enteredOtp = otp.join('');
    
    if (enteredOtp.length !== 5) {
      setError('Please enter a 5-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Verifying OTP for email:', email, 'OTP:', enteredOtp);
      
      const response = await apiService.verifyOtp(email!, enteredOtp);

      console.log('OTP verification response:', response);

      if (response.success) {
        setSuccess('Email verified successfully!');
        setTimeout(() => {
          // Navigate to create password screen using Expo Router
          router.push(`/CreatePassword?email=${encodeURIComponent(email!)}`);
        }, 1500);
      } else {
        setError(response.error || 'Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Use API service for resending OTP
      const response = await apiService.post('/person/sign-up/resend-otp', { email });
      
      if (response.success) {
        Alert.alert('Success', 'OTP resent successfully!');
        setSuccess('OTP resent successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // ... rest of your component styles and render method
  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Your existing JSX with the updated navigation logic */}
    </KeyboardAvoidingView>
  );
};

// Add your existing styles here
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  // Your existing styles
});

export default OTPVerification;