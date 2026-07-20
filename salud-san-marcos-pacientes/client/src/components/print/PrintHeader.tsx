interface Empresa {
  nombre: string;
  razon_social: string | null;
  rif: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  logo_base64: string | null;
}

export default function PrintHeader({
  empresa,
  titulo,
  numero,
  numeroControl,
  fecha,
}: {
  empresa: Empresa;
  titulo: string;
  numero: string;
  numeroControl?: string | null;
  fecha: string;
}) {
  return (
    <div className="mb-4">
      <div className="h-1 bg-accent-600 rounded-full mb-3" />
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
        <div className="flex gap-3 items-center">
          {empresa.logo_base64 && <img src={empresa.logo_base64} alt="Logo" className="h-16 object-contain" />}
          <div>
            <div className="text-xl font-bold text-slate-900">{empresa.nombre}</div>
            {empresa.razon_social && <div className="text-sm text-slate-600">{empresa.razon_social}</div>}
            {empresa.rif && <div className="text-sm text-slate-600">RIF: {empresa.rif}</div>}
            {empresa.direccion && <div className="text-xs text-slate-500 max-w-xs">{empresa.direccion}</div>}
            <div className="text-xs text-slate-500">
              {empresa.telefono} {empresa.telefono && empresa.email && '·'} {empresa.email}
            </div>
          </div>
        </div>
        <div className="text-right border border-slate-800 rounded-md px-4 py-2 min-w-[220px]">
          <div className="font-bold text-slate-900">{titulo}</div>
          <div className="text-sm mt-1">
            N°: <span className="font-semibold">{numero}</span>
          </div>
          {numeroControl && (
            <div className="text-sm">
              N° Control: <span className="font-semibold">{numeroControl}</span>
            </div>
          )}
          <div className="text-sm">Fecha: {fecha}</div>
        </div>
      </div>
    </div>
  );
}
