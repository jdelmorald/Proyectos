import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { DOCUMENT_TYPES } from '../config/documentTypes';
import { useAuth } from '../context/AuthContext';

interface Correlativo {
  tipo: string;
  prefijo: string;
  siguiente_numero: number;
  digitos: number;
  reinicio_anual: number;
  anio_actual: number | null;
  prefijo_control: string;
  siguiente_control: number;
  digitos_control: number;
}

export default function CorrelativosPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Correlativo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);

  async function cargar() {
    setItems(await api.get<Correlativo[]>('/correlativos'));
  }

  useEffect(() => {
    cargar();
  }, []);

  async function guardar(tipo: string, cambios: Partial<Correlativo>) {
    setError(null);
    try {
      await api.put(`/correlativos/${tipo}`, {
        prefijo: cambios.prefijo,
        siguienteNumero: cambios.siguiente_numero,
        digitos: cambios.digitos,
        reinicioAnual: !!cambios.reinicio_anual,
        prefijoControl: cambios.prefijo_control,
        siguienteControl: cambios.siguiente_control,
        digitosControl: cambios.digitos_control,
      });
      setEditando(null);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar');
    }
  }

  const label = (tipo: string) => DOCUMENT_TYPES.find((t) => t.key === tipo)?.label ?? tipo;
  const esFiscal = (tipo: string) => DOCUMENT_TYPES.find((t) => t.key === tipo)?.numeroControl ?? false;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Correlativos</h1>
      <p className="text-slate-500 mb-6 text-sm">
        Numeración automática de cada tipo de documento. El próximo número mostrado es el que se asignará al
        siguiente documento generado.{' '}
        {user?.rol !== 'admin' && 'Solo un administrador puede modificar esta configuración.'}
      </p>
      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Documento</th>
              <th className="px-4 py-2">Prefijo</th>
              <th className="px-4 py-2">Próximo N°</th>
              <th className="px-4 py-2">Dígitos</th>
              <th className="px-4 py-2">Reinicia c/año</th>
              <th className="px-4 py-2">N° Control</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <FilaCorrelativo
                key={c.tipo}
                c={c}
                label={label(c.tipo)}
                fiscal={esFiscal(c.tipo)}
                puedeEditar={user?.rol === 'admin'}
                editando={editando === c.tipo}
                onEditar={() => setEditando(c.tipo)}
                onCancelar={() => setEditando(null)}
                onGuardar={(cambios) => guardar(c.tipo, cambios)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilaCorrelativo({
  c,
  label,
  fiscal,
  puedeEditar,
  editando,
  onEditar,
  onCancelar,
  onGuardar,
}: {
  c: Correlativo;
  label: string;
  fiscal: boolean;
  puedeEditar: boolean;
  editando: boolean;
  onEditar: () => void;
  onCancelar: () => void;
  onGuardar: (c: Partial<Correlativo>) => void;
}) {
  const [local, setLocal] = useState(c);

  useEffect(() => setLocal(c), [c]);

  if (!editando) {
    return (
      <tr className="border-t border-slate-100">
        <td className="px-4 py-2 font-medium text-slate-700">{label}</td>
        <td className="px-4 py-2">{c.prefijo}</td>
        <td className="px-4 py-2">
          {c.prefijo}-{c.anio_actual}-{String(c.siguiente_numero).padStart(c.digitos, '0')}
        </td>
        <td className="px-4 py-2">{c.digitos}</td>
        <td className="px-4 py-2">{c.reinicio_anual ? 'Sí' : 'No'}</td>
        <td className="px-4 py-2">
          {fiscal ? `${c.prefijo_control}-${String(c.siguiente_control).padStart(c.digitos_control, '0')}` : '—'}
        </td>
        <td className="px-4 py-2 text-right">
          {puedeEditar && (
            <button onClick={onEditar} className="text-brand-700 hover:underline">
              Editar
            </button>
          )}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-slate-100 bg-slate-50">
      <td className="px-4 py-2 font-medium text-slate-700">{label}</td>
      <td className="px-4 py-2">
        <input
          className="w-20 rounded border border-slate-300 px-2 py-1"
          value={local.prefijo}
          onChange={(e) => setLocal({ ...local, prefijo: e.target.value })}
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          className="w-24 rounded border border-slate-300 px-2 py-1"
          value={local.siguiente_numero}
          onChange={(e) => setLocal({ ...local, siguiente_numero: Number(e.target.value) })}
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          className="w-16 rounded border border-slate-300 px-2 py-1"
          value={local.digitos}
          onChange={(e) => setLocal({ ...local, digitos: Number(e.target.value) })}
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="checkbox"
          checked={!!local.reinicio_anual}
          onChange={(e) => setLocal({ ...local, reinicio_anual: e.target.checked ? 1 : 0 })}
        />
      </td>
      <td className="px-4 py-2">
        {fiscal && (
          <input
            type="number"
            className="w-24 rounded border border-slate-300 px-2 py-1"
            value={local.siguiente_control}
            onChange={(e) => setLocal({ ...local, siguiente_control: Number(e.target.value) })}
          />
        )}
      </td>
      <td className="px-4 py-2 text-right space-x-2">
        <button onClick={() => onGuardar(local)} className="text-emerald-700 hover:underline">
          Guardar
        </button>
        <button onClick={onCancelar} className="text-slate-500 hover:underline">
          Cancelar
        </button>
      </td>
    </tr>
  );
}
