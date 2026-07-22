import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';
import BotonesExportar from '../components/BotonesExportar';
import { formatearMonto } from '../utils/formato';

interface FilaPatrimonio {
  codigo: string;
  nombre: string;
  saldoInicial: number;
  movimientoPeriodo: number;
  saldoFinal: number;
}

interface EstadoCambiosPatrimonio {
  filas: FilaPatrimonio[];
  totales: { saldoInicial: number; movimientoPeriodo: number; saldoFinal: number };
}

const primerDiaAnio = () => `${new Date().getFullYear()}-01-01`;
const hoy = () => new Date().toISOString().slice(0, 10);

export default function EstadoCambiosPatrimonioPage() {
  const { empresaId, empresa } = useEmpresa();
  const [desde, setDesde] = useState(primerDiaAnio());
  const [hasta, setHasta] = useState(hoy());
  const [datos, setDatos] = useState<EstadoCambiosPatrimonio | null>(null);

  useEffect(() => {
    if (!empresaId) return;
    api.get<EstadoCambiosPatrimonio>(`/reportes/estado-cambios-patrimonio?empresaId=${empresaId}&desde=${desde}&hasta=${hasta}`).then(setDatos);
  }, [empresaId, desde, hasta]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-display font-semibold text-slate-800 mb-1">Estado de Cambios en el Patrimonio Neto</h1>
      <p className="text-sm text-slate-500 mb-4">{empresa?.nombre} · del {desde} al {hasta}</p>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-3">
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2" />
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2" />
        </div>
        {datos && (
          <BotonesExportar
            empresa={empresa}
            titulo="Estado de Cambios en el Patrimonio Neto"
            subtitulo={`Del ${desde} al ${hasta}`}
            nombreArchivo="estado-cambios-patrimonio"
            metadatos={[{ label: 'Periodo', valor: `${desde} al ${hasta}` }, { label: 'Versión', valor: '1.0' }]}
            columnas={[
              { header: 'Concepto', key: 'nombre' },
              { header: 'Saldo Inicial', key: 'saldoInicial', align: 'right' },
              { header: 'Movimiento del Periodo', key: 'movimientoPeriodo', align: 'right' },
              { header: 'Saldo Final', key: 'saldoFinal', align: 'right' },
            ]}
            filas={datos.filas.map((f) => ({
              nombre: f.codigo ? `${f.codigo} — ${f.nombre}` : f.nombre,
              saldoInicial: f.saldoInicial,
              movimientoPeriodo: f.movimientoPeriodo,
              saldoFinal: f.saldoFinal,
            }))}
            filaTotales={{
              nombre: 'Totales',
              saldoInicial: datos.totales.saldoInicial,
              movimientoPeriodo: datos.totales.movimientoPeriodo,
              saldoFinal: datos.totales.saldoFinal,
            }}
          />
        )}
      </div>

      {datos && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2">Concepto</th>
                <th className="px-4 py-2 text-right">Saldo Inicial</th>
                <th className="px-4 py-2 text-right">Movimiento del Periodo</th>
                <th className="px-4 py-2 text-right">Saldo Final</th>
              </tr>
            </thead>
            <tbody>
              {datos.filas.map((f, i) => (
                <tr key={i} className={`border-t border-slate-100 ${!f.codigo ? 'italic text-slate-500' : ''}`}>
                  <td className="px-4 py-2">{f.codigo ? `${f.codigo} — ${f.nombre}` : f.nombre}</td>
                  <td className="px-4 py-2 text-right">{formatearMonto(f.saldoInicial)}</td>
                  <td className="px-4 py-2 text-right">{formatearMonto(f.movimientoPeriodo)}</td>
                  <td className="px-4 py-2 text-right font-medium">{formatearMonto(f.saldoFinal)}</td>
                </tr>
              ))}
              {datos.filas.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Sin cuentas de patrimonio</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-800 font-bold">
                <td className="px-4 py-2">Totales</td>
                <td className="px-4 py-2 text-right">{formatearMonto(datos.totales.saldoInicial)}</td>
                <td className="px-4 py-2 text-right">{formatearMonto(datos.totales.movimientoPeriodo)}</td>
                <td className="px-4 py-2 text-right">{formatearMonto(datos.totales.saldoFinal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
