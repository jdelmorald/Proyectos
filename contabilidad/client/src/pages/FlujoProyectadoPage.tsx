import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';
import BotonesExportar from '../components/BotonesExportar';
import { formatearMonto } from '../utils/formato';

interface Registro {
  id: number;
  periodo: string;
  categoria: 'ingreso' | 'egreso';
  concepto: string;
  monto_proyectado: number;
  observaciones: string | null;
}

interface ResumenPeriodo {
  periodo: string;
  ingresos: number;
  egresos: number;
  neto: number;
  acumulado: number;
}

const periodoActual = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const VACIO = { periodo: periodoActual(), categoria: 'ingreso' as 'ingreso' | 'egreso', concepto: '', montoProyectado: '', observaciones: '' };

export default function FlujoProyectadoPage() {
  const { empresaId, empresa } = useEmpresa();
  const [items, setItems] = useState<Registro[]>([]);
  const [resumen, setResumen] = useState<ResumenPeriodo[]>([]);
  const [form, setForm] = useState(VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!empresaId) return;
    setItems(await api.get<Registro[]>(`/flujo-proyectado?empresaId=${empresaId}`));
    setResumen(await api.get<ResumenPeriodo[]>(`/flujo-proyectado/resumen?empresaId=${empresaId}`));
  }

  useEffect(() => { cargar(); }, [empresaId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!empresaId) return;
    try {
      await api.post('/flujo-proyectado', {
        empresaId,
        periodo: form.periodo,
        categoria: form.categoria,
        concepto: form.concepto,
        montoProyectado: Number(form.montoProyectado) || 0,
        observaciones: form.observaciones || null,
      });
      setForm({ ...VACIO, periodo: form.periodo });
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar');
    }
  }

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar este concepto proyectado?')) return;
    await api.delete(`/flujo-proyectado/${id}`);
    cargar();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-display font-semibold text-slate-800">Flujo de Caja Proyectado</h1>
        <button onClick={() => setMostrarForm((v) => !v)} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">
          {mostrarForm ? 'Cancelar' : '+ Nuevo concepto'}
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-4">{empresa?.nombre} — planificación de ingresos y egresos por periodo</p>

      {mostrarForm && (
        <form onSubmit={onSubmit} className="bg-white rounded-lg border border-slate-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Periodo (mes)</label>
            <input type="month" required value={form.periodo} onChange={(e) => setForm({ ...form, periodo: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </div>
          <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as 'ingreso' | 'egreso' })} className="rounded-md border border-slate-300 px-3 py-2">
            <option value="ingreso">Ingreso</option>
            <option value="egreso">Egreso</option>
          </select>
          <input required placeholder="Concepto" value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 md:col-span-2" />
          <input required type="number" step="0.01" placeholder="Monto proyectado" value={form.montoProyectado} onChange={(e) => setForm({ ...form, montoProyectado: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2" />
          <input placeholder="Observaciones" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 md:col-span-3" />
          {error && <div className="text-sm text-red-600 md:col-span-4">{error}</div>}
          <div className="md:col-span-4">
            <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">Guardar</button>
          </div>
        </form>
      )}

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Resumen por periodo</h2>
        <BotonesExportar
          empresa={empresa}
          titulo="Flujo de Caja Proyectado — Resumen por periodo"
          nombreArchivo="flujo-proyectado-resumen"
          columnas={[
            { header: 'Periodo', key: 'periodo' },
            { header: 'Ingresos', key: 'ingresos', align: 'right' },
            { header: 'Egresos', key: 'egresos', align: 'right' },
            { header: 'Neto', key: 'neto', align: 'right' },
            { header: 'Acumulado', key: 'acumulado', align: 'right' },
          ]}
          filas={resumen}
        />
      </div>
      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Periodo</th>
              <th className="px-4 py-2 text-right">Ingresos</th>
              <th className="px-4 py-2 text-right">Egresos</th>
              <th className="px-4 py-2 text-right">Neto</th>
              <th className="px-4 py-2 text-right">Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {resumen.map((r) => (
              <tr key={r.periodo} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium">{r.periodo}</td>
                <td className="px-4 py-2 text-right text-accent-700">{formatearMonto(r.ingresos)}</td>
                <td className="px-4 py-2 text-right text-red-600">{formatearMonto(r.egresos)}</td>
                <td className="px-4 py-2 text-right font-medium">{formatearMonto(r.neto)}</td>
                <td className={`px-4 py-2 text-right font-bold ${r.acumulado >= 0 ? 'text-accent-700' : 'text-red-600'}`}>{formatearMonto(r.acumulado)}</td>
              </tr>
            ))}
            {resumen.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Sin proyecciones registradas</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Detalle de conceptos</h2>
        <BotonesExportar
          empresa={empresa}
          titulo="Flujo de Caja Proyectado — Detalle de conceptos"
          nombreArchivo="flujo-proyectado-detalle"
          columnas={[
            { header: 'Periodo', key: 'periodo' },
            { header: 'Categoría', key: 'categoria' },
            { header: 'Concepto', key: 'concepto' },
            { header: 'Monto', key: 'monto_proyectado', align: 'right' },
          ]}
          filas={items}
        />
      </div>
      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Periodo</th>
              <th className="px-4 py-2">Categoría</th>
              <th className="px-4 py-2">Concepto</th>
              <th className="px-4 py-2 text-right">Monto</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{r.periodo}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.categoria === 'ingreso' ? 'bg-accent-100 text-accent-700' : 'bg-red-100 text-red-700'}`}>{r.categoria}</span>
                </td>
                <td className="px-4 py-2">{r.concepto}</td>
                <td className="px-4 py-2 text-right">{formatearMonto(r.monto_proyectado)}</td>
                <td className="px-4 py-2 text-right"><button onClick={() => eliminar(r.id)} className="text-red-600 hover:underline text-xs">Eliminar</button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Sin registros</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
