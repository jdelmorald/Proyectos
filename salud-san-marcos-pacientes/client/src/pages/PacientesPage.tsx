import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';

interface Paciente {
  id: number;
  numero_historia: string | null;
  nombre: string;
  cedula: string | null;
  fecha_nacimiento: string | null;
  sexo: 'Masculino' | 'Femenino' | null;
  telefono: string | null;
  direccion: string | null;
  tipo_sangre: string | null;
  alergias: string | null;
  contacto_emergencia_nombre: string | null;
  contacto_emergencia_telefono: string | null;
  seguro: string | null;
  observaciones: string | null;
}

const VACIO = {
  numeroHistoria: '',
  nombre: '',
  cedula: '',
  fechaNacimiento: '',
  sexo: '' as '' | 'Masculino' | 'Femenino',
  telefono: '',
  direccion: '',
  tipoSangre: '',
  alergias: '',
  contactoEmergenciaNombre: '',
  contactoEmergenciaTelefono: '',
  seguro: '',
  observaciones: '',
};

function calcularEdad(fechaNacimiento: string | null): string {
  if (!fechaNacimiento) return '';
  const nacimiento = new Date(fechaNacimiento);
  if (isNaN(nacimiento.getTime())) return '';
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return `${edad} años`;
}

export default function PacientesPage() {
  const [items, setItems] = useState<Paciente[]>([]);
  const [form, setForm] = useState(VACIO);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  async function cargar() {
    setItems(await api.get<Paciente[]>(`/pacientes${q ? `?q=${encodeURIComponent(q)}` : ''}`));
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
    const payload = { ...form, sexo: form.sexo || null };
    try {
      if (editId) await api.put(`/pacientes/${editId}`, payload);
      else await api.post('/pacientes', payload);
      setForm(VACIO);
      setEditId(null);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar');
    }
  }

  function editar(p: Paciente) {
    setEditId(p.id);
    setForm({
      numeroHistoria: p.numero_historia ?? '',
      nombre: p.nombre,
      cedula: p.cedula ?? '',
      fechaNacimiento: p.fecha_nacimiento ?? '',
      sexo: p.sexo ?? '',
      telefono: p.telefono ?? '',
      direccion: p.direccion ?? '',
      tipoSangre: p.tipo_sangre ?? '',
      alergias: p.alergias ?? '',
      contactoEmergenciaNombre: p.contacto_emergencia_nombre ?? '',
      contactoEmergenciaTelefono: p.contacto_emergencia_telefono ?? '',
      seguro: p.seguro ?? '',
      observaciones: p.observaciones ?? '',
    });
  }

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar este paciente del registro? (se marcará como inactivo)')) return;
    await api.delete(`/pacientes/${id}`);
    cargar();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Pacientes</h1>

      <form onSubmit={onSubmit} className="bg-white rounded-lg border border-slate-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          placeholder="N° de historia (opcional)"
          value={form.numeroHistoria}
          onChange={(e) => setForm({ ...form, numeroHistoria: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          required
          placeholder="Nombre completo"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2 md:col-span-2"
        />
        <input
          placeholder="Cédula"
          value={form.cedula}
          onChange={(e) => setForm({ ...form, cedula: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <div>
          <label className="block text-xs text-slate-500 mb-1">Fecha de nacimiento</label>
          <input
            type="date"
            value={form.fechaNacimiento}
            onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <select
          value={form.sexo}
          onChange={(e) => setForm({ ...form, sexo: e.target.value as typeof form.sexo })}
          className="rounded-md border border-slate-300 px-3 py-2"
        >
          <option value="">Sexo</option>
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
        </select>
        <input
          placeholder="Teléfono"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          placeholder="Tipo de sangre"
          value={form.tipoSangre}
          onChange={(e) => setForm({ ...form, tipoSangre: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          placeholder="Dirección"
          value={form.direccion}
          onChange={(e) => setForm({ ...form, direccion: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2 md:col-span-2"
        />
        <input
          placeholder="Seguro / Aseguradora"
          value={form.seguro}
          onChange={(e) => setForm({ ...form, seguro: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <textarea
          placeholder="Alergias"
          value={form.alergias}
          onChange={(e) => setForm({ ...form, alergias: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2 md:col-span-2"
          rows={2}
        />
        <input
          placeholder="Contacto de emergencia — Nombre"
          value={form.contactoEmergenciaNombre}
          onChange={(e) => setForm({ ...form, contactoEmergenciaNombre: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          placeholder="Contacto de emergencia — Teléfono"
          value={form.contactoEmergenciaTelefono}
          onChange={(e) => setForm({ ...form, contactoEmergenciaTelefono: e.target.value })}
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
            {editId ? 'Guardar cambios' : 'Agregar paciente'}
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
        placeholder="Buscar por nombre, cédula o N° de historia..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-3 rounded-md border border-slate-300 px-3 py-2 w-full max-w-sm"
      />

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">N° Historia</th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Cédula</th>
              <th className="px-4 py-2">Edad</th>
              <th className="px-4 py-2">Tipo de sangre</th>
              <th className="px-4 py-2">Teléfono</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{p.numero_historia}</td>
                <td className="px-4 py-2 font-medium text-slate-700">{p.nombre}</td>
                <td className="px-4 py-2">{p.cedula}</td>
                <td className="px-4 py-2">{calcularEdad(p.fecha_nacimiento)}</td>
                <td className="px-4 py-2">{p.tipo_sangre}</td>
                <td className="px-4 py-2">{p.telefono}</td>
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
