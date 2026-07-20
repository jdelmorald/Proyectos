export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  PRESUPUESTO: "Presupuesto",
  PROYECTO: "Proyecto",
  REPORTE: "Reporte",
  CONTRATO: "Contrato",
  OTRO: "Otro",
};

export const STATUS_LABELS: Record<string, string> = {
  ENVIADO: "Enviado - pendiente de revisión",
  EN_REVISION_DIRECCION: "En revisión de Dirección General",
  OBJETADO: "Objetado - requiere corrección",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
};

export const STATUS_SHORT_LABELS: Record<string, string> = {
  ENVIADO: "Pendiente",
  EN_REVISION_DIRECCION: "En Dirección",
  OBJETADO: "Objetado",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
};

// Validated for CVD-safe adjacent contrast (see scripts/validate_palette.js in the
// dataviz skill). Keep chart fills and badge dots on the same hex values.
export const STATUS_HEX: Record<string, string> = {
  ENVIADO: "#f59e0b",
  EN_REVISION_DIRECCION: "#0284c7",
  OBJETADO: "#dc2626",
  APROBADO: "#059669",
  RECHAZADO: "#7e3a5c",
};

export const STATUS_DOT_CLASSES: Record<string, string> = {
  ENVIADO: "bg-[#f59e0b]",
  EN_REVISION_DIRECCION: "bg-[#0284c7]",
  OBJETADO: "bg-[#dc2626]",
  APROBADO: "bg-[#059669]",
  RECHAZADO: "bg-[#7e3a5c]",
};

export const STATUS_TEXT_CLASSES: Record<string, string> = {
  ENVIADO: "text-amber-800",
  EN_REVISION_DIRECCION: "text-sky-800",
  OBJETADO: "text-red-800",
  APROBADO: "text-emerald-800",
  RECHAZADO: "text-[#7e3a5c]",
};

export const ACTION_LABELS: Record<string, string> = {
  ENVIADO: "envió el documento",
  REENVIADO: "reenvió una nueva versión",
  APROBADO_GERENTE: "aprobó y envió a Dirección General",
  OBJETADO: "objetó el documento",
  APROBADO: "aprobó el documento",
  RECHAZADO: "rechazó el documento",
  COMENTARIO: "comentó",
};
