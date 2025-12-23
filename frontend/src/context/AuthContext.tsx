import React, { createContext } from 'react';

interface AuthContextType {
  user: any;
  role: string | null;
  signIn: (token: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  signIn: async () => {},
  signOut: async () => {},
});

