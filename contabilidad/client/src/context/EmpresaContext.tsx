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
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaId, setEmpresaIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    api
      .get<Empresa[]>('/empresas')
      .then((lista) => setEmpresas(lista))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
