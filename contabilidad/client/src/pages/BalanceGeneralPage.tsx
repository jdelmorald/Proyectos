import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';
import BotonesExportar from '../components/BotonesExportar';
import { formatearMonto } from '../utils/formato';

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
              <span>{formatearMonto(l.saldo)}</span>
            </div>
          ))}
          {lineas.length === 0 && <div className="px-4 py-3 text-sm text-slate-400">Sin movimientos</div>}
          <div className="flex justify-between px-4 py-2 text-sm font-bold bg-slate-50">
            <span>Total {titulo}</span>
            <span>{formatearMonto(total)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-display font-semibold text-slate-800 mb-1">Balance General <span className="text-base font-normal text-slate-400">(Estado de Situación Financiera)</span></h1>
      <p className="text-sm text-slate-500 mb-4">{empresa?.nombre} · al {hasta}</p>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2" />
        {datos && (
          <BotonesExportar
            empresa={empresa}
            titulo="Balance General (Estado de Situación Financiera)"
            subtitulo={`Al ${hasta}`}
            nombreArchivo="balance-general"
            metadatos={[{ label: 'Periodo', valor: `Al ${hasta}` }, { label: 'Versión', valor: '1.0' }]}
            firmas={{ izquierda: 'Representante Legal', derecha: 'Contador Público' }}
            columnas={[
              { header: 'Sección', key: 'seccion' },
              { header: 'Código', key: 'codigo' },
              { header: 'Cuenta', key: 'nombre' },
              { header: 'Saldo', key: 'saldo', align: 'right' },
            ]}
            filas={[
              ...datos.activos.map((l) => ({ seccion: 'Activo', codigo: l.codigo, nombre: l.nombre, saldo: l.saldo })),
              { seccion: '', codigo: '', nombre: 'Total Activo', saldo: datos.totalActivo, _estilo: 'total' },
              ...datos.pasivos.map((l) => ({ seccion: 'Pasivo', codigo: l.codigo, nombre: l.nombre, saldo: l.saldo })),
              { seccion: '', codigo: '', nombre: 'Total Pasivo', saldo: datos.totalPasivo, _estilo: 'subtotal' },
              ...datos.patrimonio.map((l) => ({ seccion: 'Patrimonio', codigo: l.codigo, nombre: l.nombre, saldo: l.saldo })),
              { seccion: 'Patrimonio', codigo: '', nombre: 'Utilidad del ejercicio', saldo: datos.utilidadEjercicio },
              { seccion: '', codigo: '', nombre: 'Total Patrimonio', saldo: datos.totalPatrimonio, _estilo: 'subtotal' },
            ]}
            filaTotales={{
              seccion: '', codigo: '',
              nombre: datos.cuadra ? 'Total Pasivo + Patrimonio (cuadra ✓)' : 'Total Pasivo + Patrimonio (NO cuadra)',
              saldo: datos.totalPasivoMasPatrimonio,
            }}
            pdfDosColumnas={{
              izquierda: {
                titulo: 'ACTIVOS',
                columnas: [{ header: 'Código', key: 'codigo' }, { header: 'Cuenta', key: 'nombre' }, { header: 'Saldo', key: 'saldo', align: 'right' }],
                filas: [
                  ...datos.activos.map((l) => ({ codigo: l.codigo, nombre: l.nombre, saldo: l.saldo })),
                  { codigo: '', nombre: 'TOTAL ACTIVOS', saldo: datos.totalActivo, _estilo: 'total' },
                ],
              },
              derecha: {
                titulo: 'PASIVOS Y PATRIMONIO',
                columnas: [{ header: 'Código', key: 'codigo' }, { header: 'Cuenta', key: 'nombre' }, { header: 'Saldo', key: 'saldo', align: 'right' }],
                filas: [
                  ...datos.pasivos.map((l) => ({ codigo: l.codigo, nombre: l.nombre, saldo: l.saldo })),
                  { codigo: '', nombre: 'Total Pasivo', saldo: datos.totalPasivo, _estilo: 'subtotal' },
                  ...datos.patrimonio.map((l) => ({ codigo: l.codigo, nombre: l.nombre, saldo: l.saldo })),
                  { codigo: '', nombre: 'Utilidad del ejercicio', saldo: datos.utilidadEjercicio },
                  { codigo: '', nombre: 'Total Patrimonio', saldo: datos.totalPatrimonio, _estilo: 'subtotal' },
                  { codigo: '', nombre: 'TOTAL PASIVO + PATRIMONIO', saldo: datos.totalPasivoMasPatrimonio, _estilo: 'total' },
                ],
              },
            }}
          />
        )}
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
                  <span>{formatearMonto(l.saldo)}</span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-2 text-sm">
                <span>Utilidad del ejercicio</span>
                <span>{formatearMonto(datos.utilidadEjercicio)}</span>
              </div>
              <div className="flex justify-between px-4 py-2 text-sm font-bold bg-slate-50">
                <span>Total Patrimonio</span>
                <span>{formatearMonto(datos.totalPatrimonio)}</span>
              </div>
            </div>
          </div>

          <div className={`rounded-md border px-4 py-3 flex justify-between text-sm font-bold ${datos.cuadra ? 'border-accent-300 bg-accent-50 text-accent-800' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
            <span>Total Activo: {formatearMonto(datos.totalActivo)}</span>
            <span>Total Pasivo + Patrimonio: {formatearMonto(datos.totalPasivoMasPatrimonio)}</span>
            <span>{datos.cuadra ? '✓ Balance cuadrado' : 'No cuadra'}</span>
          </div>
        </>
      )}
    </div>
  );
}
