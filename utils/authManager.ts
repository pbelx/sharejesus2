// utils/authManager.ts - Centralized Authentication Manager
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthManager {
  private static instance: AuthManager;
  private authToken: string | null = null;
  private listeners: ((token: string | null) => void)[] = [];

  private constructor() {}

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  // Initialize from AsyncStorage
  async initialize(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        this.authToken = token;
        console.log('🔑 AuthManager: Token initialized from storage');
        this.notifyListeners(token);
      }
    } catch (error) {
      console.error('❌ AuthManager: Failed to initialize token:', error);
    }
  }

  // Set auth token and notify all services
  async setAuthToken(token: string): Promise<void> {
    try {
      this.authToken = token;
      await AsyncStorage.setItem('authToken', token);
      console.log('✅ AuthManager: Token stored and services notified');
      this.notifyListeners(token);
    } catch (error) {
      console.error('❌ AuthManager: Failed to store token:', error);
      throw error;
    }
  }

  // Get current auth token
  getAuthToken(): string | null {
    return this.authToken;
  }

  // Clear auth token and notify all services
  async clearAuthToken(): Promise<void> {
    try {
      this.authToken = null;
      await AsyncStorage.removeItem('authToken');
      console.log('🗑️ AuthManager: Token cleared and services notified');
      this.notifyListeners(null);
    } catch (error) {
      console.error('❌ AuthManager: Failed to clear token:', error);
    }
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return this.authToken !== null && this.authToken.length > 0;
  }

  // Subscribe to auth token changes
  subscribe(listener: (token: string | null) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all subscribers of token changes
  private notifyListeners(token: string | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(token);
      } catch (error) {
        console.error('❌ AuthManager: Listener error:', error);
      }
    });
  }

  // Debug method to check auth status
  async debugAuthStatus(): Promise<void> {
    console.log('🔍 AuthManager Debug Status:');
    console.log('  Memory Token:', this.authToken ? 'Present' : 'Missing');
    
    try {
      const storageToken = await AsyncStorage.getItem('authToken');
      console.log('  Storage Token:', storageToken ? 'Present' : 'Missing');
      console.log('  Tokens Match:', this.authToken === storageToken);
      console.log('  Is Authenticated:', this.isAuthenticated());
      console.log('  Active Listeners:', this.listeners.length);
    } catch (error) {
      console.error('  Storage Error:', error);
    }
  }
}

export default AuthManager.getInstance();