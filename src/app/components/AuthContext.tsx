import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('roomie_user');
    if (savedUser) {
      setState({ user: JSON.parse(savedUser), isAuthenticated: true, isLoading: false });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, pass: string) => {
    // Simulate API call
    const mockUser: User = {
      id: 'u1',
      name: 'Dammy',
      email: email,
      role: 'roommate',
      lifestyleTags: ['Quiet', 'Clean', 'WFH'],
    };
    localStorage.setItem('roomie_user', JSON.stringify(mockUser));
    setState({ user: mockUser, isAuthenticated: true, isLoading: false });
  };

  const logout = () => {
    localStorage.removeItem('roomie_user');
    setState({ user: null, isAuthenticated: false, isLoading: false });
  };

  const updateUser = (userData: Partial<User>) => {
    if (!state.user) return;
    const updated = { ...state.user, ...userData };
    localStorage.setItem('roomie_user', JSON.stringify(updated));
    setState(prev => ({ ...prev, user: updated }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};