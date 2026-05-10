import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getStoredUser, getToken, clearAuth, AuthUser } from '../services/auth';

interface AuthContextType {
  user:        AuthUser | null;
  token:       string | null;
  isLoading:   boolean;
  isLoggedIn:  boolean;
  logout:      () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

// Create the context with a sensible default — the app will never
// actually use these defaults since AuthProvider wraps the whole app,
// but TypeScript needs them for type safety
const AuthContext = createContext<AuthContextType>({
  user:        null,
  token:       null,
  isLoading:   true,
  isLoggedIn:  false,
  logout:      async () => {},
  refreshAuth: async () => {},
});

// AuthProvider wraps the entire app and manages the logged-in state.
// On mount it checks SecureStore for a saved token — if one exists,
// the user stays logged in without needing to re-enter their password.
// This is the "remember me" behaviour users expect from mobile apps.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null);
  const [token,     setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshAuth() {
    try {
      const [savedToken, savedUser] = await Promise.all([
        getToken(),
        getStoredUser(),
      ]);
      setToken(savedToken);
      setUser(savedUser);
    } catch (err) {
      console.error('refreshAuth error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Check for existing credentials when the app first launches
    refreshAuth();
  }, []);

  async function logout() {
    await clearAuth();
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      isLoggedIn: !!token && !!user,
      logout,
      refreshAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — any component can call useAuth() to get the current
// user and auth functions without needing to import useContext and
// AuthContext separately. This is a common React pattern.
export function useAuth() {
  return useContext(AuthContext);
}