import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';

interface Tercero {
  id: number;
  tipo: 'cliente' | 'proveedor';
  nombre: string;
  rif: string | null;
}

const VACIO = { tipo: 'cliente' as Tercero['tipo'], nombre: '', rif: '' };

export default function TercerosPage() {
  const { empresaId } = useEmpresa();
  const [items, setItems] = useState<Tercero[]>([]);
  const [form, setForm] = useState(VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [filtro, setFiltro] = useState<'' | 'cliente' | 'proveedor'>('');
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!empresaId) return;
    setItems(await api.get<Tercero[]>(`/terceros?empresaId=${empresaId}`));
  }

  useEffect(() => { cargar(); }, [empresaId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!empresaId) return;
    try {
      await api.post('/terceros', { empresaId, tipo: form.tipo, nombre: form.nombre, rif: form.rif || null });
      setForm(VACIO);
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar');
    }
  }

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar este tercero?')) return;
    try {
      await api.delete(`/terceros/${id}`);
      cargar();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Error al eliminar');
    }
  }

  const visibles = filtro ? items.filter((i) => i.tipo === filtro) : items;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes y Proveedores</h1>
          <p className="text-sm text-slate-500 mt-0.5">Terceros para el subledger de Cuentas por Cobrar y por Pagar.</p>
        </div>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          {mostrarForm ? 'Cancelar' : '+ Nuevo tercero'}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={onSubmit} className="bg-white rounded-lg border border-slate-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as Tercero['tipo'] })} className="rounded-md border border-slate-300 px-3 py-2">
            <option value="cliente">Cliente</option>
            <option value="proveedor">Proveedor</option>
          </select>
          <input required placeholder="Nombre / Razón social" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 md:col-span-2" />
          <input placeholder="RIF (opcional)" value={form.rif} onChange={(e) => setForm({ ...form, rif: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2" />
          {error && <div className="text-sm text-red-600 md:col-span-4">{error}</div>}
          <div className="md:col-span-4">
            <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">Guardar</button>
          </div>
        </form>
      )}

      <div className="flex gap-2 mb-3">
        {(['', 'cliente', 'proveedor'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${filtro === f ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200'}`}
          >
            {f === '' ? 'Todos' : f === 'cliente' ? 'Clientes' : 'Proveedores'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">RIF</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="px-4 py-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${t.tipo === 'cliente' ? 'bg-accent-50 text-accent-700' : 'bg-amber-50 text-amber-700'}`}>
                    {t.tipo === 'cliente' ? 'Cliente' : 'Proveedor'}
                  </span>
                </td>
                <td className="px-4 py-2 font-medium text-slate-700">{t.nombre}</td>
                <td className="px-4 py-2 text-slate-500">{t.rif || '—'}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => eliminar(t.id)} className="text-red-600 hover:underline text-xs">Eliminar</button>
                </td>
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Sin terceros registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
