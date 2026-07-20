import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { getDocumentType } from '../config/documentTypes';

interface DocumentoResumen {
  id: number;
  numero: string;
  contactoNombre: string | null;
}

export default function ReferenciaSelect({
  tipos,
  value,
  onChange,
}: {
  tipos: string[];
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const [tipoSeleccionado, setTipoSeleccionado] = useState(tipos[0] ?? '');
  const [items, setItems] = useState<DocumentoResumen[]>([]);

  useEffect(() => {
    if (!tipoSeleccionado) return;
    api.get<DocumentoResumen[]>(`/documentos?tipo=${tipoSeleccionado}&estado=emitido`).then(setItems);
  }, [tipoSeleccionado]);

  return (
    <div className="flex gap-2">
      {tipos.length > 1 && (
        <select
          value={tipoSeleccionado}
          onChange={(e) => {
            setTipoSeleccionado(e.target.value);
            onChange(null);
          }}
          className="rounded-md border border-slate-300 px-2 py-2 text-sm"
        >
          {tipos.map((t) => (
            <option key={t} value={t}>
              {getDocumentType(t)?.label ?? t}
            </option>
          ))}
        </select>
      )}
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="w-full rounded-md border border-slate-300 px-3 py-2"
      >
        <option value="">-- Ninguno --</option>
        {items.map((d) => (
          <option key={d.id} value={d.id}>
            {d.numero} {d.contactoNombre ? `— ${d.contactoNombre}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
