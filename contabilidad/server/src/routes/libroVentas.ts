import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';

export const libroVentasRouter = Router();
libroVentasRouter.use(requireAuth);

libroVentasRouter.get('/', (req, res) => {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return res.status(400).json({ error: 'Debe indicar empresaId' });
  const desde = req.query.desde as string | undefined;
  const hasta = req.query.hasta as string | undefined;

  let sql = 'SELECT * FROM libro_ventas WHERE empresa_id = ?';
  const params: (string | number)[] = [empresaId];
  if (desde) { sql += ' AND fecha >= ?'; params.push(desde); }
  if (hasta) { sql += ' AND fecha <= ?'; params.push(hasta); }
  sql += ' ORDER BY fecha, id';
  res.json(db.prepare(sql).all(...params));
});

const registroSchema = z.object({
  empresaId: z.number().int(),
  fecha: z.string().min(1),
  tipoDocumento: z.string().min(1).default('Factura'),
  numeroFactura: z.string().min(1),
  numeroControl: z.string().optional().nullable(),
  clienteRif: z.string().optional().nullable(),
  clienteNombre: z.string().min(1),
  baseImponible: z.number().min(0).default(0),
  exento: z.number().min(0).default(0),
  ivaPorcentaje: z.number().min(0).default(16),
  ivaMonto: z.number().min(0).default(0),
  ivaRetenido: z.number().min(0).default(0),
  total: z.number().min(0),
  observaciones: z.string().optional().nullable(),
});

libroVentasRouter.post('/', (req, res) => {
  const parsed = registroSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  const info = db
    .prepare(
      `INSERT INTO libro_ventas (empresa_id, fecha, tipo_documento, numero_factura, numero_control, cliente_rif, cliente_nombre, base_imponible, exento, iva_porcentaje, iva_monto, iva_retenido, total, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      d.empresaId, d.fecha, d.tipoDocumento, d.numeroFactura, d.numeroControl ?? null,
      d.clienteRif ?? null, d.clienteNombre, d.baseImponible, d.exento, d.ivaPorcentaje, d.ivaMonto, d.ivaRetenido, d.total,
      d.observaciones ?? null
    );
  res.status(201).json({ id: info.lastInsertRowid });
});

libroVentasRouter.put('/:id', (req, res) => {
  const parsed = registroSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const id = Number(req.params.id);
  const d = parsed.data;
  db.prepare(
    `UPDATE libro_ventas SET fecha=?, tipo_documento=?, numero_factura=?, numero_control=?, cliente_rif=?, cliente_nombre=?, base_imponible=?, exento=?, iva_porcentaje=?, iva_monto=?, iva_retenido=?, total=?, observaciones=? WHERE id=?`
  ).run(
    d.fecha, d.tipoDocumento, d.numeroFactura, d.numeroControl ?? null, d.clienteRif ?? null, d.clienteNombre,
    d.baseImponible, d.exento, d.ivaPorcentaje, d.ivaMonto, d.ivaRetenido, d.total, d.observaciones ?? null, id
  );
  res.json({ ok: true });
});

libroVentasRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM libro_ventas WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
