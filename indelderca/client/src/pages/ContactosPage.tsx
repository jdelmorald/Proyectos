import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';

interface Contacto {
  id: number;
  tipo: 'cliente' | 'proveedor';
  nombre: string;
  rif_cedula: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  contacto_nombre: string | null;
}

const VACIO = { nombre: '', rifCedula: '', direccion: '', telefono: '', email: '', contactoNombre: '' };

export default function ContactosPage({ tipo }: { tipo: 'cliente' | 'proveedor' }) {
  const [items, setItems] = useState<Contacto[]>([]);
  const [form, setForm] = useState(VACIO);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  async function cargar() {
    const data = await api.get<Contacto[]>(`/contactos?tipo=${tipo}${q ? `&q=${encodeURIComponent(q)}` : ''}`);
    setItems(data);
  }

  useEffect(() => {
    cargar();
    setForm(VACIO);
    setEditId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editId) {
        await api.put(`/contactos/${editId}`, { tipo, ...form });
      } else {
        await api.post('/contactos', { tipo, ...form });
      }
      setForm(VACIO);
      setEditId(null);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar');
    }
  }

  function editar(c: Contacto) {
    setEditId(c.id);
    setForm({
      nombre: c.nombre,
      rifCedula: c.rif_cedula ?? '',
      direccion: c.direccion ?? '',
      telefono: c.telefono ?? '',
      email: c.email ?? '',
      contactoNombre: c.contacto_nombre ?? '',
    });
  }

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar este registro? (se marcará como inactivo)')) return;
    await api.delete(`/contactos/${id}`);
    cargar();
  }

  const titulo = tipo === 'cliente' ? 'Clientes' : 'Proveedores';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">{titulo}</h1>

      <form onSubmit={onSubmit} className="bg-white rounded-lg border border-slate-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          required
          placeholder="Nombre / Razón social"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          placeholder="RIF / Cédula"
          value={form.rifCedula}
          onChange={(e) => setForm({ ...form, rifCedula: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          placeholder="Teléfono"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          placeholder="Correo"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          placeholder="Dirección"
          value={form.direccion}
          onChange={(e) => setForm({ ...form, direccion: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2 md:col-span-2"
        />
        <input
          placeholder="Persona de contacto"
          value={form.contactoNombre}
          onChange={(e) => setForm({ ...form, contactoNombre: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        {error && <div className="text-sm text-red-600 md:col-span-3">{error}</div>}
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

      <input
        placeholder="Buscar..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-3 rounded-md border border-slate-300 px-3 py-2 w-full max-w-xs"
      />

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">RIF/Cédula</th>
              <th className="px-4 py-2">Teléfono</th>
              <th className="px-4 py-2">Correo</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-700">{c.nombre}</td>
                <td className="px-4 py-2">{c.rif_cedula}</td>
                <td className="px-4 py-2">{c.telefono}</td>
                <td className="px-4 py-2">{c.email}</td>
                <td className="px-4 py-2 text-right space-x-3">
                  <button onClick={() => editar(c)} className="text-brand-700 hover:underline">
                    Editar
                  </button>
                  <button onClick={() => eliminar(c.id)} className="text-red-600 hover:underline">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
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
