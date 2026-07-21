import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';
import BotonesExportar from '../components/BotonesExportar';
import { formatearMonto } from '../utils/formato';

interface Cuenta {
  id: number;
  codigo: string;
  nombre: string;
  permite_movimiento: number;
}

interface Movimiento {
  numero: string;
  fecha: string;
  descripcion: string | null;
  debe: number;
  haber: number;
  saldo: number;
}

export default function LibroMayorPage() {
  const { empresaId, empresa } = useEmpresa();
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [cuentaId, setCuentaId] = useState<number | ''>('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [datos, setDatos] = useState<{ cuenta: any; movimientos: Movimiento[]; saldoFinal: number } | null>(null);

  useEffect(() => {
    if (!empresaId) return;
    api.get<Cuenta[]>(`/plan-cuentas?empresaId=${empresaId}`).then((c) => setCuentas(c.filter((x) => x.permite_movimiento)));
  }, [empresaId]);

  useEffect(() => {
    if (!cuentaId) { setDatos(null); return; }
    const params = new URLSearchParams();
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    api.get<typeof datos>(`/reportes/libro-mayor/${cuentaId}?${params.toString()}`).then(setDatos);
  }, [cuentaId, desde, hasta]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Libro Mayor</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <select value={cuentaId} onChange={(e) => setCuentaId(e.target.value ? Number(e.target.value) : '')} className="rounded-md border border-slate-300 px-3 py-2 w-full max-w-sm">
          <option value="">-- Seleccionar cuenta --</option>
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
          ))}
        </select>
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2" />
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2" />
      </div>

      {datos && (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-600">
              <span className="font-semibold">{datos.cuenta.codigo} — {datos.cuenta.nombre}</span>
              <span className="ml-2 text-slate-400">({datos.cuenta.naturaleza})</span>
            </div>
            <BotonesExportar
              empresa={empresa}
              titulo={`Libro Mayor — ${datos.cuenta.codigo} ${datos.cuenta.nombre}`}
              subtitulo={desde || hasta ? `Del ${desde || '...'} al ${hasta || '...'}` : undefined}
              nombreArchivo={`libro-mayor-${datos.cuenta.codigo}`}
              columnas={[
                { header: 'N° Asiento', key: 'numero' },
                { header: 'Fecha', key: 'fecha' },
                { header: 'Descripción', key: 'descripcion' },
                { header: 'Debe', key: 'debe', align: 'right' },
                { header: 'Haber', key: 'haber', align: 'right' },
                { header: 'Saldo', key: 'saldo', align: 'right' },
              ]}
              filas={datos.movimientos}
              filaTotales={{ numero: '', fecha: '', descripcion: 'Saldo final', saldo: datos.saldoFinal }}
            />
          </div>
          <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-2">N° Asiento</th>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Descripción</th>
                  <th className="px-4 py-2 text-right">Debe</th>
                  <th className="px-4 py-2 text-right">Haber</th>
                  <th className="px-4 py-2 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {datos.movimientos.map((m, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-2">{m.numero}</td>
                    <td className="px-4 py-2">{m.fecha}</td>
                    <td className="px-4 py-2 text-slate-500">{m.descripcion}</td>
                    <td className="px-4 py-2 text-right">{m.debe > 0 ? formatearMonto(m.debe) : ''}</td>
                    <td className="px-4 py-2 text-right">{m.haber > 0 ? formatearMonto(m.haber) : ''}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatearMonto(m.saldo)}</td>
                  </tr>
                ))}
                {datos.movimientos.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Sin movimientos en el periodo</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-800 font-bold">
                  <td className="px-4 py-2" colSpan={5}>Saldo final</td>
                  <td className="px-4 py-2 text-right">{formatearMonto(datos.saldoFinal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
