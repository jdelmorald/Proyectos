import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Paciente {
  id: number;
  nombre: string;
  cedula: string | null;
}

export default function PacienteSelect({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const [items, setItems] = useState<Paciente[]>([]);

  useEffect(() => {
    api.get<Paciente[]>('/pacientes').then(setItems);
  }, []);

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className="w-full rounded-md border border-slate-300 px-3 py-2"
    >
      <option value="">-- Seleccionar paciente --</option>
      {items.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nombre}
          {p.cedula ? ` (${p.cedula})` : ''}
        </option>
      ))}
    </select>
  );
}
