import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';
import BotonesExportar from '../components/BotonesExportar';
import { formatearMonto } from '../utils/formato';

interface Asiento {
  id: number;
  numero: string;
  fecha: string;
  tipo: string;
  descripcion: string | null;
  estado: 'registrado' | 'anulado';
  lineas: { debe: number; haber: number }[];
}

interface LineaLibroDiario {
  asientoId: number;
  numero: string;
  fecha: string;
  estado: 'registrado' | 'anulado';
  glosa: string | null;
  cuentaCodigo: string;
  cuentaNombre: string;
  debe: number;
  haber: number;
  esPrimeraLinea: boolean;
}

interface LibroDiarioResponse {
  lineas: LineaLibroDiario[];
  totalDebe: number;
  totalHaber: number;
  totalAsientos: number;
}

/**
 * Convierte las líneas planas del libro diario (una fila por línea de asiento)
 * en las filas que espera el exportador: la cuenta acreedora se indenta como
 * en un libro diario real (Debe a la izquierda, Haber indentado), y cada
 * asiento cierra con una fila de glosa explicando el movimiento.
 */
function construirFilasLibroDiario(lineas: LineaLibroDiario[]) {
  const filas: any[] = [];
  lineas.forEach((l, i) => {
    const anulado = l.estado === 'anulado';
    filas.push({
      fecha: l.esPrimeraLinea ? l.fecha : '',
      numero: l.esPrimeraLinea ? l.numero : '',
      cuenta: l.haber > 0 ? `      ${l.cuentaCodigo} — ${l.cuentaNombre}` : `${l.cuentaCodigo} — ${l.cuentaNombre}`,
      debe: l.debe > 0 ? l.debe : '',
      haber: l.haber > 0 ? l.haber : '',
      _estilo: anulado ? 'anulado' : undefined,
    });
    const siguiente = lineas[i + 1];
    if (!siguiente || siguiente.asientoId !== l.asientoId) {
      filas.push({
        fecha: '',
        numero: '',
        cuenta: `${l.glosa || 'Sin glosa'}${anulado ? '  —  ASIENTO ANULADO' : ''}`,
        debe: '',
        haber: '',
        _estilo: anulado ? 'anulado' : 'glosa',
      });
    }
  });
  return filas;
}

export default function AsientosListPage() {
  const { empresaId, empresa } = useEmpresa();
  const [items, setItems] = useState<Asiento[]>([]);
  const [q, setQ] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [libroDiario, setLibroDiario] = useState<LibroDiarioResponse | null>(null);

  async function cargar() {
    if (!empresaId) return;
    const params = new URLSearchParams({ empresaId: String(empresaId) });
    if (q) params.set('q', q);
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    setItems(await api.get<Asiento[]>(`/asientos?${params.toString()}`));
  }

  async function cargarLibroDiario() {
    if (!empresaId) return;
    // El Libro Diario exportado es el registro cronológico completo del
    // periodo (solo se filtra por fecha, no por el buscador de texto): es
    // el documento formal, no una vista de búsqueda.
    const params = new URLSearchParams({ empresaId: String(empresaId) });
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    setLibroDiario(await api.get<LibroDiarioResponse>(`/reportes/libro-diario?${params.toString()}`));
  }

  useEffect(() => {
    cargar();
    cargarLibroDiario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, desde, hasta]);

  useEffect(() => {
    cargarLibroDiario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desde, hasta]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-display font-semibold text-slate-800">Libro Diario</h1>
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
        {libroDiario && (
          <BotonesExportar
            empresa={empresa}
            titulo="Libro Diario"
            subtitulo={desde || hasta ? `Del ${desde || '...'} al ${hasta || '...'}` : undefined}
            nombreArchivo="libro-diario"
            columnas={[
              { header: 'Fecha', key: 'fecha' },
              { header: 'N°', key: 'numero' },
              { header: 'Cuenta', key: 'cuenta' },
              { header: 'Debe', key: 'debe', align: 'right' },
              { header: 'Haber', key: 'haber', align: 'right' },
            ]}
            filas={construirFilasLibroDiario(libroDiario.lineas)}
            filaTotales={{ fecha: '', numero: '', cuenta: `Totales (${libroDiario.totalAsientos} asientos)`, debe: libroDiario.totalDebe, haber: libroDiario.totalHaber }}
          />
        )}
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
                  <td className="px-4 py-2 text-right">{formatearMonto(monto)}</td>
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
