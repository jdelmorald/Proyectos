import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';

interface CentroCosto {
  id: number;
  codigo: string;
  nombre: string;
}

const VACIO = { codigo: '', nombre: '' };

export default function CentrosCostoPage() {
  const { empresaId } = useEmpresa();
  const [items, setItems] = useState<CentroCosto[]>([]);
  const [form, setForm] = useState(VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!empresaId) return;
    setItems(await api.get<CentroCosto[]>(`/centros-costo?empresaId=${empresaId}`));
  }

  useEffect(() => { cargar(); }, [empresaId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!empresaId) return;
    try {
      await api.post('/centros-costo', { empresaId, codigo: form.codigo, nombre: form.nombre });
      setForm(VACIO);
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar');
    }
  }

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar este centro de costo?')) return;
    try {
      await api.delete(`/centros-costo/${id}`);
      cargar();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Error al eliminar');
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Centros de Costo</h1>
          <p className="text-sm text-slate-500 mt-0.5">Áreas, departamentos o proyectos para clasificar los movimientos contables.</p>
        </div>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          {mostrarForm ? 'Cancelar' : '+ Nuevo centro de costo'}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={onSubmit} className="bg-white rounded-lg border border-slate-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <input required placeholder="Código (ej. CC-01)" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2" />
          <input required placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 md:col-span-2" />
          {error && <div className="text-sm text-red-600 md:col-span-3">{error}</div>}
          <div className="md:col-span-3">
            <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">Guardar</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-mono text-xs">{c.codigo}</td>
                <td className="px-4 py-2">{c.nombre}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => eliminar(c.id)} className="text-red-600 hover:underline text-xs">Eliminar</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">Sin centros de costo registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
