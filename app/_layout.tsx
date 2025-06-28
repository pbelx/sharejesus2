// app/_layout.tsx
import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar 
        style="dark" 
        backgroundColor="white" // CHANGED: From transparent to white to prevent overlap
        translucent={false} // CHANGED: From true to false to prevent content overlap
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { 
            backgroundColor: '#fff', // CHANGED: From #f8f9fa to #fff for consistency
            paddingTop: 0 // ADDED: Ensure no extra top padding
          }
        }}
      />
    </SafeAreaProvider>
  );
}