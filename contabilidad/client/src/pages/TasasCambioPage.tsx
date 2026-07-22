import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { formatearMonto } from '../utils/formato';

interface Tasa {
  id: number;
  fecha: string;
  moneda: 'USD' | 'COP' | 'EUR';
  tasa: number;
}

const hoy = () => new Date().toISOString().slice(0, 10);
const VACIO = { fecha: hoy(), moneda: 'USD' as Tasa['moneda'], tasa: '' };

export default function TasasCambioPage() {
  const [items, setItems] = useState<Tasa[]>([]);
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    setItems(await api.get<Tasa[]>('/tasas-cambio'));
  }

  useEffect(() => { cargar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/tasas-cambio', { fecha: form.fecha, moneda: form.moneda, tasa: Number(form.tasa) });
      setForm({ ...VACIO, fecha: form.fecha });
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar');
    }
  }

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar esta tasa?')) return;
    await api.delete(`/tasas-cambio/${id}`);
    cargar();
  }

  const ultimaPorMoneda = (['USD', 'COP', 'EUR'] as const).map((m) => items.find((i) => i.moneda === m));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-display font-semibold text-slate-800">Tasas de Cambio</h1>
        <p className="text-sm text-slate-500 mt-0.5">Tasas diarias para registrar asientos en moneda extranjera (USD, COP, EUR frente al Bolívar).</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {ultimaPorMoneda.map((t, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="text-xs text-slate-400">{(['USD', 'COP', 'EUR'] as const)[i]}</div>
            <div className="text-xl font-bold text-brand-900">{t ? formatearMonto(t.tasa, 4) : '—'}</div>
            <div className="text-[11px] text-slate-400">{t ? `Al ${t.fecha}` : 'Sin tasa registrada'}</div>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-lg border border-slate-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Fecha</label>
          <input type="date" required value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Moneda</label>
          <select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value as Tasa['moneda'] })} className="w-full rounded-md border border-slate-300 px-3 py-2">
            <option value="USD">USD — Dólar</option>
            <option value="COP">COP — Peso Colombiano</option>
            <option value="EUR">EUR — Euro</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Tasa (Bs. por unidad)</label>
          <input type="number" step="0.0001" required min="0" value={form.tasa} onChange={(e) => setForm({ ...form, tasa: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2" />
        </div>
        <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">Guardar tasa</button>
        {error && <div className="text-sm text-red-600 md:col-span-4">{error}</div>}
      </form>

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Moneda</th>
              <th className="px-4 py-2 text-right">Tasa</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{t.fecha}</td>
                <td className="px-4 py-2">{t.moneda}</td>
                <td className="px-4 py-2 text-right">{formatearMonto(t.tasa, 4)}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => eliminar(t.id)} className="text-red-600 hover:underline text-xs">Eliminar</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Sin tasas registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
