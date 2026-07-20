import { useState } from 'react';
import { ColumnaExport, EmpresaExport, exportarExcel, exportarPDF } from '../utils/exportar';

interface Props {
  empresa: EmpresaExport | null | undefined;
  titulo: string;
  subtitulo?: string;
  columnas: ColumnaExport[];
  filas: any[];
  filaTotales?: Record<string, any>;
  nombreArchivo: string;
}

export default function BotonesExportar({ empresa, titulo, subtitulo, columnas, filas, filaTotales, nombreArchivo }: Props) {
  const [generando, setGenerando] = useState(false);
  const deshabilitado = filas.length === 0 || generando;
  const opts = { empresa, titulo, subtitulo, columnas, filas, filaTotales, nombreArchivo };

  async function onExcel() {
    setGenerando(true);
    try {
      await exportarExcel(opts);
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={deshabilitado}
        onClick={() => exportarPDF(opts)}
        title={filas.length === 0 ? 'No hay datos para exportar' : 'Descargar PDF'}
        className="text-xs font-medium px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ⬇ PDF
      </button>
      <button
        type="button"
        disabled={deshabilitado}
        onClick={onExcel}
        title={filas.length === 0 ? 'No hay datos para exportar' : 'Descargar Excel'}
        className="text-xs font-medium px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ⬇ Excel
      </button>
    </div>
  );
}
