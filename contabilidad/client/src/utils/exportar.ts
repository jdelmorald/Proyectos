import { jsPDF } from 'jspdf';
import autoTable, { CellHookData } from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { formatearMonto } from './formato';

export interface EmpresaExport {
  nombre: string;
  rif?: string | null;
  razon_social?: string | null;
  logo_data_url?: string | null;
  color?: string | null;
  moneda?: string | null;
}

export interface UsuarioExport {
  nombre: string;
  email: string;
}

export interface ColumnaExport {
  header: string;
  key: string;
  align?: 'left' | 'right' | 'center';
}

/**
 * Una fila normal se pinta como cualquier otra. `_estilo: 'subtotal'` la resalta
 * en un tono claro del color de la empresa (p.ej. "Total Activo Corriente");
 * `_estilo: 'total'` la pinta como barra sólida (p.ej. "TOTAL ACTIVOS").
 */
type EstiloFila = 'subtotal' | 'total' | undefined;

export interface BloqueColumnas {
  titulo: string;
  columnas: ColumnaExport[];
  filas: any[];
}

export interface ExportOptions {
  empresa: EmpresaExport | null | undefined;
  titulo: string;
  subtitulo?: string;
  columnas: ColumnaExport[];
  filas: any[];
  filaTotales?: Record<string, any>;
  nombreArchivo: string;
  /** Etiquetas para la fila de datos a la derecha del encabezado (Periodo, Versión, etc.). */
  metadatos?: { label: string; valor: string }[];
  /** Si se define, el PDF dibuja dos tablas lado a lado en vez de una sola (p.ej. Activo | Pasivo+Patrimonio). El Excel siempre usa columnas/filas planas. */
  pdfDosColumnas?: { izquierda: BloqueColumnas; derecha: BloqueColumnas };
  /** Líneas de firma al pie del PDF (solo aplica a estados financieros formales). */
  firmas?: { izquierda: string; derecha: string };
  /** Usuario que genera el documento, para mostrar "Generado por" en el pie. */
  usuario?: UsuarioExport | null;
}

function formatearCelda(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return formatearMonto(v);
  return String(v);
}

function hexARgb(hex?: string | null): [number, number, number] {
  const limpio = (hex || '#0f766e').replace('#', '');
  const valor = parseInt(limpio.length === 6 ? limpio : '0f766e', 16);
  return [(valor >> 16) & 255, (valor >> 8) & 255, valor & 255];
}

function aclarar([r, g, b]: [number, number, number], factor: number): [number, number, number] {
  return [Math.round(r + (255 - r) * factor), Math.round(g + (255 - g) * factor), Math.round(b + (255 - b) * factor)];
}

function formatoImagen(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' {
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  return 'PNG';
}

function fechaHoraActual(): string {
  return new Date().toLocaleString('es-VE');
}

function fechaActual(): string {
  return new Date().toLocaleDateString('es-VE');
}

function fechaDDMMYYYY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

function horaAMPM(d: Date): string {
  return d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

function textoGeneradoPor(usuario?: UsuarioExport | null): string {
  const ahora = new Date();
  if (usuario) {
    return `Generado por: ${usuario.nombre} (${usuario.email}) el ${fechaDDMMYYYY(ahora)} a las ${horaAMPM(ahora)}`;
  }
  return `Generado el ${fechaHoraActual()}`;
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

const MARGEN = 14;

/** Dibuja el bloque de tres zonas (empresa | título | metadatos) y la línea divisoria. Devuelve el Y donde puede empezar el contenido. */
function dibujarEncabezado(doc: jsPDF, opts: ExportOptions, colorPrincipal: [number, number, number]): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const { empresa, titulo, subtitulo, metadatos } = opts;

  if (empresa?.logo_data_url) {
    try {
      doc.addImage(empresa.logo_data_url, formatoImagen(empresa.logo_data_url), MARGEN, 9, 16, 16, undefined, 'FAST');
    } catch {
      // Formato de imagen no reconocido por jsPDF: se omite el logo y sigue el resto del documento.
    }
  }
  const textX = empresa?.logo_data_url ? MARGEN + 20 : MARGEN;
  // El bloque de empresa (izquierda) y el título centrado comparten la misma
  // fila: si el nombre o la razón social son largos (p.ej. una razón social
  // completa), el texto puede extenderse lo suficiente para chocar con el
  // título/subtítulo centrado. Se mide primero cuánto ocupa realmente el
  // bloque central (título/subtítulo/moneda, el más ancho de los tres) para
  // saber dónde empieza de verdad, y se limita el ancho de la izquierda a lo
  // que cabe antes de ese borde, envolviendo a una segunda línea si hace falta.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  let anchoCentro = doc.getTextWidth(titulo.toUpperCase());
  if (subtitulo) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    anchoCentro = Math.max(anchoCentro, doc.getTextWidth(subtitulo));
  }
  if (empresa?.moneda) {
    doc.setFontSize(7.5);
    anchoCentro = Math.max(anchoCentro, doc.getTextWidth(`(Cifras expresadas en ${empresa.moneda})`));
  }
  const bordeCentroIzquierdo = pageWidth / 2 - anchoCentro / 2 - 6;
  const anchoMaxIzquierdo = Math.max(30, bordeCentroIzquierdo - textX);
  let yIzq = 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...colorPrincipal);
  const lineasNombre: string[] = doc.splitTextToSize(empresa?.nombre || 'Sistema Contable', anchoMaxIzquierdo);
  lineasNombre.forEach((linea, i) => doc.text(linea, textX, yIzq + i * 4.5));
  yIzq += (lineasNombre.length - 1) * 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(110);
  if (empresa?.razon_social) {
    yIzq += 4.5;
    const lineasRazonSocial: string[] = doc.splitTextToSize(empresa.razon_social, anchoMaxIzquierdo);
    lineasRazonSocial.forEach((linea, i) => doc.text(linea, textX, yIzq + i * 3.6));
    yIzq += (lineasRazonSocial.length - 1) * 3.6;
  }
  if (empresa?.rif) {
    yIzq += 4.5;
    doc.text(`RIF: ${empresa.rif}`, textX, yIzq);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(titulo.toUpperCase(), pageWidth / 2, 13, { align: 'center' });
  let yTitulo = 18;
  if (subtitulo) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(90);
    doc.text(subtitulo, pageWidth / 2, yTitulo, { align: 'center' });
    yTitulo += 4.5;
  }
  if (empresa?.moneda) {
    doc.setFontSize(7.5);
    doc.setTextColor(140);
    doc.text(`(Cifras expresadas en ${empresa.moneda})`, pageWidth / 2, yTitulo, { align: 'center' });
    yTitulo += 4.5;
  }

  const filasMetadatos = [{ label: 'Fecha de emisión', valor: fechaActual() }, ...(metadatos || [])];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);
  doc.setTextColor(90);
  filasMetadatos.forEach((m, i) => {
    const yy = 10 + i * 4;
    doc.text(`${m.label}: ${m.valor}`, pageWidth - MARGEN, yy, { align: 'right' });
  });

  const yLinea = Math.max(24, yTitulo, 10 + filasMetadatos.length * 4, yIzq + 2) + 3;
  doc.setDrawColor(...colorPrincipal);
  doc.setLineWidth(0.6);
  doc.line(MARGEN, yLinea, pageWidth - MARGEN, yLinea);

  return yLinea + 6;
}

function dibujarPie(doc: jsPDF, usuario?: UsuarioExport | null) {
  const texto = textoGeneradoPor(usuario);
  const totalPaginas = doc.getNumberOfPages();
  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(225);
    doc.setLineWidth(0.2);
    doc.line(MARGEN, pageHeight - 13, pageWidth - MARGEN, pageHeight - 13);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(texto, MARGEN, pageHeight - 8);
    doc.text(`Página ${p} de ${totalPaginas}`, pageWidth - MARGEN, pageHeight - 8, { align: 'right' });
  }
}

function dibujarFirmas(doc: jsPDF, y: number, firmas: { izquierda: string; derecha: string }): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y > pageHeight - 45) {
    doc.addPage();
    y = 30;
  } else {
    y += 20;
  }
  const anchoLinea = 65;
  const xIzq = pageWidth / 2 - anchoLinea - 8;
  const xDer = pageWidth / 2 + 8;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.3);
  doc.line(xIzq, y, xIzq + anchoLinea, y);
  doc.line(xDer, y, xDer + anchoLinea, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50);
  doc.text(firmas.izquierda, xIzq + anchoLinea / 2, y + 5, { align: 'center' });
  doc.text(firmas.derecha, xDer + anchoLinea / 2, y + 5, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(140);
  doc.text('C.I.: ______________________', xIzq + anchoLinea / 2, y + 10, { align: 'center' });
  doc.text('C.I.: ______________________', xDer + anchoLinea / 2, y + 10, { align: 'center' });
}

function estilosTabla(colorPrincipal: [number, number, number]) {
  return {
    styles: { fontSize: 8.3, cellPadding: 2.6, valign: 'middle' as const, lineColor: [230, 232, 236] as [number, number, number], lineWidth: 0.1 },
    headStyles: { fillColor: colorPrincipal, textColor: 255, fontStyle: 'bold' as const, fontSize: 8.3 },
    alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
    footStyles: { fillColor: colorPrincipal, textColor: 255, fontStyle: 'bold' as const },
  };
}

function crearDidParseCell(filasOriginales: any[], colorPrincipal: [number, number, number]) {
  const colorSubtotal = aclarar(colorPrincipal, 0.85);
  return (data: CellHookData) => {
    if (data.row.section !== 'body') return;
    const original = filasOriginales[data.row.index];
    const estilo: EstiloFila = original?._estilo;
    if (estilo === 'total') {
      data.cell.styles.fillColor = colorPrincipal;
      data.cell.styles.textColor = 255;
      data.cell.styles.fontStyle = 'bold';
    } else if (estilo === 'subtotal') {
      data.cell.styles.fillColor = colorSubtotal;
      data.cell.styles.textColor = colorPrincipal;
      data.cell.styles.fontStyle = 'bold';
    }
  };
}

export function exportarPDF(opts: ExportOptions) {
  const { empresa, columnas, filas, filaTotales, nombreArchivo, pdfDosColumnas, firmas, usuario } = opts;
  const colorPrincipal = hexARgb(empresa?.color);
  const orientacion = !pdfDosColumnas && columnas.length >= 6 ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation: orientacion });
  const pageWidth = doc.internal.pageSize.getWidth();

  let y = dibujarEncabezado(doc, opts, colorPrincipal);
  const compartido = estilosTabla(colorPrincipal);

  if (pdfDosColumnas) {
    const gap = 6;
    const anchoColumna = (pageWidth - MARGEN * 2 - gap) / 2;
    const xIzq = MARGEN;
    const xDer = MARGEN + anchoColumna + gap;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...colorPrincipal);
    doc.text(pdfDosColumnas.izquierda.titulo, xIzq, y);
    doc.text(pdfDosColumnas.derecha.titulo, xDer, y);
    const startY = y + 3;

    autoTable(doc, {
      startY,
      margin: { left: xIzq, right: pageWidth - xIzq - anchoColumna },
      head: [pdfDosColumnas.izquierda.columnas.map((c) => c.header)],
      body: pdfDosColumnas.izquierda.filas.map((f) => pdfDosColumnas.izquierda.columnas.map((c) => formatearCelda(f[c.key]))),
      columnStyles: Object.fromEntries(pdfDosColumnas.izquierda.columnas.map((c, i) => [i, { halign: c.align || 'left' }])),
      didParseCell: crearDidParseCell(pdfDosColumnas.izquierda.filas, colorPrincipal),
      ...compartido,
    });
    const finalYIzq = (doc as any).lastAutoTable.finalY as number;

    autoTable(doc, {
      startY,
      margin: { left: xDer, right: MARGEN },
      head: [pdfDosColumnas.derecha.columnas.map((c) => c.header)],
      body: pdfDosColumnas.derecha.filas.map((f) => pdfDosColumnas.derecha.columnas.map((c) => formatearCelda(f[c.key]))),
      columnStyles: Object.fromEntries(pdfDosColumnas.derecha.columnas.map((c, i) => [i, { halign: c.align || 'left' }])),
      didParseCell: crearDidParseCell(pdfDosColumnas.derecha.filas, colorPrincipal),
      ...compartido,
    });
    const finalYDer = (doc as any).lastAutoTable.finalY as number;
    y = Math.max(finalYIzq, finalYDer);
  } else {
    const body = filas.map((f) => columnas.map((c) => formatearCelda(f[c.key])));
    const foot = filaTotales ? [columnas.map((c) => formatearCelda(filaTotales[c.key]))] : undefined;
    autoTable(doc, {
      startY: y,
      head: [columnas.map((c) => c.header)],
      body,
      foot,
      columnStyles: Object.fromEntries(columnas.map((c, i) => [i, { halign: c.align || 'left' }])),
      didParseCell: crearDidParseCell(filas, colorPrincipal),
      ...compartido,
    });
    y = (doc as any).lastAutoTable.finalY as number;
  }

  if (firmas) dibujarFirmas(doc, y, firmas);
  dibujarPie(doc, usuario);
  doc.save(`${nombreArchivo}.pdf`);
}

export async function exportarExcel(opts: ExportOptions) {
  const { empresa, titulo, subtitulo, columnas, filas, filaTotales, nombreArchivo, usuario } = opts;

  const libro = new ExcelJS.Workbook();
  libro.creator = 'Sistema Contable Delder';
  libro.created = new Date();
  const hoja = libro.addWorksheet(titulo.slice(0, 31) || 'Reporte');
  const colorArgb = 'FF' + hexARgb(empresa?.color).map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase();

  hoja.addRow([empresa?.nombre || 'Sistema Contable']).font = { bold: true, size: 14, color: { argb: colorArgb } };
  if (empresa?.razon_social) hoja.addRow([empresa.razon_social]).font = { italic: true, size: 9, color: { argb: 'FF555555' } };
  if (empresa?.rif) hoja.addRow([`RIF: ${empresa.rif}`]);
  hoja.addRow([titulo]).font = { bold: true, size: 12 };
  if (subtitulo) hoja.addRow([subtitulo]);
  if (empresa?.moneda) hoja.addRow([`Cifras expresadas en ${empresa.moneda}`]).font = { italic: true, size: 8, color: { argb: 'FF888888' } };
  hoja.addRow([textoGeneradoPor(usuario)]).font = { italic: true, size: 9, color: { argb: 'FF888888' } };
  hoja.addRow([]);

  const filaEncabezado = hoja.addRow(columnas.map((c) => c.header));
  filaEncabezado.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  filaEncabezado.eachCell((celda) => {
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorArgb } };
  });

  for (const f of filas) {
    const fila = hoja.addRow(columnas.map((c) => (typeof f[c.key] === 'number' ? (f[c.key] as number) : formatearCelda(f[c.key]))));
    // Formato de celda nativo de Excel (no solo texto) para que las cifras se
    // vean agrupadas por miles igual que en pantalla y el PDF, respetando el
    // separador de miles/decimales de la configuración regional de quien abre el archivo.
    columnas.forEach((c, i) => {
      if (typeof f[c.key] === 'number') fila.getCell(i + 1).numFmt = '#,##0.00';
    });
    const estilo: EstiloFila = f?._estilo;
    if (estilo === 'total') {
      fila.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      fila.eachCell((celda) => { celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorArgb } }; });
    } else if (estilo === 'subtotal') {
      fila.font = { bold: true, color: { argb: colorArgb } };
      fila.eachCell((celda) => { celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } }; });
    }
  }

  if (filaTotales) {
    const filaTot = hoja.addRow(
      columnas.map((c) => (typeof filaTotales[c.key] === 'number' ? (filaTotales[c.key] as number) : formatearCelda(filaTotales[c.key])))
    );
    columnas.forEach((c, i) => {
      if (typeof filaTotales[c.key] === 'number') filaTot.getCell(i + 1).numFmt = '#,##0.00';
    });
    filaTot.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    filaTot.eachCell((celda) => { celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorArgb } }; });
  }

  hoja.columns.forEach((col) => { col.width = 20; });

  const buffer = await libro.xlsx.writeBuffer();
  descargarBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${nombreArchivo}.xlsx`);
}
