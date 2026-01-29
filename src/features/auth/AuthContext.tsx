import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { apiClient, authAPI } from '../../services/api';

type User = {
  id: string;
  name: string;
  role: 'student' | 'teacher';
  email: string;
  picture?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  recentChatUsers: string[];
  addRecentChatUser: (userId: string) => void;
  clearRecentChatUsers: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentChatUsers, setRecentChatUsers] = useState<string[]>([]);

  // Load user and token from storage on app start
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          
          // Parse stored user data
          let userData = JSON.parse(storedUser);
          
          // Handle legacy data format - if user has _id instead of id, transform it
          if (userData._id && !userData.id) {
            console.log('🔄 Migrating legacy user data format');
            userData = {
              id: userData._id,
              name: userData.name,
              role: userData.role,
              email: userData.email,
              picture: userData.picture
            };
            
            // Save the transformed data back to storage
            await AsyncStorage.setItem('user', JSON.stringify(userData));
          }
          
          setUser(userData);
          // Set auth header on centralized instance
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (error) {
        console.error('Failed to load auth data', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthData();
  }, []);

 const login = async (email: string, password: string) => {
  try {
    console.log('Attempting to login with:', { email });
    const response = await authAPI.login(email, password);

    console.log('Login response:', response.data);
    const { accessToken: authToken, user: userData } = response.data;

    if (!authToken || !userData) {
      throw new Error('Invalid response from server: Missing token or user data');
    }

    // Save to state
    const transformedUser = {
      id: userData._id,
      name: userData.name,
      role: userData.role,
      email: userData.email,
      picture: userData.picture
    };
    setToken(authToken);
    setUser(transformedUser);
    
    // Save to storage - store the transformed user data for consistency
    await AsyncStorage.setItem('token', authToken);
    await AsyncStorage.setItem('user', JSON.stringify(transformedUser));
    
    // Set auth header on centralized instance
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Login failed with status:', error.response?.status);
      console.error('Error response data:', error.response?.data);
      console.error('Error config:', {
        url: error.config?.url,
        method: error.config?.method
      });
    }
    console.error('Login error:', error);
    throw error;
  }
};

  const logout = async () => {
    try {
      // Call logout API endpoint
      await authAPI.logout();
      
      // Clear state
      setToken(null);
      setUser(null);
      
      // Clear storage
      await AsyncStorage.multiRemove(['token', 'user']);
      
      // Clear auth header from centralized instance
      delete apiClient.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Failed to logout', error);
      // Even if API call fails, still clear local data
      setToken(null);
      setUser(null);
      await AsyncStorage.multiRemove(['token', 'user']);
      delete apiClient.defaults.headers.common['Authorization'];
      throw error;
    }
  };

  const addRecentChatUser = (userId: string) => {
    setRecentChatUsers(prev => {
      if (!prev.includes(userId)) {
        const updated = [userId, ...prev];
        console.log('Added recent chat user:', userId);
        return updated.slice(0, 10); // Keep only last 10
      }
      return prev;
    });
  };

  const clearRecentChatUsers = () => {
    setRecentChatUsers([]);
    console.log('Cleared recent chat users');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, recentChatUsers, addRecentChatUser, clearRecentChatUsers }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
