import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';
import { useAuth } from '../context/AuthContext';

interface Empresa {
  id: number;
  nombre: string;
  rif: string | null;
  razon_social: string | null;
  moneda: string;
  municipio: string | null;
  alicuota_municipal: number;
  valor_ut: number;
  logo_data_url: string | null;
  color: string;
}

const VACIO = {
  nombre: '', rif: '', razonSocial: '', moneda: 'Bs.', municipio: '', alicuotaMunicipal: '0', valorUt: '0',
  logoDataUrl: null as string | null, color: '#0f766e',
};

function leerArchivoComoDataUrl(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result as string);
    lector.onerror = () => reject(new Error('No se pudo leer el archivo'));
    lector.readAsDataURL(archivo);
  });
}

export default function EmpresasConfigPage() {
  const { user } = useAuth();
  const { empresas } = useEmpresa();
  const [items, setItems] = useState<Empresa[]>(empresas);
  const [form, setForm] = useState(VACIO);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoBusyId, setDemoBusyId] = useState<number | null>(null);
  const [demoMsg, setDemoMsg] = useState<string | null>(null);

  async function cargar() {
    setItems(await api.get<Empresa[]>('/empresas'));
  }

  useEffect(() => { cargar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const body = {
        nombre: form.nombre,
        rif: form.rif || null,
        razonSocial: form.razonSocial || null,
        moneda: form.moneda,
        municipio: form.municipio || null,
        alicuotaMunicipal: Number(form.alicuotaMunicipal) || 0,
        valorUt: Number(form.valorUt) || 0,
        logoDataUrl: form.logoDataUrl,
        color: form.color,
      };
      if (editId) await api.put(`/empresas/${editId}`, body);
      else await api.post('/empresas', body);
      setForm(VACIO);
      setEditId(null);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar');
    }
  }

  async function onLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (archivo.size > 1_500_000) {
      setError('El logo es muy pesado (máximo ~1.5 MB). Usa una imagen más liviana.');
      return;
    }
    try {
      const dataUrl = await leerArchivoComoDataUrl(archivo);
      setForm((f) => ({ ...f, logoDataUrl: dataUrl }));
    } catch {
      setError('No se pudo cargar el logo');
    }
  }

  function editar(e: Empresa) {
    setEditId(e.id);
    setForm({
      nombre: e.nombre,
      rif: e.rif ?? '',
      razonSocial: e.razon_social ?? '',
      moneda: e.moneda,
      municipio: e.municipio ?? '',
      alicuotaMunicipal: String(e.alicuota_municipal ?? 0),
      valorUt: String(e.valor_ut ?? 0),
      logoDataUrl: e.logo_data_url,
      color: e.color || '#0f766e',
    });
  }

  async function eliminar(e: Empresa) {
    if (!window.confirm(`¿Eliminar la empresa "${e.nombre}"? Dejará de aparecer en todo el sistema.`)) return;
    setError(null);
    try {
      await api.delete(`/empresas/${e.id}`);
      if (editId === e.id) { setEditId(null); setForm(VACIO); }
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al eliminar');
    }
  }

  async function cargarDatosDemo(e: Empresa) {
    if (!window.confirm(`¿Cargar asientos de ejemplo en "${e.nombre}"? Se agregarán movimientos ficticios de prueba (marcados como [DEMO]) para explorar el sistema.`)) return;
    setDemoMsg(null);
    setDemoBusyId(e.id);
    try {
      await api.post(`/empresas/${e.id}/datos-demo`);
      setDemoMsg(`Datos de ejemplo cargados en ${e.nombre}.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar los datos de ejemplo');
    } finally {
      setDemoBusyId(null);
    }
  }

  async function quitarDatosDemo(e: Empresa) {
    if (!window.confirm(`¿Quitar los datos de ejemplo de "${e.nombre}"? Los asientos [DEMO] quedarán anulados (no se borran, según el criterio del sistema).`)) return;
    setDemoMsg(null);
    setDemoBusyId(e.id);
    try {
      const r = await api.delete<{ anulados: number }>(`/empresas/${e.id}/datos-demo`);
      setDemoMsg(`${r.anulados} asiento(s) de ejemplo anulados en ${e.nombre}.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al quitar los datos de ejemplo');
    } finally {
      setDemoBusyId(null);
    }
  }

  const soloLectura = user?.rol !== 'admin';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Empresas</h1>

      {!soloLectura && (
        <form onSubmit={onSubmit} className="bg-white rounded-lg border border-slate-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <input required placeholder="Nombre o siglas de la marca" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2" />
          <input placeholder="Razón social" value={form.razonSocial} onChange={(e) => setForm({ ...form, razonSocial: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2" />
          <input placeholder="RIF" value={form.rif} onChange={(e) => setForm({ ...form, rif: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2" />
          <input placeholder="Moneda (símbolo a mostrar)" value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2" />
          <input placeholder="Municipio (para impuesto municipal)" value={form.municipio} onChange={(e) => setForm({ ...form, municipio: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2" />
          <div>
            <label className="block text-xs text-slate-500 mb-1">Alícuota impuesto municipal (%)</label>
            <input type="number" step="0.01" min="0" value={form.alicuotaMunicipal} onChange={(e) => setForm({ ...form, alicuotaMunicipal: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Valor de la Unidad Tributaria (Bs.)</label>
            <input type="number" step="0.01" min="0" value={form.valorUt} onChange={(e) => setForm({ ...form, valorUt: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Logo (para la pantalla de selección de empresa)</label>
            <div className="flex items-center gap-2">
              {form.logoDataUrl && <img src={form.logoDataUrl} alt="Logo" className="h-9 w-9 object-contain rounded border border-slate-200" />}
              <input type="file" accept="image/*" onChange={onLogoChange} className="text-xs w-full" />
              {form.logoDataUrl && (
                <button type="button" onClick={() => setForm((f) => ({ ...f, logoDataUrl: null }))} className="text-xs text-slate-400 hover:text-red-600">Quitar</button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Color de la empresa</label>
            <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-9 w-16 rounded-md border border-slate-300" />
          </div>
          {error && <div className="text-sm text-red-600 md:col-span-3">{error}</div>}
          {demoMsg && <div className="text-sm text-accent-700 md:col-span-3">{demoMsg}</div>}
          <div className="md:col-span-3 flex gap-2">
            <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              {editId ? 'Guardar cambios' : 'Agregar empresa'}
            </button>
            {editId && (
              <button type="button" onClick={() => { setEditId(null); setForm(VACIO); }} className="px-4 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-100">
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Logo</th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Razón Social</th>
              <th className="px-4 py-2">RIF</th>
              <th className="px-4 py-2">Moneda</th>
              <th className="px-4 py-2">Municipio</th>
              <th className="px-4 py-2">Alícuota Municipal</th>
              <th className="px-4 py-2">Valor UT</th>
              {!soloLectura && <th className="px-4 py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  {e.logo_data_url ? (
                    <img src={e.logo_data_url} alt={e.nombre} className="h-8 w-8 object-contain" />
                  ) : (
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: e.color || '#0f766e' }}>
                      {e.nombre.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 font-medium text-slate-700">{e.nombre}</td>
                <td className="px-4 py-2 text-xs text-slate-500">{e.razon_social || '—'}</td>
                <td className="px-4 py-2">{e.rif}</td>
                <td className="px-4 py-2">{e.moneda}</td>
                <td className="px-4 py-2">{e.municipio || '—'}</td>
                <td className="px-4 py-2">{e.alicuota_municipal ? `${e.alicuota_municipal}%` : '—'}</td>
                <td className="px-4 py-2">{e.valor_ut ? e.valor_ut.toFixed(2) : '—'}</td>
                {!soloLectura && (
                  <td className="px-4 py-2 text-right whitespace-nowrap space-x-3">
                    <button onClick={() => editar(e)} className="text-brand-700 hover:underline">Editar</button>
                    <button
                      onClick={() => cargarDatosDemo(e)}
                      disabled={demoBusyId === e.id}
                      className="text-accent-700 hover:underline disabled:opacity-50"
                    >
                      Cargar datos de ejemplo
                    </button>
                    <button
                      onClick={() => quitarDatosDemo(e)}
                      disabled={demoBusyId === e.id}
                      className="text-slate-500 hover:underline disabled:opacity-50"
                    >
                      Quitar datos de ejemplo
                    </button>
                    <button onClick={() => eliminar(e)} className="text-red-600 hover:underline">Eliminar</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
