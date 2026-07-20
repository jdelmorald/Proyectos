import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';

interface CuentaPendiente {
  id: number;
  tipo: 'cxc' | 'cxp';
  terceroNombre: string;
  asientoNumero: string;
  numeroReferencia: string | null;
  fechaEmision: string;
  fechaVencimiento: string | null;
  montoOriginal: number;
  saldoPendiente: number;
  estado: 'pendiente' | 'parcial' | 'pagado' | 'anulado';
}

interface Cuenta {
  id: number;
  codigo: string;
  nombre: string;
  permite_movimiento: number;
  es_efectivo: number;
}

const ESTADO_LABEL: Record<string, string> = { pendiente: 'Pendiente', parcial: 'Abono parcial', pagado: 'Pagado', anulado: 'Anulado' };
const ESTADO_TONE: Record<string, string> = {
  pendiente: 'bg-amber-50 text-amber-700',
  parcial: 'bg-sky-50 text-sky-700',
  pagado: 'bg-accent-50 text-accent-700',
  anulado: 'bg-slate-100 text-slate-500',
};

function hoy() { return new Date().toISOString().slice(0, 10); }
function estaVencida(fv: string | null, estado: string) {
  return !!fv && estado !== 'pagado' && estado !== 'anulado' && fv < hoy();
}

export default function CuentasPendientesPage() {
  const { empresaId, empresa } = useEmpresa();
  const [tab, setTab] = useState<'cxc' | 'cxp'>('cxc');
  const [items, setItems] = useState<CuentaPendiente[]>([]);
  const [cuentasEfectivo, setCuentasEfectivo] = useState<Cuenta[]>([]);
  const [abonando, setAbonando] = useState<CuentaPendiente | null>(null);
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(hoy());
  const [cuentaContrapartidaId, setCuentaContrapartidaId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    if (!empresaId) return;
    setItems(await api.get<CuentaPendiente[]>(`/cuentas-pendientes?empresaId=${empresaId}&tipo=${tab}`));
  }

  useEffect(() => { cargar(); }, [empresaId, tab]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!empresaId) return;
    api.get<Cuenta[]>(`/plan-cuentas?empresaId=${empresaId}`).then((c) => setCuentasEfectivo(c.filter((x) => x.permite_movimiento && x.es_efectivo)));
  }, [empresaId]);

  function abrirAbono(item: CuentaPendiente) {
    setAbonando(item);
    setMonto(String(item.saldoPendiente));
    setFecha(hoy());
    setCuentaContrapartidaId('');
    setError(null);
  }

  async function onSubmitAbono(e: FormEvent) {
    e.preventDefault();
    if (!abonando) return;
    setError(null);
    if (!cuentaContrapartidaId) { setError('Seleccione la cuenta de caja/banco'); return; }
    setGuardando(true);
    try {
      await api.post(`/cuentas-pendientes/${abonando.id}/abonar`, {
        fecha,
        monto: Number(monto),
        cuentaContrapartidaId: Number(cuentaContrapartidaId),
      });
      setAbonando(null);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al registrar el abono');
    } finally {
      setGuardando(false);
    }
  }

  const totalPendiente = items.filter((i) => i.estado !== 'pagado' && i.estado !== 'anulado').reduce((s, i) => s + i.saldoPendiente, 0);
  const moneda = empresa?.moneda ?? 'Bs.';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Cuentas por Cobrar y por Pagar</h1>
        <p className="text-sm text-slate-500 mt-0.5">Subledger de saldos pendientes por tercero, generado automáticamente desde el Libro Diario.</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button onClick={() => setTab('cxc')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'cxc' ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            Cuentas por Cobrar
          </button>
          <button onClick={() => setTab('cxp')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'cxp' ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            Cuentas por Pagar
          </button>
        </div>
        <div className="text-sm text-slate-500">
          Total pendiente: <span className="font-bold text-brand-900">{moneda} {totalPendiente.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">{tab === 'cxc' ? 'Cliente' : 'Proveedor'}</th>
              <th className="px-4 py-2">Asiento</th>
              <th className="px-4 py-2">Emisión</th>
              <th className="px-4 py-2">Vencimiento</th>
              <th className="px-4 py-2 text-right">Monto Original</th>
              <th className="px-4 py-2 text-right">Saldo Pendiente</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-700">{i.terceroNombre}</td>
                <td className="px-4 py-2 text-xs text-slate-500">{i.asientoNumero}</td>
                <td className="px-4 py-2">{i.fechaEmision}</td>
                <td className={`px-4 py-2 ${estaVencida(i.fechaVencimiento, i.estado) ? 'text-red-600 font-semibold' : ''}`}>
                  {i.fechaVencimiento || '—'}{estaVencida(i.fechaVencimiento, i.estado) ? ' (vencida)' : ''}
                </td>
                <td className="px-4 py-2 text-right">{i.montoOriginal.toFixed(2)}</td>
                <td className="px-4 py-2 text-right font-semibold">{i.saldoPendiente.toFixed(2)}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_TONE[i.estado]}`}>{ESTADO_LABEL[i.estado]}</span>
                </td>
                <td className="px-4 py-2 text-right">
                  {(i.estado === 'pendiente' || i.estado === 'parcial') && (
                    <button onClick={() => abrirAbono(i)} className="text-brand-700 hover:underline text-xs font-medium">
                      {tab === 'cxc' ? 'Registrar cobro' : 'Registrar pago'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">Sin registros</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {abonando && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-brand-900 mb-1">{tab === 'cxc' ? 'Registrar cobro' : 'Registrar pago'}</h2>
            <p className="text-sm text-slate-500 mb-4">{abonando.terceroNombre} · Saldo pendiente: {moneda} {abonando.saldoPendiente.toFixed(2)}</p>
            <form onSubmit={onSubmitAbono} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Fecha</label>
                <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Monto</label>
                <input type="number" step="0.01" min="0.01" max={abonando.saldoPendiente} required value={monto} onChange={(e) => setMonto(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">{tab === 'cxc' ? 'Cuenta donde ingresa el dinero' : 'Cuenta desde donde se paga'}</label>
                <select required value={cuentaContrapartidaId} onChange={(e) => setCuentaContrapartidaId(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <option value="">-- Seleccionar cuenta de caja/banco --</option>
                  {cuentasEfectivo.map((c) => (
                    <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
                  ))}
                </select>
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={guardando} className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium">
                  {guardando ? 'Guardando...' : 'Confirmar'}
                </button>
                <button type="button" onClick={() => setAbonando(null)} className="px-4 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-100">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
