import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';

interface Producto {
  id: number;
  codigo: string | null;
  descripcion: string;
  unidad: string;
  precio_unitario: number;
  exento_iva: number;
}

const VACIO = { codigo: '', descripcion: '', unidad: 'Unidad', precioUnitario: 0, exentoIva: false };

export default function ProductosPage() {
  const [items, setItems] = useState<Producto[]>([]);
  const [form, setForm] = useState(VACIO);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    setItems(await api.get<Producto[]>('/productos'));
  }

  useEffect(() => {
    cargar();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editId) await api.put(`/productos/${editId}`, form);
      else await api.post('/productos', form);
      setForm(VACIO);
      setEditId(null);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar');
    }
  }

  function editar(p: Producto) {
    setEditId(p.id);
    setForm({
      codigo: p.codigo ?? '',
      descripcion: p.descripcion,
      unidad: p.unidad,
      precioUnitario: p.precio_unitario,
      exentoIva: !!p.exento_iva,
    });
  }

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar este producto?')) return;
    await api.delete(`/productos/${id}`);
    cargar();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Productos / Servicios</h1>

      <form onSubmit={onSubmit} className="bg-white rounded-lg border border-slate-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <input
          placeholder="Código"
          value={form.codigo}
          onChange={(e) => setForm({ ...form, codigo: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          required
          placeholder="Descripción"
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2 md:col-span-2"
        />
        <input
          placeholder="Unidad"
          value={form.unidad}
          onChange={(e) => setForm({ ...form, unidad: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          type="number"
          step="0.01"
          placeholder="Precio"
          value={form.precioUnitario}
          onChange={(e) => setForm({ ...form, precioUnitario: Number(e.target.value) })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <label className="flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
          <input
            type="checkbox"
            checked={form.exentoIva}
            onChange={(e) => setForm({ ...form, exentoIva: e.target.checked })}
          />
          Exento de IVA
        </label>
        {error && <div className="text-sm text-red-600 md:col-span-5">{error}</div>}
        <div className="md:col-span-3 flex gap-2">
          <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            {editId ? 'Guardar cambios' : 'Agregar'}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => { setEditId(null); setForm(VACIO); }}
              className="px-4 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Descripción</th>
              <th className="px-4 py-2">Unidad</th>
              <th className="px-4 py-2">Precio</th>
              <th className="px-4 py-2">Exento</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{p.codigo}</td>
                <td className="px-4 py-2 font-medium text-slate-700">{p.descripcion}</td>
                <td className="px-4 py-2">{p.unidad}</td>
                <td className="px-4 py-2">{p.precio_unitario.toFixed(2)}</td>
                <td className="px-4 py-2">{p.exento_iva ? 'Sí' : 'No'}</td>
                <td className="px-4 py-2 text-right space-x-3">
                  <button onClick={() => editar(p)} className="text-brand-700 hover:underline">
                    Editar
                  </button>
                  <button onClick={() => eliminar(p.id)} className="text-red-600 hover:underline">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Sin registros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
