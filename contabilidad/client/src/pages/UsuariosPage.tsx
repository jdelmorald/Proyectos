import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'operador';
  activo: number;
  empresaIds: number[];
  cedula: string | null;
  cargo: string | null;
  foto_data_url: string | null;
  empresa_principal_id: number | null;
  empresa_principal_nombre: string | null;
}

const VACIO = {
  nombre: '', email: '', password: '', rol: 'operador' as 'admin' | 'operador', empresaIds: [] as number[],
  cedula: '', cargo: '', fotoDataUrl: null as string | null, empresaPrincipalId: '' as number | '',
};

function leerArchivoComoDataUrl(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result as string);
    lector.onerror = () => reject(new Error('No se pudo leer el archivo'));
    lector.readAsDataURL(archivo);
  });
}

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

  async function onFotoChange(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (archivo.size > 1_500_000) {
      setError('La foto es muy pesada (máximo ~1.5 MB). Usa una imagen más liviana.');
      return;
    }
    try {
      const dataUrl = await leerArchivoComoDataUrl(archivo);
      setForm((f) => ({ ...f, fotoDataUrl: dataUrl }));
    } catch {
      setError('No se pudo cargar la foto');
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const comun = {
        nombre: form.nombre, rol: form.rol, empresaIds: form.empresaIds,
        cedula: form.cedula || null, cargo: form.cargo || null, fotoDataUrl: form.fotoDataUrl,
        empresaPrincipalId: form.empresaPrincipalId || null,
      };
      if (editId) {
        const body: Record<string, unknown> = { ...comun };
        if (form.password) body.password = form.password;
        await api.put(`/usuarios/${editId}`, body);
      } else {
        await api.post('/usuarios', { ...comun, email: form.email, password: form.password });
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
    setForm({
      nombre: u.nombre, email: u.email, password: '', rol: u.rol, empresaIds: u.empresaIds,
      cedula: u.cedula ?? '', cargo: u.cargo ?? '', fotoDataUrl: u.foto_data_url,
      empresaPrincipalId: u.empresa_principal_id ?? '',
    });
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
        <div className="flex items-center gap-4">
          {form.fotoDataUrl ? (
            <img src={form.fotoDataUrl} alt="Foto" className="h-14 w-14 rounded-full object-cover border border-slate-200" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-lg font-bold">
              {(form.nombre || '?').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-500 mb-1">Foto de perfil</label>
            <input type="file" accept="image/*" onChange={onFotoChange} className="text-xs" />
          </div>
        </div>

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
          <input
            placeholder="Cédula de identidad"
            value={form.cedula}
            onChange={(e) => setForm({ ...form, cedula: e.target.value })}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            placeholder="Cargo (ej. Analista Contable)"
            value={form.cargo}
            onChange={(e) => setForm({ ...form, cargo: e.target.value })}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
          <select
            value={form.empresaPrincipalId}
            onChange={(e) => setForm({ ...form, empresaPrincipalId: e.target.value ? Number(e.target.value) : '' })}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Empresa (para el perfil)</option>
            {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
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
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Cargo</th>
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
                <td className="px-4 py-2">
                  {u.foto_data_url ? (
                    <img src={u.foto_data_url} alt={u.nombre} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                      {u.nombre.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 font-medium text-slate-700">{u.nombre}</td>
                <td className="px-4 py-2 text-xs text-slate-500">{u.cargo || '—'}</td>
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
