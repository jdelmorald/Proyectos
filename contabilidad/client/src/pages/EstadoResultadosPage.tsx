import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';

interface Linea { id: number; codigo: string; nombre: string; saldo: number }

interface EstadoResultados {
  ingresos: Linea[];
  costos: Linea[];
  gastos: Linea[];
  totalIngresos: number;
  totalCostos: number;
  totalGastos: number;
  utilidadBruta: number;
  utilidadNeta: number;
}

const primerDiaMes = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};
const hoy = () => new Date().toISOString().slice(0, 10);

export default function EstadoResultadosPage() {
  const { empresaId, empresa } = useEmpresa();
  const [desde, setDesde] = useState(primerDiaMes());
  const [hasta, setHasta] = useState(hoy());
  const [datos, setDatos] = useState<EstadoResultados | null>(null);

  useEffect(() => {
    if (!empresaId) return;
    api.get<EstadoResultados>(`/reportes/estado-resultados?empresaId=${empresaId}&desde=${desde}&hasta=${hasta}`).then(setDatos);
  }, [empresaId, desde, hasta]);

  function Seccion({ titulo, lineas, total, negativo }: { titulo: string; lineas: Linea[]; total: number; negativo?: boolean }) {
    return (
      <div className="mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-2">{titulo}</h2>
        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
          {lineas.map((l) => (
            <div key={l.id} className="flex justify-between px-4 py-2 text-sm">
              <span>{l.codigo} — {l.nombre}</span>
              <span>{negativo && l.saldo > 0 ? '-' : ''}{l.saldo.toFixed(2)}</span>
            </div>
          ))}
          {lineas.length === 0 && <div className="px-4 py-3 text-sm text-slate-400">Sin movimientos</div>}
          <div className="flex justify-between px-4 py-2 text-sm font-bold bg-slate-50">
            <span>Total {titulo}</span>
            <span>{negativo && total > 0 ? '-' : ''}{total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Estado de Resultados</h1>
      <p className="text-sm text-slate-500 mb-4">{empresa?.nombre} · del {desde} al {hasta}</p>

      <div className="flex flex-wrap gap-3 mb-4">
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2" />
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2" />
      </div>

      {datos && (
        <>
          <Seccion titulo="Ingresos" lineas={datos.ingresos} total={datos.totalIngresos} />
          <Seccion titulo="Costos" lineas={datos.costos} total={datos.totalCostos} negativo />
          <div className={`rounded-md border px-4 py-2 mb-4 flex justify-between text-sm font-bold ${datos.utilidadBruta >= 0 ? 'border-accent-300 bg-accent-50 text-accent-800' : 'border-red-300 bg-red-50 text-red-800'}`}>
            <span>Utilidad Bruta</span>
            <span>{datos.utilidadBruta.toFixed(2)}</span>
          </div>
          <Seccion titulo="Gastos" lineas={datos.gastos} total={datos.totalGastos} negativo />
          <div className={`rounded-md border px-4 py-3 flex justify-between text-base font-bold ${datos.utilidadNeta >= 0 ? 'border-accent-400 bg-accent-50 text-accent-800' : 'border-red-400 bg-red-50 text-red-800'}`}>
            <span>Utilidad Neta del Ejercicio</span>
            <span>{datos.utilidadNeta.toFixed(2)}</span>
          </div>
        </>
      )}
    </div>
  );
}
