import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Contacto {
  id: number;
  nombre: string;
  rif_cedula: string | null;
}

export default function ContactoSelect({
  tipo,
  value,
  onChange,
}: {
  tipo: 'cliente' | 'proveedor';
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const [items, setItems] = useState<Contacto[]>([]);

  useEffect(() => {
    api.get<Contacto[]>(`/contactos?tipo=${tipo}`).then(setItems);
  }, [tipo]);

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className="w-full rounded-md border border-slate-300 px-3 py-2"
    >
      <option value="">-- Seleccionar {tipo === 'cliente' ? 'cliente' : 'proveedor'} --</option>
      {items.map((c) => (
        <option key={c.id} value={c.id}>
          {c.nombre}
          {c.rif_cedula ? ` (${c.rif_cedula})` : ''}
        </option>
      ))}
    </select>
  );
}
