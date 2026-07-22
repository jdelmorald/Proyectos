import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';
import BotonesExportar from '../components/BotonesExportar';
import { formatearMonto } from '../utils/formato';

interface FlujoEfectivo {
  operacion: number;
  inversion: number;
  financiamiento: number;
  sinClasificar: number;
  flujoNeto: number;
}

const primerDiaAnio = () => `${new Date().getFullYear()}-01-01`;
const hoy = () => new Date().toISOString().slice(0, 10);

export default function FlujoEfectivoPage() {
  const { empresaId, empresa } = useEmpresa();
  const [desde, setDesde] = useState(primerDiaAnio());
  const [hasta, setHasta] = useState(hoy());
  const [datos, setDatos] = useState<FlujoEfectivo | null>(null);

  useEffect(() => {
    if (!empresaId) return;
    api.get<FlujoEfectivo>(`/reportes/flujo-efectivo?empresaId=${empresaId}&desde=${desde}&hasta=${hasta}`).then(setDatos);
  }, [empresaId, desde, hasta]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-display font-semibold text-slate-800 mb-1">Flujo de Efectivo</h1>
      <p className="text-sm text-slate-500 mb-1">{empresa?.nombre} · del {desde} al {hasta}</p>
      <p className="text-xs text-slate-400 mb-4">
        Calculado a partir de los movimientos en cuentas de Caja/Banco, clasificados según la actividad de la
        contrapartida en cada asiento.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-3">
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2" />
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2" />
        </div>
        {datos && (
          <BotonesExportar
            empresa={empresa}
            titulo="Flujo de Efectivo"
            subtitulo={`Del ${desde} al ${hasta}`}
            nombreArchivo="flujo-efectivo"
            columnas={[{ header: 'Concepto', key: 'concepto' }, { header: 'Monto', key: 'monto', align: 'right' }]}
            filas={[
              { concepto: 'Efectivo generado (usado) en Operación', monto: datos.operacion },
              { concepto: 'Efectivo generado (usado) en Inversión', monto: datos.inversion },
              { concepto: 'Efectivo generado (usado) en Financiamiento', monto: datos.financiamiento },
              ...(datos.sinClasificar !== 0 ? [{ concepto: 'Movimientos sin clasificar', monto: datos.sinClasificar }] : []),
            ]}
            filaTotales={{ concepto: 'Flujo de Efectivo Neto del periodo', monto: datos.flujoNeto }}
          />
        )}
      </div>

      {datos && (
        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
          <div className="flex justify-between px-4 py-3 text-sm">
            <span>Efectivo generado (usado) en Operación</span>
            <span className={datos.operacion >= 0 ? 'text-accent-700' : 'text-red-600'}>{formatearMonto(datos.operacion)}</span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm">
            <span>Efectivo generado (usado) en Inversión</span>
            <span className={datos.inversion >= 0 ? 'text-accent-700' : 'text-red-600'}>{formatearMonto(datos.inversion)}</span>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm">
            <span>Efectivo generado (usado) en Financiamiento</span>
            <span className={datos.financiamiento >= 0 ? 'text-accent-700' : 'text-red-600'}>{formatearMonto(datos.financiamiento)}</span>
          </div>
          {datos.sinClasificar !== 0 && (
            <div className="flex justify-between px-4 py-3 text-sm text-slate-500">
              <span>Movimientos sin clasificar (revisar Plan de Cuentas)</span>
              <span>{formatearMonto(datos.sinClasificar)}</span>
            </div>
          )}
          <div className="flex justify-between px-4 py-3 text-base font-bold bg-slate-50">
            <span>Flujo de Efectivo Neto del periodo</span>
            <span>{formatearMonto(datos.flujoNeto)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
