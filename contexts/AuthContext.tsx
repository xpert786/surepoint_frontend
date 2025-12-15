'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthChange, getUserData } from '@/lib/firebase/auth';
import { User } from '@/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role?: 'client' | 'coo' | 'admin', clientId?: string) => Promise<void>;
  logOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (!isMounted) return;
      
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const data = await getUserData(firebaseUser.uid);
          if (isMounted) {
            setUserData(data);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          if (isMounted) {
            setUserData(null);
          }
        }
      } else {
        setUserData(null);
      }
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Check payment status when user data changes
  // Only run on client side to avoid hydration mismatch
  useEffect(() => {
    // Ensure we're on client side
    if (typeof window === 'undefined') return;
    
    if (userData) {
      const currentPath = window.location.pathname;
      
      // If user is on login page and already authenticated, redirect based on billing status
      if (currentPath === '/login' && userData) {
        const billingStatus = userData.billing?.status || userData.paymentStatus;
        if (billingStatus === 'active' || billingStatus === 'paid') {
          window.location.href = '/dashboard';
        } else {
          window.location.href = '/payment';
        }
      }
    }
  }, [userData]);

  const signIn = async (email: string, password: string) => {
    const { signIn: firebaseSignIn } = await import('@/lib/firebase/auth');
    await firebaseSignIn(email, password);
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: 'client' | 'coo' | 'admin' = 'client',
    clientId?: string
  ) => {
    const { signUp: firebaseSignUp } = await import('@/lib/firebase/auth');
    await firebaseSignUp(email, password, name, role, clientId);
  };

  const logOut = async () => {
    const { logOut: firebaseLogOut } = await import('@/lib/firebase/auth');
    await firebaseLogOut();
  };

  const refreshUserData = async () => {
    if (user) {
      const { getUserData } = await import('@/lib/firebase/auth');
      const data = await getUserData(user.uid);
      setUserData(data);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signIn, signUp, logOut, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

