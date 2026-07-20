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

export const STATUS_DOT_CLASSES: Record<string, string> = {
  ENVIADO: "bg-amber-500",
  EN_REVISION_DIRECCION: "bg-sky-600",
  OBJETADO: "bg-red-600",
  APROBADO: "bg-emerald-600",
  RECHAZADO: "bg-ink-soft",
};

export const STATUS_TEXT_CLASSES: Record<string, string> = {
  ENVIADO: "text-amber-800",
  EN_REVISION_DIRECCION: "text-sky-800",
  OBJETADO: "text-red-800",
  APROBADO: "text-emerald-800",
  RECHAZADO: "text-ink-soft",
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
