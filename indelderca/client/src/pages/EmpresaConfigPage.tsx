import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Empresa {
  nombre: string;
  razon_social: string | null;
  rif: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  logo_base64: string | null;
  moneda: string;
  iva_porcentaje_default: number;
  pie_pagina: string | null;
}

export default function EmpresaConfigPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<Empresa | null>(null);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Empresa>('/empresa').then(setForm);
  }, []);

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !form) return;
    const reader = new FileReader();
    reader.onload = () => setForm({ ...form, logo_base64: reader.result as string });
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError(null);
    setOk(false);
    try {
      await api.put('/empresa', {
        nombre: form.nombre,
        razonSocial: form.razon_social,
        rif: form.rif,
        direccion: form.direccion,
        telefono: form.telefono,
        email: form.email,
        logoBase64: form.logo_base64,
        moneda: form.moneda,
        ivaPorcentajeDefault: form.iva_porcentaje_default,
        piePagina: form.pie_pagina,
      });
      setOk(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar');
    }
  }

  if (!form) return <div className="p-6 text-slate-500">Cargando...</div>;
  const soloLectura = user?.rol !== 'admin';

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Datos de la empresa</h1>
      <p className="text-slate-500 mb-6 text-sm">
        Esta información aparece en el encabezado de todos los documentos impresos.
      </p>

      <form onSubmit={onSubmit} className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <fieldset disabled={soloLectura} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre comercial</label>
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Razón social</label>
              <input
                value={form.razon_social ?? ''}
                onChange={(e) => setForm({ ...form, razon_social: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">RIF</label>
              <input
                value={form.rif ?? ''}
                onChange={(e) => setForm({ ...form, rif: e.target.value })}
                placeholder="J-00000000-0"
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <input
                value={form.telefono ?? ''}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Dirección fiscal</label>
              <input
                value={form.direccion ?? ''}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo</label>
              <input
                value={form.email ?? ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
              <input
                value={form.moneda}
                onChange={(e) => setForm({ ...form, moneda: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">% IVA por defecto</label>
              <input
                type="number"
                step="0.01"
                value={form.iva_porcentaje_default}
                onChange={(e) => setForm({ ...form, iva_porcentaje_default: Number(e.target.value) })}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pie de página (impresión)</label>
            <textarea
              value={form.pie_pagina ?? ''}
              onChange={(e) => setForm({ ...form, pie_pagina: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Logo</label>
            <input type="file" accept="image/*" onChange={onLogo} />
            {form.logo_base64 && <img src={form.logo_base64} alt="Logo" className="h-16 mt-2 object-contain" />}
          </div>
        </fieldset>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {ok && <div className="text-sm text-emerald-600">Guardado correctamente.</div>}
        {!soloLectura && (
          <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            Guardar
          </button>
        )}
        {soloLectura && <div className="text-xs text-slate-400">Solo un administrador puede editar estos datos.</div>}
      </form>
    </div>
  );
}
