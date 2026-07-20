import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useEmpresa } from '../context/EmpresaContext';
import { useAuth } from '../context/AuthContext';

interface Empresa {
  id: number;
  nombre: string;
  rif: string | null;
  moneda: string;
  municipio: string | null;
  alicuota_municipal: number;
  valor_ut: number;
}

const VACIO = { nombre: '', rif: '', moneda: 'Bs.', municipio: '', alicuotaMunicipal: '0', valorUt: '0' };

export default function EmpresasConfigPage() {
  const { user } = useAuth();
  const { empresas } = useEmpresa();
  const [items, setItems] = useState<Empresa[]>(empresas);
  const [form, setForm] = useState(VACIO);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        moneda: form.moneda,
        municipio: form.municipio || null,
        alicuotaMunicipal: Number(form.alicuotaMunicipal) || 0,
        valorUt: Number(form.valorUt) || 0,
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

  function editar(e: Empresa) {
    setEditId(e.id);
    setForm({
      nombre: e.nombre,
      rif: e.rif ?? '',
      moneda: e.moneda,
      municipio: e.municipio ?? '',
      alicuotaMunicipal: String(e.alicuota_municipal ?? 0),
      valorUt: String(e.valor_ut ?? 0),
    });
  }

  const soloLectura = user?.rol !== 'admin';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Empresas</h1>

      {!soloLectura && (
        <form onSubmit={onSubmit} className="bg-white rounded-lg border border-slate-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <input required placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2" />
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
          {error && <div className="text-sm text-red-600 md:col-span-3">{error}</div>}
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
              <th className="px-4 py-2">Nombre</th>
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
                <td className="px-4 py-2 font-medium text-slate-700">{e.nombre}</td>
                <td className="px-4 py-2">{e.rif}</td>
                <td className="px-4 py-2">{e.moneda}</td>
                <td className="px-4 py-2">{e.municipio || '—'}</td>
                <td className="px-4 py-2">{e.alicuota_municipal ? `${e.alicuota_municipal}%` : '—'}</td>
                <td className="px-4 py-2">{e.valor_ut ? e.valor_ut.toFixed(2) : '—'}</td>
                {!soloLectura && (
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => editar(e)} className="text-brand-700 hover:underline">Editar</button>
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
