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

export const PHOTO_CATEGORY_LABELS: Record<string, string> = {
  LOCAL: "Local / fachada",
  PRODUCTO: "Producto",
  TARJETA: "Tarjeta de presentación",
  DOCUMENTO: "Documento",
  OTRO: "Otra",
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
  { field: "serviceRating", label: "Otros" },
];

export const CURRENCY_OPTIONS = ["USD", "EUR", "BS", "COP", "USDT", "EFECTIVO", "OTRO"] as const;
export const CURRENCY_LABELS: Record<string, string> = {
  USD: "USD",
  EUR: "EUR",
  BS: "Bolívares (BS)",
  COP: "Pesos colombianos (COP)",
  USDT: "USDT",
  EFECTIVO: "Efectivo",
  OTRO: "Otra",
};

export const PAYMENT_METHOD_OPTIONS = [
  "TRANSFERENCIA",
  "ZELLE",
  "BINANCE",
  "PAGO_MOVIL",
  "EFECTIVO",
  "ZINLI",
  "TARJETA",
  "BANESCO_PANAMA",
  "OTRO",
] as const;
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  TRANSFERENCIA: "Transferencia",
  ZELLE: "Zelle",
  BINANCE: "Binance",
  PAGO_MOVIL: "Pago móvil",
  EFECTIVO: "Efectivo",
  ZINLI: "Zinli",
  TARJETA: "Tarjeta",
  BANESCO_PANAMA: "Banesco Panamá",
  OTRO: "Otro",
};

/** Sugerencias de rubro — el campo sigue siendo texto libre (datalist), para no limitar al usuario. */
export const CATEGORY_SUGGESTIONS = [
  "Transporte",
  "Servicios",
  "Manufactura",
  "Fábrica",
  "Catering",
  "Ferretería",
  "IT / Tecnología",
  "Electrónica",
  "Alimentos",
  "Empaques",
  "Construcción",
  "Repuestos",
  "Papelería",
  "Textil",
  "Limpieza",
  "Mantenimiento",
];

export type AdditionalContact = { name: string; role: string; phone: string };

/** Promedio de las calificaciones que estén llenas; null si ninguna lo está. */
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

/** Fecha y hora, para dejar registro de quién hizo qué y cuándo. */
export function formatDateTime(date: Date): string {
  return date.toLocaleString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
