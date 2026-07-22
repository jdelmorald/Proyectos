import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';
import { formatearMonto } from '../utils/formato';

type Tab = 'iva' | 'islr-retenciones' | 'islr-estimado' | 'igtf' | 'municipal';

const TABS: { id: Tab; label: string }[] = [
  { id: 'iva', label: 'IVA Declarable' },
  { id: 'islr-retenciones', label: 'Retenciones ISLR' },
  { id: 'islr-estimado', label: 'ISLR Estimado' },
  { id: 'igtf', label: 'IGTF' },
  { id: 'municipal', label: 'Impuesto Municipal' },
];

function hoy() { return new Date().toISOString().slice(0, 10); }
function inicioMes() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; }
const fmt = formatearMonto;

export default function FiscalPage() {
  const { empresaId, empresa } = useEmpresa();
  const [tab, setTab] = useState<Tab>('iva');
  const [desde, setDesde] = useState(inicioMes());
  const [hasta, setHasta] = useState(hoy());
  const moneda = empresa?.moneda ?? 'Bs.';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-display font-semibold text-slate-800">Módulo Fiscal</h1>
        <p className="text-sm text-slate-500 mt-0.5">Disciplina fiscal según la legislación venezolana: IVA, ISLR, IGTF e Impuesto Municipal.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${tab === t.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-3 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Desde</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
        </div>
      </div>

      {empresaId && tab === 'iva' && <IvaDeclarable empresaId={empresaId} desde={desde} hasta={hasta} moneda={moneda} />}
      {empresaId && tab === 'islr-retenciones' && <RetencionesIslr empresaId={empresaId} desde={desde} hasta={hasta} moneda={moneda} />}
      {empresaId && tab === 'islr-estimado' && <IslrEstimado empresaId={empresaId} desde={desde} hasta={hasta} moneda={moneda} />}
      {empresaId && tab === 'igtf' && <Igtf empresaId={empresaId} desde={desde} hasta={hasta} moneda={moneda} />}
      {empresaId && tab === 'municipal' && <Municipal empresaId={empresaId} desde={desde} hasta={hasta} moneda={moneda} />}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'default' | 'good' | 'bad' }) {
  const toneClass = tone === 'good' ? 'text-accent-700' : tone === 'bad' ? 'text-rose-600' : 'text-brand-900';
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-xl font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}

/* ---------------- IVA Declarable ---------------- */
interface IvaData {
  ventas: { baseImponible: number; debitoFiscal: number; ivaRetenidoPorTerceros: number };
  compras: { baseImponible: number; creditoFiscal: number; ivaRetenidoAProveedores: number };
  ivaAPagar: number;
  excedenteCreditoFiscal: number;
  ivaRetenidoPorEnterar: number;
}

function IvaDeclarable({ empresaId, desde, hasta, moneda }: { empresaId: number; desde: string; hasta: string; moneda: string }) {
  const [data, setData] = useState<IvaData | null>(null);
  useEffect(() => {
    api.get<IvaData>(`/fiscal/iva-declarable?empresaId=${empresaId}&desde=${desde}&hasta=${hasta}`).then(setData);
  }, [empresaId, desde, hasta]);
  if (!data) return <div className="text-slate-400">Cargando...</div>;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Débito Fiscal (Ventas)" value={`${moneda} ${fmt(data.ventas.debitoFiscal)}`} />
        <Stat label="Crédito Fiscal (Compras)" value={`${moneda} ${fmt(data.compras.creditoFiscal)}`} />
        <Stat label="IVA a Pagar" value={`${moneda} ${fmt(data.ivaAPagar)}`} tone={data.ivaAPagar > 0 ? 'bad' : 'good'} />
      </div>
      <div className="bg-white rounded-lg border border-slate-200 p-4 text-sm space-y-2">
        <div className="flex justify-between"><span className="text-slate-500">Base imponible de ventas</span><span>{moneda} {fmt(data.ventas.baseImponible)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Base imponible de compras</span><span>{moneda} {fmt(data.compras.baseImponible)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">IVA retenido por clientes (a favor)</span><span>{moneda} {fmt(data.ventas.ivaRetenidoPorTerceros)}</span></div>
        <div className="flex justify-between border-t border-slate-100 pt-2"><span className="text-slate-500">IVA retenido a proveedores (por enterar al SENIAT)</span><span className="font-semibold">{moneda} {fmt(data.ivaRetenidoPorEnterar)}</span></div>
        {data.excedenteCreditoFiscal > 0 && (
          <div className="flex justify-between text-accent-700"><span>Excedente de crédito fiscal (trasladable al próximo período)</span><span className="font-semibold">{moneda} {fmt(data.excedenteCreditoFiscal)}</span></div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Retenciones ISLR ---------------- */
interface RetencionIslr {
  id: number;
  fecha: string;
  proveedor_rif: string;
  proveedor_nombre: string;
  concepto: string | null;
  monto_pagado: number;
  porcentaje_retencion: number;
  monto_retenido: number;
  numero_comprobante: string | null;
}
const VACIO_RETENCION = { fecha: hoy(), proveedorRif: '', proveedorNombre: '', concepto: '', montoPagado: '', porcentajeRetencion: '', montoRetenido: '', numeroComprobante: '' };

function RetencionesIslr({ empresaId, desde, hasta, moneda }: { empresaId: number; desde: string; hasta: string; moneda: string }) {
  const [items, setItems] = useState<RetencionIslr[]>([]);
  const [form, setForm] = useState(VACIO_RETENCION);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    setItems(await api.get<RetencionIslr[]>(`/fiscal/retenciones-islr?empresaId=${empresaId}&desde=${desde}&hasta=${hasta}`));
  }
  useEffect(() => { cargar(); }, [empresaId, desde, hasta]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/fiscal/retenciones-islr', {
        empresaId,
        fecha: form.fecha,
        proveedorRif: form.proveedorRif,
        proveedorNombre: form.proveedorNombre,
        concepto: form.concepto || null,
        montoPagado: Number(form.montoPagado),
        porcentajeRetencion: Number(form.porcentajeRetencion),
        montoRetenido: Number(form.montoRetenido),
        numeroComprobante: form.numeroComprobante || null,
      });
      setForm(VACIO_RETENCION);
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar');
    }
  }

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar esta retención?')) return;
    await api.delete(`/fiscal/retenciones-islr/${id}`);
    cargar();
  }

  const totalRetenido = items.reduce((s, i) => s + i.monto_retenido, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Stat label="Total retenido en el período" value={`${moneda} ${fmt(totalRetenido)}`} />
        <button onClick={() => setMostrarForm((v) => !v)} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">
          {mostrarForm ? 'Cancelar' : '+ Nueva retención'}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={onSubmit} className="bg-white rounded-lg border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="date" required value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input required placeholder="RIF proveedor" value={form.proveedorRif} onChange={(e) => setForm({ ...form, proveedorRif: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input required placeholder="Nombre proveedor" value={form.proveedorNombre} onChange={(e) => setForm({ ...form, proveedorNombre: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
          <input placeholder="Concepto (ej. Honorarios profesionales)" value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
          <input type="number" step="0.01" required placeholder="Monto pagado" value={form.montoPagado} onChange={(e) => setForm({ ...form, montoPagado: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input type="number" step="0.01" required placeholder="% Retención" value={form.porcentajeRetencion} onChange={(e) => setForm({ ...form, porcentajeRetencion: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input type="number" step="0.01" required placeholder="Monto retenido" value={form.montoRetenido} onChange={(e) => setForm({ ...form, montoRetenido: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="N° comprobante" value={form.numeroComprobante} onChange={(e) => setForm({ ...form, numeroComprobante: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          {error && <div className="text-sm text-red-600 md:col-span-4">{error}</div>}
          <div className="md:col-span-4">
            <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">Guardar</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Proveedor</th>
              <th className="px-4 py-2">Concepto</th>
              <th className="px-4 py-2 text-right">Monto Pagado</th>
              <th className="px-4 py-2 text-right">% Ret.</th>
              <th className="px-4 py-2 text-right">Monto Retenido</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{i.fecha}</td>
                <td className="px-4 py-2">{i.proveedor_nombre} <span className="text-xs text-slate-400">({i.proveedor_rif})</span></td>
                <td className="px-4 py-2 text-slate-500">{i.concepto}</td>
                <td className="px-4 py-2 text-right">{fmt(i.monto_pagado)}</td>
                <td className="px-4 py-2 text-right">{i.porcentaje_retencion}%</td>
                <td className="px-4 py-2 text-right font-semibold">{fmt(i.monto_retenido)}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => eliminar(i.id)} className="text-red-600 hover:underline text-xs">Eliminar</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Sin retenciones registradas</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- ISLR Estimado ---------------- */
interface IslrEstimadoData {
  valorUt: number;
  utilidadFiscal: number;
  unidadesTributarias: number;
  tasaAplicada: number;
  impuestoEstimado: number;
  anticipos: number;
  saldoPorPagar: number;
  saldoAFavor: number;
}
interface Anticipo { id: number; periodo: string; concepto: string; fecha: string; monto: number }
const VACIO_ANTICIPO = { periodo: '', concepto: '', fecha: hoy(), monto: '' };

function IslrEstimado({ empresaId, desde, hasta, moneda }: { empresaId: number; desde: string; hasta: string; moneda: string }) {
  const [data, setData] = useState<IslrEstimadoData | null>(null);
  const [anticipos, setAnticipos] = useState<Anticipo[]>([]);
  const [form, setForm] = useState(VACIO_ANTICIPO);
  const [mostrarForm, setMostrarForm] = useState(false);

  async function cargar() {
    setData(await api.get<IslrEstimadoData>(`/fiscal/islr-estimado?empresaId=${empresaId}&desde=${desde}&hasta=${hasta}`));
    setAnticipos(await api.get<Anticipo[]>(`/fiscal/islr-anticipos?empresaId=${empresaId}&desde=${desde}&hasta=${hasta}`));
  }
  useEffect(() => { cargar(); }, [empresaId, desde, hasta]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await api.post('/fiscal/islr-anticipos', { empresaId, periodo: form.periodo, concepto: form.concepto, fecha: form.fecha, monto: Number(form.monto) });
    setForm(VACIO_ANTICIPO);
    setMostrarForm(false);
    cargar();
  }
  async function eliminar(id: number) {
    if (!confirm('¿Eliminar este anticipo?')) return;
    await api.delete(`/fiscal/islr-anticipos/${id}`);
    cargar();
  }

  if (!data) return <div className="text-slate-400">Cargando...</div>;

  return (
    <div className="space-y-4">
      {data.valorUt <= 0 && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Configure el valor de la Unidad Tributaria (UT) de la empresa en <strong>Configuración → Empresas</strong> para calcular el ISLR estimado.
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Utilidad Fiscal del Período" value={`${moneda} ${fmt(data.utilidadFiscal)}`} />
        <Stat label="ISLR Estimado (Tarifa 2)" value={`${moneda} ${fmt(data.impuestoEstimado)}`} />
        <Stat
          label={data.saldoAFavor > 0 ? 'Saldo a Favor' : 'Saldo por Pagar'}
          value={`${moneda} ${fmt(data.saldoAFavor > 0 ? data.saldoAFavor : data.saldoPorPagar)}`}
          tone={data.saldoAFavor > 0 ? 'good' : data.saldoPorPagar > 0 ? 'bad' : 'default'}
        />
      </div>
      <div className="bg-white rounded-lg border border-slate-200 p-4 text-sm space-y-1.5">
        <div className="flex justify-between"><span className="text-slate-500">Unidades tributarias (renta neta)</span><span>{fmt(data.unidadesTributarias)} UT</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Tasa aplicada (Tarifa 2)</span><span>{(data.tasaAplicada * 100).toFixed(0)}%</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Anticipos / retenciones ya pagados</span><span>{moneda} {fmt(data.anticipos)}</span></div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <h3 className="font-semibold text-brand-900">Anticipos registrados</h3>
        <button onClick={() => setMostrarForm((v) => !v)} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">
          {mostrarForm ? 'Cancelar' : '+ Registrar anticipo'}
        </button>
      </div>
      {mostrarForm && (
        <form onSubmit={onSubmit} className="bg-white rounded-lg border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input required placeholder="Período (ej. 2026)" value={form.periodo} onChange={(e) => setForm({ ...form, periodo: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input required placeholder="Concepto" value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
          <input type="date" required value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input type="number" step="0.01" required placeholder="Monto" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <div className="md:col-span-4">
            <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">Guardar</button>
          </div>
        </form>
      )}
      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr><th className="px-4 py-2">Fecha</th><th className="px-4 py-2">Período</th><th className="px-4 py-2">Concepto</th><th className="px-4 py-2 text-right">Monto</th><th className="px-4 py-2"></th></tr>
          </thead>
          <tbody>
            {anticipos.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{a.fecha}</td>
                <td className="px-4 py-2">{a.periodo}</td>
                <td className="px-4 py-2 text-slate-500">{a.concepto}</td>
                <td className="px-4 py-2 text-right">{fmt(a.monto)}</td>
                <td className="px-4 py-2 text-right"><button onClick={() => eliminar(a.id)} className="text-red-600 hover:underline text-xs">Eliminar</button></td>
              </tr>
            ))}
            {anticipos.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Sin anticipos registrados</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- IGTF ---------------- */
interface IgtfOperacion { id: number; fecha: string; descripcion: string; base_imponible: number; alicuota: number; monto: number }
interface IgtfData { operaciones: IgtfOperacion[]; totalBase: number; totalMonto: number }
const VACIO_IGTF = { fecha: hoy(), descripcion: '', baseImponible: '', alicuota: '3' };

function Igtf({ empresaId, desde, hasta, moneda }: { empresaId: number; desde: string; hasta: string; moneda: string }) {
  const [data, setData] = useState<IgtfData | null>(null);
  const [form, setForm] = useState(VACIO_IGTF);
  const [mostrarForm, setMostrarForm] = useState(false);

  async function cargar() {
    setData(await api.get<IgtfData>(`/fiscal/igtf?empresaId=${empresaId}&desde=${desde}&hasta=${hasta}`));
  }
  useEffect(() => { cargar(); }, [empresaId, desde, hasta]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await api.post('/fiscal/igtf', {
      empresaId, fecha: form.fecha, descripcion: form.descripcion,
      baseImponible: Number(form.baseImponible), alicuota: Number(form.alicuota),
    });
    setForm(VACIO_IGTF);
    setMostrarForm(false);
    cargar();
  }
  async function eliminar(id: number) {
    if (!confirm('¿Eliminar esta operación?')) return;
    await api.delete(`/fiscal/igtf/${id}`);
    cargar();
  }

  if (!data) return <div className="text-slate-400">Cargando...</div>;

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
        Impuesto a las Grandes Transacciones Financieras (IGTF): aplica sobre pagos en divisas, criptomonedas o débitos en cuentas de contribuyentes especiales. Alícuota general vigente: 3%.
      </div>
      <div className="flex items-center justify-between">
        <Stat label="Total IGTF del período" value={`${moneda} ${fmt(data.totalMonto)}`} tone="bad" />
        <button onClick={() => setMostrarForm((v) => !v)} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">
          {mostrarForm ? 'Cancelar' : '+ Registrar operación'}
        </button>
      </div>
      {mostrarForm && (
        <form onSubmit={onSubmit} className="bg-white rounded-lg border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="date" required value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input required placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
          <input type="number" step="0.01" required placeholder="Base imponible" value={form.baseImponible} onChange={(e) => setForm({ ...form, baseImponible: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input type="number" step="0.01" required placeholder="Alícuota %" value={form.alicuota} onChange={(e) => setForm({ ...form, alicuota: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <div className="md:col-span-4">
            <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">Guardar</button>
          </div>
        </form>
      )}
      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr><th className="px-4 py-2">Fecha</th><th className="px-4 py-2">Descripción</th><th className="px-4 py-2 text-right">Base</th><th className="px-4 py-2 text-right">Alícuota</th><th className="px-4 py-2 text-right">IGTF</th><th className="px-4 py-2"></th></tr>
          </thead>
          <tbody>
            {data.operaciones.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{o.fecha}</td>
                <td className="px-4 py-2">{o.descripcion}</td>
                <td className="px-4 py-2 text-right">{fmt(o.base_imponible)}</td>
                <td className="px-4 py-2 text-right">{o.alicuota}%</td>
                <td className="px-4 py-2 text-right font-semibold">{fmt(o.monto)}</td>
                <td className="px-4 py-2 text-right"><button onClick={() => eliminar(o.id)} className="text-red-600 hover:underline text-xs">Eliminar</button></td>
              </tr>
            ))}
            {data.operaciones.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Sin operaciones registradas</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Impuesto Municipal ---------------- */
interface MunicipalData { municipio: string | null; alicuotaMunicipal: number; ingresosBrutos: number; impuestoMunicipal: number }

function Municipal({ empresaId, desde, hasta, moneda }: { empresaId: number; desde: string; hasta: string; moneda: string }) {
  const [data, setData] = useState<MunicipalData | null>(null);
  useEffect(() => {
    api.get<MunicipalData>(`/fiscal/municipal?empresaId=${empresaId}&desde=${desde}&hasta=${hasta}`).then(setData);
  }, [empresaId, desde, hasta]);
  if (!data) return <div className="text-slate-400">Cargando...</div>;
  return (
    <div className="space-y-4">
      {(!data.alicuotaMunicipal || data.alicuotaMunicipal <= 0) && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Configure el municipio y la alícuota del Impuesto sobre Actividades Económicas en <strong>Configuración → Empresas</strong>.
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Ingresos Brutos del Período" value={`${moneda} ${fmt(data.ingresosBrutos)}`} />
        <Stat label="Alícuota Municipal" value={`${data.alicuotaMunicipal || 0}%`} />
        <Stat label="Impuesto Municipal Estimado" value={`${moneda} ${fmt(data.impuestoMunicipal)}`} tone="bad" />
      </div>
      <div className="bg-white rounded-lg border border-slate-200 p-4 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">Municipio</span><span>{data.municipio || '— no configurado —'}</span></div>
      </div>
    </div>
  );
}
