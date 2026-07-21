import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

export interface Empresa {
  id: number;
  nombre: string;
  rif: string | null;
  moneda: string;
  municipio: string | null;
  alicuota_municipal: number;
  valor_ut: number;
  logo_data_url: string | null;
  color: string;
}

interface EmpresaContextValue {
  empresas: Empresa[];
  empresaId: number | null;
  empresa: Empresa | null;
  setEmpresaId: (id: number) => void;
  loading: boolean;
}

const EmpresaContext = createContext<EmpresaContextValue | undefined>(undefined);
const STORAGE_KEY = 'contabilidad_empresa_id';

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaId, setEmpresaIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mientras AuthContext todavía está confirmando la sesión (p.ej. justo tras
    // recargar la página), `user` pasa por null antes de resolverse al usuario
    // real. Si tratáramos ese null transitorio como "no hay sesión" aquí,
    // `loading` bajaría a false con `empresas` todavía vacío, y RequireEmpresa
    // mandaría al usuario de vuelta a elegir empresa aunque sí tuviera una
    // seleccionada — hay que esperar a que AuthContext termine primero.
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setEmpresas([]);
      return;
    }
    setLoading(true);
    api
      .get<Empresa[]>('/empresas')
      .then((lista) => setEmpresas(lista))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  function setEmpresaId(id: number) {
    setEmpresaIdState(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  }

  const empresa = empresas.find((e) => e.id === empresaId) ?? null;

  return (
    <EmpresaContext.Provider value={{ empresas, empresaId, empresa, setEmpresaId, loading }}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa(): EmpresaContextValue {
  const ctx = useContext(EmpresaContext);
  if (!ctx) throw new Error('useEmpresa debe usarse dentro de EmpresaProvider');
  return ctx;
}
