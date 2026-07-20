import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';

interface Activo {
  id: number;
  codigo: string | null;
  nombre: string;
  categoria: string | null;
  marca_modelo: string | null;
  numero_serie: string | null;
  ubicacion: string | null;
  estado: 'Operativo' | 'En mantenimiento' | 'Fuera de servicio' | 'De baja';
  responsable: string | null;
  fecha_adquisicion: string | null;
  valor_adquisicion: number | null;
  proveedor: string | null;
  observaciones: string | null;
}

const ESTADOS = ['Operativo', 'En mantenimiento', 'Fuera de servicio', 'De baja'] as const;

const ESTADO_COLOR: Record<string, string> = {
  Operativo: 'bg-emerald-100 text-emerald-700',
  'En mantenimiento': 'bg-amber-100 text-amber-700',
  'Fuera de servicio': 'bg-slate-200 text-slate-600',
  'De baja': 'bg-red-100 text-red-700',
};

const VACIO = {
  codigo: '',
  nombre: '',
  categoria: '',
  marcaModelo: '',
  numeroSerie: '',
  ubicacion: '',
  estado: 'Operativo' as (typeof ESTADOS)[number],
  responsable: '',
  fechaAdquisicion: '',
  valorAdquisicion: '',
  proveedor: '',
  observaciones: '',
};

export default function ActivosPage() {
  const [items, setItems] = useState<Activo[]>([]);
  const [form, setForm] = useState(VACIO);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  async function cargar() {
    setItems(await api.get<Activo[]>(`/activos${q ? `?q=${encodeURIComponent(q)}` : ''}`));
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      ...form,
      valorAdquisicion: form.valorAdquisicion === '' ? null : Number(form.valorAdquisicion),
    };
    try {
      if (editId) await api.put(`/activos/${editId}`, payload);
      else await api.post('/activos', payload);
      setForm(VACIO);
      setEditId(null);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar');
    }
  }

  function editar(a: Activo) {
    setEditId(a.id);
    setForm({
      codigo: a.codigo ?? '',
      nombre: a.nombre,
      categoria: a.categoria ?? '',
      marcaModelo: a.marca_modelo ?? '',
      numeroSerie: a.numero_serie ?? '',
      ubicacion: a.ubicacion ?? '',
      estado: a.estado,
      responsable: a.responsable ?? '',
      fechaAdquisicion: a.fecha_adquisicion ?? '',
      valorAdquisicion: a.valor_adquisicion != null ? String(a.valor_adquisicion) : '',
      proveedor: a.proveedor ?? '',
      observaciones: a.observaciones ?? '',
    });
  }

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar este activo del registro? (se marcará como inactivo)')) return;
    await api.delete(`/activos/${id}`);
    cargar();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Control de Activos</h1>
      <p className="text-sm text-slate-500 mb-4">
        Registro de equipos, mobiliario e instrumental para el control de activos fijos de la clínica.
      </p>

      <form onSubmit={onSubmit} className="bg-white rounded-lg border border-slate-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          placeholder="Código de activo"
          value={form.codigo}
          onChange={(e) => setForm({ ...form, codigo: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          required
          placeholder="Nombre / Descripción"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2 md:col-span-2"
        />
        <input
          placeholder="Categoría (equipo médico, mobiliario...)"
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          placeholder="Marca / Modelo"
          value={form.marcaModelo}
          onChange={(e) => setForm({ ...form, marcaModelo: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          placeholder="N° de serie"
          value={form.numeroSerie}
          onChange={(e) => setForm({ ...form, numeroSerie: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          placeholder="Ubicación"
          value={form.ubicacion}
          onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <select
          value={form.estado}
          onChange={(e) => setForm({ ...form, estado: e.target.value as (typeof ESTADOS)[number] })}
          className="rounded-md border border-slate-300 px-3 py-2"
        >
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <input
          placeholder="Responsable asignado"
          value={form.responsable}
          onChange={(e) => setForm({ ...form, responsable: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <div>
          <label className="block text-xs text-slate-500 mb-1">Fecha de adquisición</label>
          <input
            type="date"
            value={form.fechaAdquisicion}
            onChange={(e) => setForm({ ...form, fechaAdquisicion: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <input
          type="number"
          step="0.01"
          placeholder="Valor de adquisición"
          value={form.valorAdquisicion}
          onChange={(e) => setForm({ ...form, valorAdquisicion: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          placeholder="Proveedor"
          value={form.proveedor}
          onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <textarea
          placeholder="Observaciones"
          value={form.observaciones}
          onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2 md:col-span-4"
          rows={2}
        />
        {error && <div className="text-sm text-red-600 md:col-span-4">{error}</div>}
        <div className="md:col-span-4 flex gap-2">
          <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            {editId ? 'Guardar cambios' : 'Agregar activo'}
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
        placeholder="Buscar por nombre, código o N° de serie..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-3 rounded-md border border-slate-300 px-3 py-2 w-full max-w-sm"
      />

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Categoría</th>
              <th className="px-4 py-2">Ubicación</th>
              <th className="px-4 py-2">Responsable</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{a.codigo}</td>
                <td className="px-4 py-2 font-medium text-slate-700">{a.nombre}</td>
                <td className="px-4 py-2">{a.categoria}</td>
                <td className="px-4 py-2">{a.ubicacion}</td>
                <td className="px-4 py-2">{a.responsable}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLOR[a.estado]}`}>{a.estado}</span>
                </td>
                <td className="px-4 py-2 text-right space-x-3">
                  <button onClick={() => editar(a)} className="text-brand-700 hover:underline">
                    Editar
                  </button>
                  <button onClick={() => eliminar(a.id)} className="text-red-600 hover:underline">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
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
