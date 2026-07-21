import { ChangeEvent, FormEvent, useState } from 'react';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

function leerArchivoComoDataUrl(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result as string);
    lector.onerror = () => reject(new Error('No se pudo leer el archivo'));
    lector.readAsDataURL(archivo);
  });
}

const ROL_LABEL: Record<string, string> = { admin: 'Administrador', operador: 'Operador' };

export default function PerfilPage() {
  const { user, actualizarPerfil } = useAuth();
  const [nombre, setNombre] = useState(user?.nombre ?? '');
  const [cedula, setCedula] = useState(user?.cedula ?? '');
  const [cargo, setCargo] = useState(user?.cargo ?? '');
  const [foto, setFoto] = useState<string | null>(user?.fotoDataUrl ?? null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFotoChange(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (archivo.size > 1_500_000) {
      setError('La foto es muy pesada (máximo ~1.5 MB). Usa una imagen más liviana.');
      return;
    }
    try {
      setFoto(await leerArchivoComoDataUrl(archivo));
    } catch {
      setError('No se pudo cargar la foto');
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    setGuardando(true);
    try {
      await actualizarPerfil({ nombre, cedula: cedula || null, cargo: cargo || null, fotoDataUrl: foto });
      setMensaje('Perfil actualizado.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar el perfil');
    } finally {
      setGuardando(false);
    }
  }

  if (!user) return null;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Mi Perfil</h1>

      <form onSubmit={onSubmit} className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
        <div className="flex items-center gap-5">
          {foto ? (
            <img src={foto} alt="Foto de perfil" className="h-20 w-20 rounded-full object-cover border border-slate-200" />
          ) : (
            <div className="h-20 w-20 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-2xl font-bold">
              {nombre.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-500 mb-1">Foto de perfil</label>
            <input type="file" accept="image/*" onChange={onFotoChange} className="text-xs" />
            {foto && (
              <button type="button" onClick={() => setFoto(null)} className="block mt-1 text-xs text-slate-400 hover:text-red-600">
                Quitar foto
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nombre completo</label>
            <input required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Cédula de identidad</label>
            <input value={cedula} onChange={(e) => setCedula(e.target.value)} placeholder="V-12.345.678" className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Cargo</label>
            <input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Analista Contable" className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Correo</label>
            <input disabled value={user.email} className="w-full rounded-md border border-slate-200 bg-slate-50 text-slate-400 px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Rol</label>
            <input disabled value={ROL_LABEL[user.rol]} className="w-full rounded-md border border-slate-200 bg-slate-50 text-slate-400 px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Empresa</label>
            <input disabled value={user.empresaPrincipalNombre || '— no asignada —'} className="w-full rounded-md border border-slate-200 bg-slate-50 text-slate-400 px-3 py-2" />
          </div>
        </div>
        <p className="text-xs text-slate-400">
          El correo, el rol y la empresa los asigna un administrador desde Configuración → Usuarios.
        </p>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {mensaje && <div className="text-sm text-accent-700">{mensaje}</div>}
        <button type="submit" disabled={guardando} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-5 py-2 rounded-md text-sm font-medium">
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
