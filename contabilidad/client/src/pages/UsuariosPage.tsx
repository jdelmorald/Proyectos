import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'operador';
  activo: number;
  empresaIds: number[];
}

const VACIO = {
  nombre: '', email: '', password: '', rol: 'operador' as 'admin' | 'operador', empresaIds: [] as number[],
};

export default function UsuariosPage() {
  const { empresas } = useEmpresa();
  const [items, setItems] = useState<Usuario[]>([]);
  const [form, setForm] = useState(VACIO);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    setItems(await api.get<Usuario[]>('/usuarios'));
  }

  useEffect(() => {
    cargar();
  }, []);

  function alternarEmpresa(empresaId: number) {
    setForm((f) => ({
      ...f,
      empresaIds: f.empresaIds.includes(empresaId) ? f.empresaIds.filter((id) => id !== empresaId) : [...f.empresaIds, empresaId],
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editId) {
        const body: Record<string, unknown> = { nombre: form.nombre, rol: form.rol, empresaIds: form.empresaIds };
        if (form.password) body.password = form.password;
        await api.put(`/usuarios/${editId}`, body);
      } else {
        await api.post('/usuarios', form);
      }
      setForm(VACIO);
      setEditId(null);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar');
    }
  }

  function editar(u: Usuario) {
    setEditId(u.id);
    setForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol, empresaIds: u.empresaIds });
    setError(null);
  }

  function cancelar() {
    setEditId(null);
    setForm(VACIO);
    setError(null);
  }

  async function toggleActivo(u: Usuario) {
    await api.put(`/usuarios/${u.id}`, { activo: !u.activo });
    cargar();
  }

  function nombresEmpresas(ids: number[]): string {
    if (ids.length === 0) return '— sin acceso a ninguna empresa —';
    return empresas.filter((e) => ids.includes(e.id)).map((e) => e.nombre).join(', ');
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Usuarios</h1>

      <form onSubmit={onSubmit} className="bg-white rounded-lg border border-slate-200 p-4 mb-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <input
            required
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            required
            disabled={!!editId}
            type="email"
            placeholder="Correo"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100 disabled:text-slate-400"
          />
          <input
            required={!editId}
            type="password"
            placeholder={editId ? 'Nueva contraseña (opcional)' : 'Contraseña temporal'}
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
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5">
            Empresas a las que tiene acceso (si no marcas ninguna, no podrá ver ninguna empresa)
          </label>
          <div className="flex flex-wrap gap-3">
            {empresas.map((e) => (
              <label key={e.id} className="flex items-center gap-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 cursor-pointer">
                <input type="checkbox" checked={form.empresaIds.includes(e.id)} onChange={() => alternarEmpresa(e.id)} />
                {e.nombre}
              </label>
            ))}
            {empresas.length === 0 && <span className="text-sm text-slate-400">No hay empresas registradas todavía.</span>}
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex gap-2">
          <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            {editId ? 'Guardar cambios' : 'Crear usuario'}
          </button>
          {editId && (
            <button type="button" onClick={cancelar} className="px-4 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-100">
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Correo</th>
              <th className="px-4 py-2">Rol</th>
              <th className="px-4 py-2">Empresas</th>
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
                <td className="px-4 py-2 text-xs text-slate-500 max-w-xs">{nombresEmpresas(u.empresaIds)}</td>
                <td className="px-4 py-2">{u.activo ? 'Activo' : 'Inactivo'}</td>
                <td className="px-4 py-2 text-right whitespace-nowrap space-x-3">
                  <button onClick={() => editar(u)} className="text-brand-700 hover:underline">Editar</button>
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
