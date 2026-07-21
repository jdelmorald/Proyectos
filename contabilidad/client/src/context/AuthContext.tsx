import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, getToken, setToken } from '../api/client';

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'operador';
  cedula: string | null;
  cargo: string | null;
  fotoDataUrl: string | null;
  empresaPrincipalId: number | null;
  empresaPrincipalNombre: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  actualizarPerfil: (datos: { nombre?: string; cedula?: string | null; cargo?: string | null; fotoDataUrl?: string | null }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api
      .get<{ user: AuthUser }>('/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const r = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password });
    setToken(r.token);
    setUser(r.user);
  }

  function logout() {
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }

  async function actualizarPerfil(datos: { nombre?: string; cedula?: string | null; cargo?: string | null; fotoDataUrl?: string | null }) {
    const r = await api.put<{ user: AuthUser }>('/auth/perfil', datos);
    setUser(r.user);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout, actualizarPerfil }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
