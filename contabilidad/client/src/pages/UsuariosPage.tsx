import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'operador';
  activo: number;
}

const VACIO: { nombre: string; email: string; password: string; rol: 'admin' | 'operador' } = {
  nombre: '',
  email: '',
  password: '',
  rol: 'operador',
};

export default function UsuariosPage() {
  const [items, setItems] = useState<Usuario[]>([]);
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    setItems(await api.get<Usuario[]>('/usuarios'));
  }

  useEffect(() => {
    cargar();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/usuarios', form);
      setForm(VACIO);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al crear usuario');
    }
  }

  async function toggleActivo(u: Usuario) {
    await api.put(`/usuarios/${u.id}`, { activo: !u.activo });
    cargar();
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Usuarios</h1>

      <form onSubmit={onSubmit} className="bg-white rounded-lg border border-slate-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <input
          required
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          required
          type="email"
          placeholder="Correo"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          required
          type="password"
          placeholder="Contraseña temporal"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <select
          value={form.rol}
          onChange={(e) => setForm({ ...form, rol: e.target.value as 'admin' | 'operador' })}
          className="rounded-md border border-slate-300 px-3 py-2"
        >
          <option value="operador">Operador</option>
          <option value="admin">Administrador</option>
        </select>
        {error && <div className="text-sm text-red-600 md:col-span-4">{error}</div>}
        <div className="md:col-span-4">
          <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            Crear usuario
          </button>
        </div>
      </form>

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Correo</th>
              <th className="px-4 py-2">Rol</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-700">{u.nombre}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2 capitalize">{u.rol}</td>
                <td className="px-4 py-2">{u.activo ? 'Activo' : 'Inactivo'}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => toggleActivo(u)} className="text-brand-700 hover:underline">
                    {u.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
