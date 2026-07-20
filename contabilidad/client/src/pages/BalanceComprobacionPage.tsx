import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';
import BotonesExportar from '../components/BotonesExportar';

interface CuentaBalance {
  id: number;
  codigo: string;
  nombre: string;
  totalDebe: number;
  totalHaber: number;
  saldoDeudor: number;
  saldoAcreedor: number;
}

export default function BalanceComprobacionPage() {
  const { empresaId, empresa } = useEmpresa();
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [datos, setDatos] = useState<{ cuentas: CuentaBalance[]; totales: any } | null>(null);

  useEffect(() => {
    if (!empresaId) return;
    const params = new URLSearchParams({ empresaId: String(empresaId) });
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    api.get<typeof datos>(`/reportes/balance-comprobacion?${params.toString()}`).then(setDatos);
  }, [empresaId, desde, hasta]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Balance de Comprobación</h1>
      <p className="text-sm text-slate-500 mb-4">{empresa?.nombre}</p>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-3">
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2" />
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2" />
        </div>
        {datos && (
          <BotonesExportar
            empresa={empresa}
            titulo="Balance de Comprobación"
            subtitulo={desde || hasta ? `Del ${desde || '...'} al ${hasta || '...'}` : undefined}
            nombreArchivo="balance-comprobacion"
            columnas={[
              { header: 'Código', key: 'codigo' },
              { header: 'Cuenta', key: 'nombre' },
              { header: 'Total Debe', key: 'totalDebe', align: 'right' },
              { header: 'Total Haber', key: 'totalHaber', align: 'right' },
              { header: 'Saldo Deudor', key: 'saldoDeudor', align: 'right' },
              { header: 'Saldo Acreedor', key: 'saldoAcreedor', align: 'right' },
            ]}
            filas={datos.cuentas}
            filaTotales={{ codigo: '', nombre: 'Totales', ...datos.totales }}
          />
        )}
      </div>

      {datos && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2">Código</th>
                <th className="px-4 py-2">Cuenta</th>
                <th className="px-4 py-2 text-right">Total Debe</th>
                <th className="px-4 py-2 text-right">Total Haber</th>
                <th className="px-4 py-2 text-right">Saldo Deudor</th>
                <th className="px-4 py-2 text-right">Saldo Acreedor</th>
              </tr>
            </thead>
            <tbody>
              {datos.cuentas.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-mono text-xs">{c.codigo}</td>
                  <td className="px-4 py-2">{c.nombre}</td>
                  <td className="px-4 py-2 text-right">{c.totalDebe.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{c.totalHaber.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{c.saldoDeudor > 0 ? c.saldoDeudor.toFixed(2) : ''}</td>
                  <td className="px-4 py-2 text-right">{c.saldoAcreedor > 0 ? c.saldoAcreedor.toFixed(2) : ''}</td>
                </tr>
              ))}
              {datos.cuentas.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Sin movimientos en el periodo</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-800 font-bold">
                <td className="px-4 py-2" colSpan={2}>Totales</td>
                <td className="px-4 py-2 text-right">{datos.totales.totalDebe.toFixed(2)}</td>
                <td className="px-4 py-2 text-right">{datos.totales.totalHaber.toFixed(2)}</td>
                <td className="px-4 py-2 text-right">{datos.totales.saldoDeudor.toFixed(2)}</td>
                <td className="px-4 py-2 text-right">{datos.totales.saldoAcreedor.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
