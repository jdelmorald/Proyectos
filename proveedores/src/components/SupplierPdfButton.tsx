"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import {
  PHOTO_CATEGORY_LABELS,
  RATING_FIELDS,
  RATING_LABELS,
  CURRENCY_LABELS,
  PAYMENT_METHOD_LABELS,
  SUPPLIER_TYPE_LABELS,
  SUPPLIER_STATUS_LABELS,
  overallRating,
  formatDateTime,
} from "@/lib/suppliers";

/** El "★" de formatRating() no existe en la codificación WinAnsi de las
 *  fuentes estándar de jsPDF y rompe el trazado del texto — se evita aquí. */
function formatRatingPdf(value: number | null): string {
  if (value == null) return "Sin calificar";
  return `${value.toFixed(1)} / 5`;
}

const INK = "#2b2320";
const INK_SOFT = "#8a7d75";
const ACCENT = "#d6293a";
const LINE = "#e7ddd6";

type PdfPhoto = { id: string; category: string };

export type SupplierPdfData = {
  legalName: string;
  tradeName: string | null;
  taxId: string | null;
  type: string;
  category: string | null;
  isBrandRepresentative: boolean;
  representedBrand: string | null;
  city: string;
  state: string | null;
  country: string;
  address: string | null;
  visitDate: Date | null;
  contactName: string | null;
  contactRole: string | null;
  phone: string | null;
  phoneExt: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  additionalContacts: { name: string; role: string; phone: string }[];
  status: string;
  qualityRating: number | null;
  priceRating: number | null;
  deliveryRating: number | null;
  serviceRating: number | null;
  currencies: string[];
  currencyOther: string | null;
  paymentMethods: string[];
  paymentMethodOther: string | null;
  paymentTerms: string | null;
  minOrder: string | null;
  certifications: string | null;
  hasInvoice: boolean;
  products: string | null;
  notes: string | null;
  photos: PdfPhoto[];
  registeredByName: string;
  createdAt: Date;
  updatedByName: string | null;
  updatedAt: Date;
};

/** Descarga una foto/logo y la devuelve recomprimida como dataURL, lista para addImage. */
async function loadImageDataUrl(
  url: string,
  opts: { format: "JPEG" | "PNG"; maxDim: number; quality?: number }
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("no se pudo cargar la imagen"));
      el.src = objectUrl;
    });
    const scale = Math.min(1, opts.maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    URL.revokeObjectURL(objectUrl);
    if (!ctx) return null;
    if (opts.format === "JPEG") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0, w, h);
    const dataUrl = canvas.toDataURL(opts.format === "JPEG" ? "image/jpeg" : "image/png", opts.quality ?? 0.85);
    return { dataUrl, width: w, height: h };
  } catch {
    return null;
  }
}

/**
 * Genera la ficha del proveedor como un documento PDF de verdad: texto real,
 * secciones, encabezados y fotos en cuadrícula — no una captura de pantalla.
 * Se construye con la API de dibujo de jsPDF en vez de html2canvas, así que
 * funciona igual en el navegador y en la app instalada (PWA) en iPad/Android,
 * donde el diálogo nativo de impresión del sistema no siempre está disponible.
 */
async function generateSupplierPdf(data: SupplierPdfData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;
  let pageNum = 1;

  const logo = await loadImageDataUrl("/logo.png", { format: "PNG", maxDim: 200 });

  function drawHeader(first: boolean) {
    if (first && logo) {
      const logoH = 26;
      const logoW = (logo.width / logo.height) * logoH;
      doc.addImage(logo.dataUrl, "PNG", margin, y, logoW, logoH);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(INK);
      doc.text("SUMIVENSA", margin + logoW + 8, y + 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(INK_SOFT);
      doc.text("Ficha de proveedor", margin + logoW + 8, y + 24);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(INK);
      doc.text("SUMIVENSA · Ficha de proveedor", margin, y + 8);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(INK_SOFT);
    doc.text(`Generado el ${formatDateTime(new Date())}`, pageWidth - margin, y + 8, { align: "right" });
    doc.text(`Página ${pageNum}`, pageWidth - margin, y + 18, { align: "right" });

    y += first ? 38 : 26;
    doc.setDrawColor(ACCENT);
    doc.setLineWidth(1.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;
  }

  function newPage() {
    doc.addPage();
    pageNum += 1;
    y = margin;
    drawHeader(false);
  }

  function ensureSpace(h: number) {
    if (y + h > pageHeight - margin) newPage();
  }

  function sectionTitle(title: string) {
    ensureSpace(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(ACCENT);
    doc.text(title.toUpperCase(), margin, y);
    y += 5;
    doc.setDrawColor(LINE);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;
  }

  function row(label: string, value?: string | null) {
    if (!value) return;
    const labelWidth = 132;
    const valueWidth = contentWidth - labelWidth;
    const lines = doc.splitTextToSize(value, valueWidth);
    ensureSpace(13 * lines.length + 4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(INK_SOFT);
    doc.text(label.toUpperCase(), margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(INK);
    doc.text(lines, margin + labelWidth, y);
    y += 13 * lines.length + 4;
  }

  function paragraph(text: string) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(INK);
    const lines = doc.splitTextToSize(text, contentWidth);
    ensureSpace(13 * lines.length + 6);
    doc.text(lines, margin, y);
    y += 13 * lines.length + 6;
  }

  drawHeader(true);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(INK);
  doc.text(data.legalName, margin, y);
  y += 20;

  const rating = overallRating(data);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(INK_SOFT);
  const subtitle = [
    SUPPLIER_TYPE_LABELS[data.type],
    [data.city, data.state].filter(Boolean).join(", "),
    SUPPLIER_STATUS_LABELS[data.status],
    `Calificación general: ${formatRatingPdf(rating)}`,
  ].join("   ·   ");
  doc.text(subtitle, margin, y);
  y += 24;

  sectionTitle("Identificación");
  row("Nombre comercial", data.tradeName);
  row("RIF", data.taxId);
  row("Rubro", data.category);
  if (data.isBrandRepresentative) row("Representa la marca", data.representedBrand ?? "Sí");

  sectionTitle("Ubicación");
  row("Dirección", data.address);
  row("País", data.country);
  row("Fecha de visita", data.visitDate ? new Date(data.visitDate).toLocaleDateString("es") : null);

  sectionTitle("Contacto");
  row("Persona", data.contactName);
  row("Cargo", data.contactRole);
  row("Teléfono", data.phone ? `${data.phone}${data.phoneExt ? ` ext. ${data.phoneExt}` : ""}` : null);
  row("WhatsApp", data.whatsapp);
  row("Correo", data.email);
  row("Web / redes", data.website);
  data.additionalContacts.forEach((c) =>
    row("Otro contacto", [c.name, c.role, c.phone].filter(Boolean).join(" · "))
  );

  sectionTitle("Calificación");
  RATING_FIELDS.forEach(({ field, label }) => {
    const v = data[field];
    row(label, v != null ? RATING_LABELS[v] : null);
  });

  sectionTitle("Condiciones comerciales");
  const currencyList = [
    ...data.currencies.filter((c) => c !== "OTRO").map((c) => CURRENCY_LABELS[c] ?? c),
    ...(data.currencies.includes("OTRO") && data.currencyOther ? [data.currencyOther] : []),
  ];
  const paymentList = [
    ...data.paymentMethods.filter((m) => m !== "OTRO").map((m) => PAYMENT_METHOD_LABELS[m] ?? m),
    ...(data.paymentMethods.includes("OTRO") && data.paymentMethodOther ? [data.paymentMethodOther] : []),
  ];
  row("Monedas de cobro", currencyList.join(", "));
  row("Métodos de pago", paymentList.join(", "));
  row("Condiciones de pago", data.paymentTerms);
  row("Pedido mínimo", data.minOrder);
  row("Certificaciones", data.certifications);
  row("Factura fiscal", data.hasInvoice ? "Sí" : null);

  if (data.products) {
    sectionTitle("Productos / servicios");
    paragraph(data.products);
  }

  if (data.notes) {
    sectionTitle("Notas de la visita");
    paragraph(data.notes);
  }

  if (data.photos.length > 0) {
    sectionTitle("Fotos");
    const cols = 3;
    const gap = 10;
    const boxW = (contentWidth - gap * (cols - 1)) / cols;
    const boxH = boxW;
    let col = 0;

    for (const photo of data.photos) {
      if (col === 0) ensureSpace(boxH + 24);
      const x = margin + col * (boxW + gap);
      const img = await loadImageDataUrl(`/api/photos/${photo.id}`, {
        format: "JPEG",
        maxDim: 480,
        quality: 0.78,
      });

      doc.setDrawColor(LINE);
      doc.setLineWidth(0.6);
      doc.rect(x, y, boxW, boxH);

      if (img) {
        const scale = Math.min(boxW / img.width, boxH / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        doc.addImage(img.dataUrl, "JPEG", x + (boxW - w) / 2, y + (boxH - h) / 2, w, h);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(INK_SOFT);
      doc.text(PHOTO_CATEGORY_LABELS[photo.category] ?? photo.category, x, y + boxH + 11);

      col += 1;
      if (col === cols) {
        col = 0;
        y += boxH + 22;
      }
    }
    if (col !== 0) y += boxH + 22;
  }

  ensureSpace(30);
  doc.setDrawColor(LINE);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(INK_SOFT);
  doc.text(`Registrado por ${data.registeredByName} el ${formatDateTime(new Date(data.createdAt))}`, margin, y);
  if (data.updatedByName) {
    doc.text(
      `Última edición por ${data.updatedByName} el ${formatDateTime(new Date(data.updatedAt))}`,
      pageWidth - margin,
      y,
      { align: "right" }
    );
  }

  doc.save(`${data.legalName.replace(/[^\w\- ]/g, "")}.pdf`);
}

export function SupplierPdfButton({ data }: { data: SupplierPdfData }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleClick() {
    setLoading(true);
    setError(false);
    try {
      await generateSupplierPdf(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-accent transition-colors disabled:opacity-50"
      >
        <Download size={14} /> {loading ? "Generando PDF..." : "Descargar PDF"}
      </button>
      {error && <p className="text-xs text-red-700 mt-1">No se pudo generar el PDF. Intenta de nuevo.</p>}
    </div>
  );
}
