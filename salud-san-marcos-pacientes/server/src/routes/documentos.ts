import { Router } from 'express';
import { z } from 'zod';
import { db, runInTransaction } from '../db';
import { requireAuth } from '../middleware/auth';
import { getDocumentType } from '../documentTypes';
import { generarSiguienteNumero } from '../services/correlativo';
import { calcularTotales } from '../services/totales';
import { ItemLinea, Firmante } from '../types';

export const documentosRouter = Router();
documentosRouter.use(requireAuth);

const FISCALES_INMUTABLES = new Set(['factura', 'nota_credito', 'nota_debito', 'retencion_iva']);

function mapFila(fila: any) {
  return {
    id: fila.id,
    tipo: fila.tipo,
    numero: fila.numero,
    numeroControl: fila.numero_control,
    fecha: fila.fecha,
    contactoId: fila.contacto_id,
    referenciaDocumentoId: fila.referencia_documento_id,
    estado: fila.estado,
    motivoAnulacion: fila.motivo_anulacion,
    datos: JSON.parse(fila.datos_json || '{}'),
    items: JSON.parse(fila.items_json || '[]'),
    firmantes: JSON.parse(fila.firmantes_json || '[]'),
    subtotal: fila.subtotal,
    baseImponible: fila.base_imponible,
    montoExento: fila.monto_exento,
    ivaPorcentaje: fila.iva_porcentaje,
    ivaMonto: fila.iva_monto,
    total: fila.total,
    observaciones: fila.observaciones,
    creadoPor: fila.creado_por,
    createdAt: fila.created_at,
    updatedAt: fila.updated_at,
    contactoNombre: fila.contacto_nombre,
    contactoRif: fila.contacto_rif,
    pacienteFechaNacimiento: fila.paciente_fecha_nacimiento,
    pacienteSexo: fila.paciente_sexo,
    pacienteTipoSangre: fila.paciente_tipo_sangre,
    pacienteAlergias: fila.paciente_alergias,
    pacienteNumeroHistoria: fila.paciente_numero_historia,
    referenciaNumero: fila.referencia_numero,
  };
}

const SELECT_BASE = `
  SELECT d.*, c.nombre AS contacto_nombre, c.cedula AS contacto_rif,
    c.fecha_nacimiento AS paciente_fecha_nacimiento, c.sexo AS paciente_sexo,
    c.tipo_sangre AS paciente_tipo_sangre, c.alergias AS paciente_alergias,
    c.numero_historia AS paciente_numero_historia,
    r.numero AS referencia_numero
  FROM documentos d
  LEFT JOIN pacientes c ON c.id = d.contacto_id
  LEFT JOIN documentos r ON r.id = d.referencia_documento_id
`;

documentosRouter.get('/', (req, res) => {
  const tipo = req.query.tipo as string | undefined;
  if (!tipo || !getDocumentType(tipo)) {
    return res.status(400).json({ error: 'Debe indicar un tipo de documento válido' });
  }
  const estado = req.query.estado as string | undefined;
  const q = (req.query.q as string | undefined)?.trim();

  let sql = SELECT_BASE + ' WHERE d.tipo = ?';
  const params: (string | number | null)[] = [tipo];
  if (estado) {
    sql += ' AND d.estado = ?';
    params.push(estado);
  }
  if (q) {
    sql += ' AND (d.numero LIKE ? OR c.nombre LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY d.id DESC LIMIT 500';

  const filas = db.prepare(sql).all(...params) as any[];
  res.json(filas.map(mapFila));
});

documentosRouter.get('/:id', (req, res) => {
  const fila = db.prepare(SELECT_BASE + ' WHERE d.id = ?').get(req.params.id) as any;
  if (!fila) return res.status(404).json({ error: 'No encontrado' });
  res.json(mapFila(fila));
});

const itemSchema: z.ZodType<ItemLinea> = z.object({
  codigo: z.string().optional(),
  descripcion: z.string().min(1),
  cantidad: z.number(),
  unidad: z.string().optional(),
  precioUnitario: z.number().optional(),
  exento: z.boolean().optional(),
});

const firmanteSchema: z.ZodType<Firmante> = z.object({
  nombre: z.string().min(1),
  cargo: z.string().optional(),
  cedula: z.string().optional(),
});

const crearSchema = z.object({
  tipo: z.string(),
  fecha: z.string().min(1),
  contactoId: z.number().int().nullable().optional(),
  referenciaDocumentoId: z.number().int().nullable().optional(),
  datos: z.record(z.any()).default({}),
  items: z.array(itemSchema).default([]),
  firmantes: z.array(firmanteSchema).default([]),
  ivaPorcentaje: z.number().min(0).max(100).optional(),
  observaciones: z.string().optional().nullable(),
});

documentosRouter.post('/', (req, res) => {
  const parsed = crearSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  const config = getDocumentType(d.tipo);
  if (!config) return res.status(400).json({ error: `Tipo de documento desconocido: ${d.tipo}` });

  if (config.contraparte === 'paciente' && !d.contactoId) {
    return res.status(400).json({ error: 'Debe seleccionar un paciente' });
  }

  const empresa = db.prepare('SELECT iva_porcentaje_default FROM empresa WHERE id = 1').get() as {
    iva_porcentaje_default: number;
  };
  const ivaPorcentaje = d.ivaPorcentaje ?? empresa.iva_porcentaje_default;

  const totales = config.tieneItems && config.itemsConPrecio
    ? calcularTotales(d.items, ivaPorcentaje)
    : { subtotal: 0, baseImponible: 0, montoExento: 0, ivaPorcentaje: 0, ivaMonto: 0, total: 0 };

  // Para comprobantes de pago sin renglones de ítems, el "monto" viene en los campos extra.
  if (!config.tieneItems && typeof d.datos.monto === 'number') {
    totales.total = d.datos.monto;
    totales.subtotal = d.datos.monto;
  }

  try {
    const id = runInTransaction(() => {
      const { numero, numeroControl } = generarSiguienteNumero(config.key, config.numeroControl);

      const info = db
        .prepare(
          `INSERT INTO documentos
            (tipo, numero, numero_control, fecha, contacto_id, referencia_documento_id, estado, datos_json, items_json, firmantes_json, subtotal, base_imponible, monto_exento, iva_porcentaje, iva_monto, total, observaciones, creado_por)
           VALUES (?, ?, ?, ?, ?, ?, 'emitido', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          config.key,
          numero,
          numeroControl,
          d.fecha,
          d.contactoId ?? null,
          d.referenciaDocumentoId ?? null,
          JSON.stringify(d.datos),
          JSON.stringify(d.items),
          JSON.stringify(d.firmantes),
          totales.subtotal,
          totales.baseImponible,
          totales.montoExento,
          totales.ivaPorcentaje,
          totales.ivaMonto,
          totales.total,
          d.observaciones ?? null,
          req.user!.id
        );
      return info.lastInsertRowid as number;
    });

    const fila = db.prepare(SELECT_BASE + ' WHERE d.id = ?').get(id) as any;
    res.status(201).json(mapFila(fila));
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error al generar el documento' });
  }
});

const actualizarSchema = z.object({
  datos: z.record(z.any()).optional(),
  items: z.array(itemSchema).optional(),
  firmantes: z.array(firmanteSchema).optional(),
  observaciones: z.string().optional().nullable(),
});

documentosRouter.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const existente = db.prepare('SELECT * FROM documentos WHERE id = ?').get(id) as any;
  if (!existente) return res.status(404).json({ error: 'No encontrado' });
  if (existente.estado === 'anulado') return res.status(409).json({ error: 'El documento está anulado' });

  const parsed = actualizarSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  const esFiscal = FISCALES_INMUTABLES.has(existente.tipo);

  if (esFiscal && (d.datos || d.items || d.firmantes)) {
    return res.status(409).json({
      error: 'Este documento es fiscal y no puede modificarse tras emitido. Use una Nota de Crédito/Débito para corregirlo.',
    });
  }

  const config = getDocumentType(existente.tipo)!;
  const datos = d.datos ?? JSON.parse(existente.datos_json);
  const items = d.items ?? JSON.parse(existente.items_json);
  const firmantes = d.firmantes ?? JSON.parse(existente.firmantes_json);

  const totales = config.tieneItems && config.itemsConPrecio
    ? calcularTotales(items, existente.iva_porcentaje || 16)
    : {
        subtotal: existente.subtotal,
        baseImponible: existente.base_imponible,
        montoExento: existente.monto_exento,
        ivaMonto: existente.iva_monto,
        total: typeof datos.monto === 'number' ? datos.monto : existente.total,
      };

  db.prepare(
    `UPDATE documentos SET datos_json=?, items_json=?, firmantes_json=?, observaciones=?, subtotal=?, base_imponible=?, monto_exento=?, iva_monto=?, total=?, updated_at=datetime('now') WHERE id=?`
  ).run(
    JSON.stringify(datos),
    JSON.stringify(items),
    JSON.stringify(firmantes),
    d.observaciones !== undefined ? d.observaciones : existente.observaciones,
    totales.subtotal,
    totales.baseImponible,
    totales.montoExento,
    totales.ivaMonto,
    totales.total,
    id
  );

  const fila = db.prepare(SELECT_BASE + ' WHERE d.id = ?').get(id) as any;
  res.json(mapFila(fila));
});

const anularSchema = z.object({ motivo: z.string().min(3) });

documentosRouter.post('/:id/anular', (req, res) => {
  const parsed = anularSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Debe indicar el motivo de anulación (mínimo 3 caracteres)' });
  }
  const id = Number(req.params.id);
  const existente = db.prepare('SELECT id, estado FROM documentos WHERE id = ?').get(id) as any;
  if (!existente) return res.status(404).json({ error: 'No encontrado' });
  if (existente.estado === 'anulado') return res.status(409).json({ error: 'Ya estaba anulado' });

  db.prepare(`UPDATE documentos SET estado='anulado', motivo_anulacion=?, updated_at=datetime('now') WHERE id=?`).run(
    parsed.data.motivo,
    id
  );
  res.json({ ok: true });
});
