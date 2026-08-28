export const SUPPLIER_TYPE_LABELS: Record<string, string> = {
  FABRICANTE: "Fabricante",
  DISTRIBUIDOR: "Distribuidor",
  MAYORISTA: "Mayorista",
  MINORISTA: "Minorista",
  SERVICIOS: "Prestador de servicios",
  IMPORTADOR: "Importador",
  OTRO: "Otro",
};

export const SUPPLIER_STATUS_LABELS: Record<string, string> = {
  POTENCIAL: "Potencial",
  EN_EVALUACION: "En evaluación",
  APROBADO: "Aprobado",
  ACTIVO: "Activo",
  RECHAZADO: "Rechazado",
  INACTIVO: "Inactivo",
};

export const SUPPLIER_STATUS_DOT_CLASSES: Record<string, string> = {
  POTENCIAL: "bg-[#f59e0b]",
  EN_EVALUACION: "bg-[#0284c7]",
  APROBADO: "bg-[#059669]",
  ACTIVO: "bg-[#059669]",
  RECHAZADO: "bg-[#dc2626]",
  INACTIVO: "bg-ink-soft",
};

export const SUPPLIER_STATUS_TEXT_CLASSES: Record<string, string> = {
  POTENCIAL: "text-amber-800",
  EN_EVALUACION: "text-sky-800",
  APROBADO: "text-emerald-800",
  ACTIVO: "text-emerald-800",
  RECHAZADO: "text-red-800",
  INACTIVO: "text-ink-soft",
};

export const RATING_LABELS: Record<number, string> = {
  1: "1 - Muy bajo",
  2: "2 - Bajo",
  3: "3 - Aceptable",
  4: "4 - Bueno",
  5: "5 - Excelente",
};

export type RatingField = "qualityRating" | "priceRating" | "deliveryRating" | "serviceRating";

export const RATING_FIELDS: { field: RatingField; label: string }[] = [
  { field: "qualityRating", label: "Calidad" },
  { field: "priceRating", label: "Precio" },
  { field: "deliveryRating", label: "Tiempo de entrega" },
  { field: "serviceRating", label: "Atención / servicio" },
];

/** Average of whichever ratings have been filled in; null if none have. */
export function overallRating(supplier: {
  qualityRating: number | null;
  priceRating: number | null;
  deliveryRating: number | null;
  serviceRating: number | null;
}): number | null {
  const values = [
    supplier.qualityRating,
    supplier.priceRating,
    supplier.deliveryRating,
    supplier.serviceRating,
  ].filter((v): v is number => v != null);

  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function formatRating(value: number | null): string {
  if (value == null) return "Sin calificar";
  return `★ ${value.toFixed(1)}`;
}
