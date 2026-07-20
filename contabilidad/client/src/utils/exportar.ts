import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

export interface EmpresaExport {
  nombre: string;
  rif?: string | null;
  logo_data_url?: string | null;
  color?: string | null;
}

export interface ColumnaExport {
  header: string;
  key: string;
  align?: 'left' | 'right' | 'center';
}

export interface ExportOptions {
  empresa: EmpresaExport | null | undefined;
  titulo: string;
  subtitulo?: string;
  columnas: ColumnaExport[];
  filas: any[];
  filaTotales?: Record<string, any>;
  nombreArchivo: string;
}

function formatearCelda(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return v.toFixed(2);
  return String(v);
}

function hexARgb(hex?: string | null): [number, number, number] {
  const limpio = (hex || '#0f766e').replace('#', '');
  const valor = parseInt(limpio.length === 6 ? limpio : '0f766e', 16);
  return [(valor >> 16) & 255, (valor >> 8) & 255, valor & 255];
}

function formatoImagen(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' {
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  return 'PNG';
}

function fechaHoraActual(): string {
  return new Date().toLocaleString('es-VE');
}

function descargarBlob(blob: Blob, nombreArchivo: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportarPDF(opts: ExportOptions) {
  const { empresa, titulo, subtitulo, columnas, filas, filaTotales, nombreArchivo } = opts;
  const doc = new jsPDF({ orientation: columnas.length >= 6 ? 'landscape' : 'portrait' });
  const marginX = 14;
  const y0 = 15;

  if (empresa?.logo_data_url) {
    try {
      doc.addImage(empresa.logo_data_url, formatoImagen(empresa.logo_data_url), marginX, y0, 18, 18, undefined, 'FAST');
    } catch {
      // Si el navegador guardó el logo en un formato que jsPDF no reconoce, se omite y sigue el resto del documento.
    }
  }
  const textX = empresa?.logo_data_url ? marginX + 24 : marginX;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(empresa?.nombre || 'Sistema Contable', textX, y0 + 6);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (empresa?.rif) doc.text(`RIF: ${empresa.rif}`, textX, y0 + 11);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, textX, y0 + 18);
  let y = y0 + 23;
  if (subtitulo) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitulo, textX, y);
    y += 5;
  }
  y = Math.max(y, y0 + 22);

  const body = filas.map((f) => columnas.map((c) => formatearCelda(f[c.key])));
  const foot = filaTotales ? [columnas.map((c) => formatearCelda(filaTotales[c.key]))] : undefined;

  autoTable(doc, {
    startY: y,
    head: [columnas.map((c) => c.header)],
    body,
    foot,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: hexARgb(empresa?.color) },
    footStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    columnStyles: Object.fromEntries(columnas.map((c, i) => [i, { halign: c.align || 'left' }])),
  });

  const totalPaginas = doc.getNumberOfPages();
  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p);
    const alturaPagina = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Generado el ${fechaHoraActual()} · página ${p} de ${totalPaginas}`, marginX, alturaPagina - 8);
  }

  doc.save(`${nombreArchivo}.pdf`);
}

export async function exportarExcel(opts: ExportOptions) {
  const { empresa, titulo, subtitulo, columnas, filas, filaTotales, nombreArchivo } = opts;

  const libro = new ExcelJS.Workbook();
  libro.creator = 'Sistema Contable Delder';
  libro.created = new Date();
  const hoja = libro.addWorksheet(titulo.slice(0, 31) || 'Reporte');

  hoja.addRow([empresa?.nombre || 'Sistema Contable']).font = { bold: true, size: 14 };
  if (empresa?.rif) hoja.addRow([`RIF: ${empresa.rif}`]);
  hoja.addRow([titulo]).font = { bold: true, size: 12 };
  if (subtitulo) hoja.addRow([subtitulo]);
  hoja.addRow([`Generado el ${fechaHoraActual()}`]).font = { italic: true, size: 9, color: { argb: 'FF888888' } };
  hoja.addRow([]);

  const filaEncabezado = hoja.addRow(columnas.map((c) => c.header));
  filaEncabezado.font = { bold: true };
  filaEncabezado.eachCell((celda) => {
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  });

  for (const f of filas) {
    hoja.addRow(columnas.map((c) => (typeof f[c.key] === 'number' ? (f[c.key] as number) : formatearCelda(f[c.key]))));
  }

  if (filaTotales) {
    const filaTot = hoja.addRow(
      columnas.map((c) => (typeof filaTotales[c.key] === 'number' ? (filaTotales[c.key] as number) : formatearCelda(filaTotales[c.key])))
    );
    filaTot.font = { bold: true };
  }

  hoja.columns.forEach((col) => { col.width = 20; });

  const buffer = await libro.xlsx.writeBuffer();
  descargarBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${nombreArchivo}.xlsx`);
}
