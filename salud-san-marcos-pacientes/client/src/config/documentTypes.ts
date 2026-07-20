// Catálogo maestro de los tipos de documento del módulo de Gestión de Pacientes de Salud San Marcos.
// Este archivo se duplica en server/src y client/src (sin dependencias de build cruzadas).
// Si se agrega o modifica un tipo de documento, actualizar las 3 copias.

export type Familia = 'medico';
export type Contraparte = 'paciente' | 'ninguno';

export interface CampoExtra {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'time';
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

export interface DocumentTypeConfig {
  key: string;
  label: string;
  labelPlural: string;
  prefijo: string;
  familia: Familia;
  fiscal: boolean;
  numeroControl: boolean;
  contraparte: Contraparte;
  tieneItems: boolean;
  itemsConPrecio: boolean;
  tieneFirmantes: boolean;
  tieneReferencia: boolean;
  referenciaTipos?: string[];
  camposExtra: CampoExtra[];
  tituloImpresion: string;
  grupoMenu: 'Admisión y Consulta' | 'Historia Clínica' | 'Quirófano' | 'Seguimiento' | 'Egreso';
}

export const DOCUMENT_TYPES: DocumentTypeConfig[] = [
  {
    key: 'admision',
    label: 'Admisión / Ingreso',
    labelPlural: 'Admisiones / Ingresos',
    prefijo: 'ADM',
    familia: 'medico',
    fiscal: false,
    numeroControl: false,
    contraparte: 'paciente',
    tieneItems: false,
    itemsConPrecio: false,
    tieneFirmantes: true,
    tieneReferencia: false,
    camposExtra: [
      { name: 'tipoAtencion', label: 'Tipo de atención', type: 'select', options: ['Consulta Externa', 'Hospitalización', 'Cirugía Ambulatoria', 'Emergencia'], required: true },
      { name: 'motivoIngreso', label: 'Motivo de ingreso / consulta', type: 'textarea', required: true },
      { name: 'medicoTratante', label: 'Médico tratante', type: 'text', required: true },
      { name: 'horaIngreso', label: 'Hora de ingreso', type: 'time' },
    ],
    tituloImpresion: 'FICHA DE ADMISIÓN',
    grupoMenu: 'Admisión y Consulta',
  },
  {
    key: 'constancia_medica',
    label: 'Constancia Médica',
    labelPlural: 'Constancias Médicas',
    prefijo: 'CM',
    familia: 'medico',
    fiscal: false,
    numeroControl: false,
    contraparte: 'paciente',
    tieneItems: false,
    itemsConPrecio: false,
    tieneFirmantes: true,
    tieneReferencia: false,
    camposExtra: [
      { name: 'tipoConstancia', label: 'Tipo de constancia', type: 'select', options: ['Constancia de Asistencia', 'Reposo Médico', 'Constancia de Salud', 'Salida de Consulta', 'Otro'], required: true },
      { name: 'diasReposo', label: 'Días de reposo (si aplica)', type: 'number' },
      { name: 'motivo', label: 'Motivo / Descripción', type: 'textarea', required: true },
      { name: 'medico', label: 'Médico que certifica', type: 'text', required: true },
      { name: 'registroMPPS', label: 'N° de colegiatura / MPPS', type: 'text' },
    ],
    tituloImpresion: 'CONSTANCIA MÉDICA',
    grupoMenu: 'Admisión y Consulta',
  },
  {
    key: 'historia_clinica',
    label: 'Historia Clínica',
    labelPlural: 'Historias Clínicas',
    prefijo: 'HC',
    familia: 'medico',
    fiscal: false,
    numeroControl: false,
    contraparte: 'paciente',
    tieneItems: false,
    itemsConPrecio: false,
    tieneFirmantes: true,
    tieneReferencia: true,
    referenciaTipos: ['admision'],
    camposExtra: [
      { name: 'motivoConsulta', label: 'Motivo de consulta', type: 'textarea', required: true },
      { name: 'antecedentesPersonales', label: 'Antecedentes personales', type: 'textarea' },
      { name: 'antecedentesFamiliares', label: 'Antecedentes familiares', type: 'textarea' },
      { name: 'examenFisico', label: 'Examen físico', type: 'textarea' },
      { name: 'signosVitales', label: 'Signos vitales', type: 'text', placeholder: 'TA, FC, FR, Temp, SpO2' },
      { name: 'diagnostico', label: 'Diagnóstico', type: 'textarea', required: true },
      { name: 'planTratamiento', label: 'Plan de tratamiento', type: 'textarea' },
      { name: 'medicoTratante', label: 'Médico tratante', type: 'text' },
    ],
    tituloImpresion: 'HISTORIA CLÍNICA',
    grupoMenu: 'Historia Clínica',
  },
  {
    key: 'orden_medica',
    label: 'Orden Médica',
    labelPlural: 'Órdenes Médicas',
    prefijo: 'OM',
    familia: 'medico',
    fiscal: false,
    numeroControl: false,
    contraparte: 'paciente',
    tieneItems: false,
    itemsConPrecio: false,
    tieneFirmantes: true,
    tieneReferencia: true,
    referenciaTipos: ['admision'],
    camposExtra: [
      { name: 'tipoOrden', label: 'Tipo de orden', type: 'select', options: ['Hospitalización', 'Exámenes / Laboratorio', 'Imagenología', 'Indicaciones Generales', 'Interconsulta', 'Otro'], required: true },
      { name: 'indicaciones', label: 'Indicaciones', type: 'textarea', required: true },
      { name: 'medicoOrdena', label: 'Médico que ordena', type: 'text' },
    ],
    tituloImpresion: 'ORDEN MÉDICA',
    grupoMenu: 'Historia Clínica',
  },
  {
    key: 'receta_medica',
    label: 'Receta Médica',
    labelPlural: 'Recetas Médicas',
    prefijo: 'RM',
    familia: 'medico',
    fiscal: false,
    numeroControl: false,
    contraparte: 'paciente',
    tieneItems: false,
    itemsConPrecio: false,
    tieneFirmantes: true,
    tieneReferencia: false,
    camposExtra: [
      { name: 'diagnostico', label: 'Diagnóstico', type: 'text' },
      { name: 'medicamentosIndicados', label: 'Medicamentos indicados', type: 'textarea', required: true, placeholder: 'Medicamento, dosis, vía, frecuencia, duración' },
      { name: 'indicacionesAdicionales', label: 'Indicaciones adicionales', type: 'textarea' },
      { name: 'medico', label: 'Médico', type: 'text', required: true },
      { name: 'registroMPPS', label: 'N° de colegiatura / MPPS', type: 'text' },
    ],
    tituloImpresion: 'RECETA MÉDICA',
    grupoMenu: 'Historia Clínica',
  },
  {
    key: 'consentimiento_informado',
    label: 'Consentimiento Informado',
    labelPlural: 'Consentimientos Informados',
    prefijo: 'CI',
    familia: 'medico',
    fiscal: false,
    numeroControl: false,
    contraparte: 'paciente',
    tieneItems: false,
    itemsConPrecio: false,
    tieneFirmantes: true,
    tieneReferencia: false,
    camposExtra: [
      { name: 'tipoConsentimiento', label: 'Tipo de consentimiento', type: 'select', options: ['Procedimiento/Cirugía', 'Anestesia', 'Transfusión de Hemoderivados', 'Hospitalización', 'Otro procedimiento médico'], required: true },
      { name: 'procedimientoPropuesto', label: 'Procedimiento propuesto', type: 'textarea', required: true },
      { name: 'riesgosExplicados', label: 'Riesgos explicados al paciente', type: 'textarea' },
      { name: 'alternativas', label: 'Alternativas explicadas', type: 'textarea' },
      { name: 'medicoResponsable', label: 'Médico responsable', type: 'text', required: true },
    ],
    tituloImpresion: 'CONSENTIMIENTO INFORMADO',
    grupoMenu: 'Quirófano',
  },
  {
    key: 'nota_operatoria',
    label: 'Nota Operatoria',
    labelPlural: 'Notas Operatorias',
    prefijo: 'NOP',
    familia: 'medico',
    fiscal: false,
    numeroControl: false,
    contraparte: 'paciente',
    tieneItems: false,
    itemsConPrecio: false,
    tieneFirmantes: true,
    tieneReferencia: true,
    referenciaTipos: ['admision'],
    camposExtra: [
      { name: 'diagnosticoPreoperatorio', label: 'Diagnóstico preoperatorio', type: 'textarea', required: true },
      { name: 'diagnosticoPostoperatorio', label: 'Diagnóstico postoperatorio', type: 'textarea', required: true },
      { name: 'procedimientoRealizado', label: 'Procedimiento realizado', type: 'textarea', required: true },
      { name: 'tecnicaQuirurgica', label: 'Técnica quirúrgica', type: 'textarea' },
      { name: 'hallazgos', label: 'Hallazgos', type: 'textarea' },
      { name: 'horaInicio', label: 'Hora de inicio', type: 'time' },
      { name: 'horaFin', label: 'Hora de finalización', type: 'time' },
      { name: 'cirujano', label: 'Cirujano', type: 'text', required: true },
      { name: 'ayudantes', label: 'Ayudantes', type: 'text' },
      { name: 'anestesiologo', label: 'Anestesiólogo', type: 'text' },
      { name: 'tipoAnestesia', label: 'Tipo de anestesia', type: 'select', options: ['General', 'Regional', 'Local', 'Sedación'] },
      { name: 'complicaciones', label: 'Complicaciones', type: 'textarea' },
    ],
    tituloImpresion: 'NOTA OPERATORIA',
    grupoMenu: 'Quirófano',
  },
  {
    key: 'registro_anestesico',
    label: 'Registro Anestésico',
    labelPlural: 'Registros Anestésicos',
    prefijo: 'RA',
    familia: 'medico',
    fiscal: false,
    numeroControl: false,
    contraparte: 'paciente',
    tieneItems: false,
    itemsConPrecio: false,
    tieneFirmantes: true,
    tieneReferencia: false,
    camposExtra: [
      { name: 'tipoAnestesia', label: 'Tipo de anestesia', type: 'select', options: ['General', 'Regional', 'Local', 'Sedación'], required: true },
      { name: 'medicamentosAdministrados', label: 'Medicamentos administrados', type: 'textarea', required: true },
      { name: 'signosVitalesTransoperatorios', label: 'Signos vitales transoperatorios', type: 'textarea' },
      { name: 'horaInicio', label: 'Hora de inicio', type: 'time' },
      { name: 'horaFin', label: 'Hora de finalización', type: 'time' },
      { name: 'incidentes', label: 'Incidentes / Complicaciones', type: 'textarea' },
      { name: 'anestesiologo', label: 'Anestesiólogo', type: 'text', required: true },
    ],
    tituloImpresion: 'REGISTRO ANESTÉSICO',
    grupoMenu: 'Quirófano',
  },
  {
    key: 'hoja_evolucion',
    label: 'Hoja de Evolución Médica',
    labelPlural: 'Hojas de Evolución',
    prefijo: 'HE',
    familia: 'medico',
    fiscal: false,
    numeroControl: false,
    contraparte: 'paciente',
    tieneItems: false,
    itemsConPrecio: false,
    tieneFirmantes: true,
    tieneReferencia: false,
    camposExtra: [
      { name: 'estadoActual', label: 'Estado actual del paciente', type: 'textarea', required: true },
      { name: 'examenFisico', label: 'Examen físico', type: 'textarea' },
      { name: 'evaluacion', label: 'Evaluación', type: 'textarea' },
      { name: 'plan', label: 'Plan', type: 'textarea' },
      { name: 'medico', label: 'Médico', type: 'text' },
    ],
    tituloImpresion: 'HOJA DE EVOLUCIÓN MÉDICA',
    grupoMenu: 'Seguimiento',
  },
  {
    key: 'nota_enfermeria',
    label: 'Nota de Enfermería',
    labelPlural: 'Notas de Enfermería',
    prefijo: 'NENF',
    familia: 'medico',
    fiscal: false,
    numeroControl: false,
    contraparte: 'paciente',
    tieneItems: false,
    itemsConPrecio: false,
    tieneFirmantes: true,
    tieneReferencia: false,
    camposExtra: [
      { name: 'turno', label: 'Turno', type: 'select', options: ['Mañana', 'Tarde', 'Noche'] },
      { name: 'signosVitales', label: 'Signos vitales', type: 'text' },
      { name: 'cuidadosBrindados', label: 'Cuidados brindados', type: 'textarea', required: true },
      { name: 'observacionesEnfermeria', label: 'Observaciones', type: 'textarea' },
      { name: 'enfermeroResponsable', label: 'Enfermero(a) responsable', type: 'text' },
    ],
    tituloImpresion: 'NOTA DE ENFERMERÍA',
    grupoMenu: 'Seguimiento',
  },
  {
    key: 'informe_egreso',
    label: 'Informe de Egreso / Alta Médica',
    labelPlural: 'Informes de Egreso',
    prefijo: 'IE',
    familia: 'medico',
    fiscal: false,
    numeroControl: false,
    contraparte: 'paciente',
    tieneItems: false,
    itemsConPrecio: false,
    tieneFirmantes: true,
    tieneReferencia: true,
    referenciaTipos: ['admision'],
    camposExtra: [
      { name: 'fechaIngreso', label: 'Fecha de ingreso', type: 'date', required: true },
      { name: 'fechaEgreso', label: 'Fecha de egreso', type: 'date', required: true },
      { name: 'diagnosticoIngreso', label: 'Diagnóstico de ingreso', type: 'textarea', required: true },
      { name: 'diagnosticoEgreso', label: 'Diagnóstico de egreso', type: 'textarea', required: true },
      { name: 'resumenEstadia', label: 'Resumen de la estadía', type: 'textarea', required: true },
      { name: 'tratamientoIndicado', label: 'Tratamiento indicado', type: 'textarea' },
      { name: 'recomendaciones', label: 'Recomendaciones', type: 'textarea' },
      { name: 'proximaCita', label: 'Próxima cita', type: 'date' },
      { name: 'medicoTratante', label: 'Médico tratante', type: 'text' },
    ],
    tituloImpresion: 'INFORME DE EGRESO / ALTA MÉDICA',
    grupoMenu: 'Egreso',
  },
];

export function getDocumentType(key: string): DocumentTypeConfig | undefined {
  return DOCUMENT_TYPES.find((t) => t.key === key);
}
