export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  PRESUPUESTO: "Presupuesto",
  PROYECTO: "Proyecto",
  REPORTE: "Reporte",
  CONTRATO: "Contrato",
  OTRO: "Otro",
};

export const STATUS_LABELS: Record<string, string> = {
  ENVIADO: "Enviado - pendiente de revisión",
  OBJETADO: "Objetado - requiere corrección",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
};

export const STATUS_BADGE_CLASSES: Record<string, string> = {
  ENVIADO: "bg-amber-100 text-amber-800 border-amber-300",
  OBJETADO: "bg-red-100 text-red-800 border-red-300",
  APROBADO: "bg-green-100 text-green-800 border-green-300",
  RECHAZADO: "bg-gray-200 text-gray-700 border-gray-400",
};

export const ACTION_LABELS: Record<string, string> = {
  ENVIADO: "envió el documento",
  REENVIADO: "reenvió una nueva versión",
  OBJETADO: "objetó el documento",
  APROBADO: "aprobó el documento",
  RECHAZADO: "rechazó el documento",
  COMENTARIO: "comentó",
};
