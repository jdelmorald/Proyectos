import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';

interface Linea { id: number; codigo: string; nombre: string; saldo: number }

interface BalanceGeneral {
  activos: Linea[];
  pasivos: Linea[];
  patrimonio: Linea[];
  totalActivo: number;
  totalPasivo: number;
  totalPatrimonioCuentas: number;
  utilidadEjercicio: number;
  totalPatrimonio: number;
  totalPasivoMasPatrimonio: number;
  cuadra: boolean;
}

const hoy = () => new Date().toISOString().slice(0, 10);

export default function BalanceGeneralPage() {
  const { empresaId, empresa } = useEmpresa();
  const [hasta, setHasta] = useState(hoy());
  const [datos, setDatos] = useState<BalanceGeneral | null>(null);

  useEffect(() => {
    if (!empresaId) return;
    api.get<BalanceGeneral>(`/reportes/balance-general?empresaId=${empresaId}&hasta=${hasta}`).then(setDatos);
  }, [empresaId, hasta]);

  function Seccion({ titulo, lineas, total }: { titulo: string; lineas: Linea[]; total: number }) {
    return (
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-2">{titulo}</h2>
        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
          {lineas.map((l) => (
            <div key={l.id} className="flex justify-between px-4 py-2 text-sm">
              <span>{l.codigo} — {l.nombre}</span>
              <span>{l.saldo.toFixed(2)}</span>
            </div>
          ))}
          {lineas.length === 0 && <div className="px-4 py-3 text-sm text-slate-400">Sin movimientos</div>}
          <div className="flex justify-between px-4 py-2 text-sm font-bold bg-slate-50">
            <span>Total {titulo}</span>
            <span>{total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Balance General</h1>
      <p className="text-sm text-slate-500 mb-4">{empresa?.nombre} · al {hasta}</p>

      <div className="mb-4">
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2" />
      </div>

      {datos && (
        <>
          <Seccion titulo="Activo" lineas={datos.activos} total={datos.totalActivo} />
          <Seccion titulo="Pasivo" lineas={datos.pasivos} total={datos.totalPasivo} />
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-2">Patrimonio</h2>
            <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
              {datos.patrimonio.map((l) => (
                <div key={l.id} className="flex justify-between px-4 py-2 text-sm">
                  <span>{l.codigo} — {l.nombre}</span>
                  <span>{l.saldo.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-2 text-sm">
                <span>Utilidad del ejercicio</span>
                <span>{datos.utilidadEjercicio.toFixed(2)}</span>
              </div>
              <div className="flex justify-between px-4 py-2 text-sm font-bold bg-slate-50">
                <span>Total Patrimonio</span>
                <span>{datos.totalPatrimonio.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className={`rounded-md border px-4 py-3 flex justify-between text-sm font-bold ${datos.cuadra ? 'border-accent-300 bg-accent-50 text-accent-800' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
            <span>Total Activo: {datos.totalActivo.toFixed(2)}</span>
            <span>Total Pasivo + Patrimonio: {datos.totalPasivoMasPatrimonio.toFixed(2)}</span>
            <span>{datos.cuadra ? '✓ Balance cuadrado' : 'No cuadra'}</span>
          </div>
        </>
      )}
    </div>
  );
}
