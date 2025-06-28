import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { homeStyles } from '../../styles/HomeStyles';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={homeStyles.container}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={homeStyles.sectionTitle}>Profile</Text>
        <Text style={{ textAlign: 'center', color: '#666', marginTop: 10 }}>
          Manage your profile and view your activity
        </Text>
      </View>
    </SafeAreaView>
  );
}