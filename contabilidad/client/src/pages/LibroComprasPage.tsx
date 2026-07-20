import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';

interface Registro {
  id: number;
  fecha: string;
  tipo_documento: string;
  numero_factura: string;
  numero_control: string | null;
  proveedor_rif: string;
  proveedor_nombre: string;
  base_imponible: number;
  exento: number;
  iva_porcentaje: number;
  iva_monto: number;
  iva_retenido: number;
  total: number;
}

const hoy = () => new Date().toISOString().slice(0, 10);
const VACIO = {
  fecha: hoy(), tipoDocumento: 'Factura', numeroFactura: '', numeroControl: '', proveedorRif: '', proveedorNombre: '',
  baseImponible: '', exento: '', ivaPorcentaje: '16', ivaMonto: '', ivaRetenido: '', total: '', observaciones: '',
};

export default function LibroComprasPage() {
  const { empresaId, empresa } = useEmpresa();
  const [items, setItems] = useState<Registro[]>([]);
  const [form, setForm] = useState(VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  async function cargar() {
    if (!empresaId) return;
    const params = new URLSearchParams({ empresaId: String(empresaId) });
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    setItems(await api.get<Registro[]>(`/libro-compras?${params.toString()}`));
  }

  useEffect(() => { cargar(); }, [empresaId, desde, hasta]); // eslint-disable-line react-hooks/exhaustive-deps

  function calcularAuto(base: string, exento: string, ivaPct: string) {
    const b = Number(base) || 0;
    const e = Number(exento) || 0;
    const pct = Number(ivaPct) || 0;
    const iva = b * (pct / 100);
    return { ivaMonto: iva.toFixed(2), total: (b + e + iva).toFixed(2) };
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!empresaId) return;
    try {
      await api.post('/libro-compras', {
        empresaId,
        fecha: form.fecha,
        tipoDocumento: form.tipoDocumento,
        numeroFactura: form.numeroFactura,
        numeroControl: form.numeroControl || null,
        proveedorRif: form.proveedorRif,
        proveedorNombre: form.proveedorNombre,
        baseImponible: Number(form.baseImponible) || 0,
        exento: Number(form.exento) || 0,
        ivaPorcentaje: Number(form.ivaPorcentaje) || 0,
        ivaMonto: Number(form.ivaMonto) || 0,
        ivaRetenido: Number(form.ivaRetenido) || 0,
        total: Number(form.total) || 0,
        observaciones: form.observaciones || null,
      });
      setForm(VACIO);
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar');
    }
  }

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar este registro del libro de compras?')) return;
    await api.delete(`/libro-compras/${id}`);
    cargar();
  }

  const totales = items.reduce(
    (acc, r) => ({
      base: acc.base + r.base_imponible, exento: acc.exento + r.exento, iva: acc.iva + r.iva_monto,
      retenido: acc.retenido + r.iva_retenido, total: acc.total + r.total,
    }),
    { base: 0, exento: 0, iva: 0, retenido: 0, total: 0 }
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-slate-800">Libro de Compras</h1>
        <button onClick={() => setMostrarForm((v) => !v)} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">
          {mostrarForm ? 'Cancelar' : '+ Registrar Compra'}
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-4">{empresa?.nombre} — registro fiscal exigido por el SENIAT</p>

      {mostrarForm && (
        <form onSubmit={onSubmit} className="bg-white rounded-lg border border-slate-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div><label className="block text-xs text-slate-500 mb-1">Fecha</label>
            <input type="date" required value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </div>
          <input placeholder="Tipo de documento" value={form.tipoDocumento} onChange={(e) => setForm({ ...form, tipoDocumento: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2" />
          <input required placeholder="N° Factura" value={form.numeroFactura} onChange={(e) => setForm({ ...form, numeroFactura: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2" />
          <input placeholder="N° Control" value={form.numeroControl} onChange={(e) => setForm({ ...form, numeroControl: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2" />
          <input required placeholder="RIF del proveedor" value={form.proveedorRif} onChange={(e) => setForm({ ...form, proveedorRif: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2" />
          <input required placeholder="Nombre del proveedor" value={form.proveedorNombre} onChange={(e) => setForm({ ...form, proveedorNombre: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 md:col-span-2" />
          <input type="number" step="0.01" placeholder="Base imponible" value={form.baseImponible}
            onChange={(e) => { const c = calcularAuto(e.target.value, form.exento, form.ivaPorcentaje); setForm({ ...form, baseImponible: e.target.value, ...c }); }}
            className="rounded-md border border-slate-300 px-3 py-2" />
          <input type="number" step="0.01" placeholder="Exento" value={form.exento}
            onChange={(e) => { const c = calcularAuto(form.baseImponible, e.target.value, form.ivaPorcentaje); setForm({ ...form, exento: e.target.value, ...c }); }}
            className="rounded-md border border-slate-300 px-3 py-2" />
          <input type="number" step="0.01" placeholder="% IVA" value={form.ivaPorcentaje}
            onChange={(e) => { const c = calcularAuto(form.baseImponible, form.exento, e.target.value); setForm({ ...form, ivaPorcentaje: e.target.value, ...c }); }}
            className="rounded-md border border-slate-300 px-3 py-2" />
          <input type="number" step="0.01" placeholder="Monto IVA" value={form.ivaMonto} onChange={(e) => setForm({ ...form, ivaMonto: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2" />
          <input type="number" step="0.01" placeholder="IVA retenido" value={form.ivaRetenido} onChange={(e) => setForm({ ...form, ivaRetenido: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2" />
          <input required type="number" step="0.01" placeholder="Total" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 font-semibold" />
          <input placeholder="Observaciones" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 md:col-span-2" />
          {error && <div className="text-sm text-red-600 md:col-span-4">{error}</div>}
          <div className="md:col-span-4">
            <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">Guardar</button>
          </div>
        </form>
      )}

      <div className="flex gap-3 mb-3">
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2" />
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2" />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Factura</th><th className="px-3 py-2">Proveedor</th>
              <th className="px-3 py-2 text-right">Base</th><th className="px-3 py-2 text-right">Exento</th>
              <th className="px-3 py-2 text-right">IVA</th><th className="px-3 py-2 text-right">Ret. IVA</th>
              <th className="px-3 py-2 text-right">Total</th><th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{r.fecha}</td>
                <td className="px-3 py-2">{r.numero_factura}</td>
                <td className="px-3 py-2">{r.proveedor_nombre} <span className="text-xs text-slate-400">({r.proveedor_rif})</span></td>
                <td className="px-3 py-2 text-right">{r.base_imponible.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{r.exento.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{r.iva_monto.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{r.iva_retenido.toFixed(2)}</td>
                <td className="px-3 py-2 text-right font-medium">{r.total.toFixed(2)}</td>
                <td className="px-3 py-2 text-right"><button onClick={() => eliminar(r.id)} className="text-red-600 hover:underline text-xs">Eliminar</button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-400">Sin registros</td></tr>}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-800 font-bold">
              <td className="px-3 py-2" colSpan={3}>Totales</td>
              <td className="px-3 py-2 text-right">{totales.base.toFixed(2)}</td>
              <td className="px-3 py-2 text-right">{totales.exento.toFixed(2)}</td>
              <td className="px-3 py-2 text-right">{totales.iva.toFixed(2)}</td>
              <td className="px-3 py-2 text-right">{totales.retenido.toFixed(2)}</td>
              <td className="px-3 py-2 text-right">{totales.total.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
