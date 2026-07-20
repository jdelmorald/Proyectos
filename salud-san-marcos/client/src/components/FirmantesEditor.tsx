export interface Firmante {
  nombre: string;
  cargo?: string;
  cedula?: string;
}

export default function FirmantesEditor({
  firmantes,
  onChange,
  disabled,
}: {
  firmantes: Firmante[];
  onChange: (f: Firmante[]) => void;
  disabled?: boolean;
}) {
  function actualizar(i: number, cambios: Partial<Firmante>) {
    onChange(firmantes.map((f, idx) => (idx === i ? { ...f, ...cambios } : f)));
  }
  function agregar() {
    onChange([...firmantes, { nombre: '', cargo: '', cedula: '' }]);
  }
  function eliminar(i: number) {
    onChange(firmantes.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">Firmantes</label>
      <div className="space-y-2">
        {firmantes.map((f, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
            <input
              disabled={disabled}
              placeholder="Nombre"
              value={f.nombre}
              onChange={(e) => actualizar(i, { nombre: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-50"
            />
            <input
              disabled={disabled}
              placeholder="Cargo"
              value={f.cargo ?? ''}
              onChange={(e) => actualizar(i, { cargo: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-50"
            />
            <input
              disabled={disabled}
              placeholder="Cédula"
              value={f.cedula ?? ''}
              onChange={(e) => actualizar(i, { cedula: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-50"
            />
            {!disabled && (
              <button type="button" onClick={() => eliminar(i)} className="text-red-500 hover:text-red-700 text-sm text-left">
                Quitar
              </button>
            )}
          </div>
        ))}
      </div>
      {!disabled && (
        <button type="button" onClick={agregar} className="mt-2 text-sm text-brand-700 hover:underline font-medium">
          + Agregar firmante
        </button>
      )}
    </div>
  );
}
