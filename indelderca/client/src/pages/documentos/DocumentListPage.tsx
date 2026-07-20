import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { getDocumentType } from '../../config/documentTypes';

interface DocumentoResumen {
  id: number;
  numero: string;
  numeroControl: string | null;
  fecha: string;
  estado: 'borrador' | 'emitido' | 'anulado';
  total: number;
  contactoNombre: string | null;
}

const ESTADO_BADGE: Record<string, string> = {
  emitido: 'bg-emerald-100 text-emerald-700',
  anulado: 'bg-red-100 text-red-700',
  borrador: 'bg-slate-100 text-slate-600',
};

export default function DocumentListPage() {
  const { tipo } = useParams<{ tipo: string }>();
  const navigate = useNavigate();
  const config = tipo ? getDocumentType(tipo) : undefined;
  const [items, setItems] = useState<DocumentoResumen[]>([]);
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('');
  const [loading, setLoading] = useState(true);

  async function cargar() {
    if (!tipo) return;
    setLoading(true);
    const params = new URLSearchParams({ tipo });
    if (q) params.set('q', q);
    if (estado) params.set('estado', estado);
    const data = await api.get<DocumentoResumen[]>(`/documentos?${params.toString()}`);
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, estado]);

  if (!config) return <div className="p-6 text-red-600">Tipo de documento no encontrado.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{config.labelPlural}</h1>
          {config.fiscal && <div className="text-xs text-amber-600 font-medium">Documento fiscal</div>}
        </div>
        <button
          onClick={() => navigate(`/documentos/${tipo}/nuevo`)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          + Generar {config.label}
        </button>
      </div>

      <div className="flex gap-3 mb-3">
        <input
          placeholder="Buscar por número o contacto..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 w-full max-w-xs"
        />
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2">
          <option value="">Todos los estados</option>
          <option value="emitido">Emitido</option>
          <option value="anulado">Anulado</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">N°</th>
              {config.fiscal && <th className="px-4 py-2">N° Control</th>}
              <th className="px-4 py-2">Fecha</th>
              {config.contraparte !== 'ninguno' && config.contraparte !== 'interno' && (
                <th className="px-4 py-2">{config.contraparte === 'cliente' ? 'Cliente' : 'Proveedor'}</th>
              )}
              {config.itemsConPrecio && <th className="px-4 py-2">Total</th>}
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-700">{d.numero}</td>
                {config.fiscal && <td className="px-4 py-2">{d.numeroControl}</td>}
                <td className="px-4 py-2">{d.fecha}</td>
                {config.contraparte !== 'ninguno' && config.contraparte !== 'interno' && (
                  <td className="px-4 py-2">{d.contactoNombre}</td>
                )}
                {config.itemsConPrecio && <td className="px-4 py-2">{d.total?.toFixed(2)}</td>}
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[d.estado]}`}>{d.estado}</span>
                </td>
                <td className="px-4 py-2 text-right space-x-3">
                  <Link to={`/documentos/${tipo}/${d.id}`} className="text-brand-700 hover:underline">
                    Ver
                  </Link>
                  <Link to={`/documentos/${tipo}/${d.id}/imprimir`} target="_blank" className="text-slate-600 hover:underline">
                    Imprimir
                  </Link>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Aún no hay {config.labelPlural.toLowerCase()} registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
