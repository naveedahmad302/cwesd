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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user and token from storage on app start
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
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
    setToken(authToken);
    setUser({
      id: userData._id,
      name: userData.name,
      role: userData.role,
      email: userData.email,
      picture: userData.picture
    });
    
    // Save to storage
    await AsyncStorage.setItem('token', authToken);
    await AsyncStorage.setItem('user', JSON.stringify({
      id: userData._id,
      name: userData.name,
      role: userData.role,
      email: userData.email,
      picture: userData.picture
    }));
    
    // Set auth header on centralized instance
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    return { success: true, user: userData };
    
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

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
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
