import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';
import BotonesExportar from '../components/BotonesExportar';

interface Asiento {
  id: number;
  numero: string;
  fecha: string;
  tipo: string;
  descripcion: string | null;
  estado: 'registrado' | 'anulado';
  lineas: { debe: number; haber: number }[];
}

export default function AsientosListPage() {
  const { empresaId, empresa } = useEmpresa();
  const [items, setItems] = useState<Asiento[]>([]);
  const [q, setQ] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  async function cargar() {
    if (!empresaId) return;
    const params = new URLSearchParams({ empresaId: String(empresaId) });
    if (q) params.set('q', q);
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    setItems(await api.get<Asiento[]>(`/asientos?${params.toString()}`));
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, desde, hasta]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Libro Diario</h1>
        <Link to="/asientos/nuevo" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">
          + Registrar Asiento
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-3">
          <input placeholder="Buscar por número o descripción..." value={q} onChange={(e) => setQ(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 w-full max-w-xs" />
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2" />
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2" />
        </div>
        <BotonesExportar
          empresa={empresa}
          titulo="Libro Diario"
          subtitulo={desde || hasta ? `Del ${desde || '...'} al ${hasta || '...'}` : undefined}
          nombreArchivo="libro-diario"
          columnas={[
            { header: 'N°', key: 'numero' },
            { header: 'Fecha', key: 'fecha' },
            { header: 'Descripción', key: 'descripcion' },
            { header: 'Monto', key: 'monto', align: 'right' },
            { header: 'Estado', key: 'estado' },
          ]}
          filas={items.map((a) => ({
            numero: a.numero,
            fecha: a.fecha,
            descripcion: a.descripcion || '',
            monto: a.lineas.reduce((s, l) => s + l.debe, 0),
            estado: a.estado,
          }))}
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">N°</th>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Descripción</th>
              <th className="px-4 py-2 text-right">Monto</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => {
              const monto = a.lineas.reduce((s, l) => s + l.debe, 0);
              return (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-700">{a.numero}</td>
                  <td className="px-4 py-2">{a.fecha}</td>
                  <td className="px-4 py-2">{a.descripcion}</td>
                  <td className="px-4 py-2 text-right">{monto.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.estado === 'anulado' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {a.estado}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link to={`/asientos/${a.id}`} className="text-brand-700 hover:underline">Ver</Link>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">Sin asientos registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
