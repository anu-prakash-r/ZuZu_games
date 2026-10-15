import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearAuth,
  loadAuth,
  loginRequest,
  saveAuth,
  type AuthUser,
  type PermittedLocation,
} from "@/api/auth";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  locations: PermittedLocation[];
  /** True while the persisted session is being restored on app start. */
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [locations, setLocations] = useState<PermittedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await loadAuth();
      if (stored) {
        setToken(stored.token);
        setUser(stored.user);
        setLocations(stored.locations);
      }
      setIsLoading(false);
    })();
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const session = await loginRequest(username, password);
    await saveAuth({
      token: session.token,
      user: session.user,
      locations: session.locations,
    });
    setToken(session.token);
    setUser(session.user);
    setLocations(session.locations);
  }, []);

  const signOut = useCallback(async () => {
    await clearAuth();
    setToken(null);
    setUser(null);
    setLocations([]);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      locations,
      isLoading,
      isAuthenticated: !!token && !!user,
      signIn,
      signOut,
    }),
    [user, token, locations, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
