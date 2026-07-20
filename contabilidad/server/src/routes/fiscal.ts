import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';

export const fiscalRouter = Router();
fiscalRouter.use(requireAuth);

function periodoRango(req: any): { desde?: string; hasta?: string } {
  return { desde: req.query.desde as string | undefined, hasta: req.query.hasta as string | undefined };
}

/* ---------- IVA declarable (Libro de Compras + Libro de Ventas) ---------- */

fiscalRouter.get('/iva-declarable', (req, res) => {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return res.status(400).json({ error: 'Debe indicar empresaId' });
  const { desde, hasta } = periodoRango(req);

  let sqlVentas = 'SELECT COALESCE(SUM(base_imponible),0) AS base, COALESCE(SUM(iva_monto),0) AS iva, COALESCE(SUM(iva_retenido),0) AS retenido FROM libro_ventas WHERE empresa_id = ?';
  let sqlCompras = 'SELECT COALESCE(SUM(base_imponible),0) AS base, COALESCE(SUM(iva_monto),0) AS iva, COALESCE(SUM(iva_retenido),0) AS retenido FROM libro_compras WHERE empresa_id = ?';
  const params: (string | number)[] = [empresaId];
  if (desde) { sqlVentas += ' AND fecha >= ?'; sqlCompras += ' AND fecha >= ?'; }
  if (hasta) { sqlVentas += ' AND fecha <= ?'; sqlCompras += ' AND fecha <= ?'; }
  const paramsVentas = [empresaId, ...(desde ? [desde] : []), ...(hasta ? [hasta] : [])];
  const paramsCompras = [...paramsVentas];

  const ventas = db.prepare(sqlVentas).get(...paramsVentas) as { base: number; iva: number; retenido: number };
  const compras = db.prepare(sqlCompras).get(...paramsCompras) as { base: number; iva: number; retenido: number };

  const debitoFiscal = ventas.iva;
  const creditoFiscal = compras.iva;
  const excedenteOAPagarBruto = debitoFiscal - creditoFiscal;
  // Las retenciones de IVA que le hicieron a la empresa como vendedora son un crédito
  // contra el IVA a pagar (comprobantes de retención a favor del contribuyente).
  const ivaAPagar = Math.max(excedenteOAPagarBruto - ventas.retenido, 0);
  const excedenteCreditoFiscal = excedenteOAPagarBruto < 0 ? -excedenteOAPagarBruto : 0;

  res.json({
    ventas: { baseImponible: ventas.base, debitoFiscal, ivaRetenidoPorTerceros: ventas.retenido },
    compras: { baseImponible: compras.base, creditoFiscal, ivaRetenidoAProveedores: compras.retenido },
    ivaAPagar,
    excedenteCreditoFiscal,
    // El IVA retenido a proveedores es un pasivo a enterar al SENIAT (no forma parte del IVA a pagar propio).
    ivaRetenidoPorEnterar: compras.retenido,
  });
});

/* ---------- Retenciones de ISLR aplicadas a proveedores ---------- */

fiscalRouter.get('/retenciones-islr', (req, res) => {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return res.status(400).json({ error: 'Debe indicar empresaId' });
  const { desde, hasta } = periodoRango(req);
  let sql = 'SELECT * FROM retenciones_islr WHERE empresa_id = ?';
  const params: (string | number)[] = [empresaId];
  if (desde) { sql += ' AND fecha >= ?'; params.push(desde); }
  if (hasta) { sql += ' AND fecha <= ?'; params.push(hasta); }
  sql += ' ORDER BY fecha DESC, id DESC';
  res.json(db.prepare(sql).all(...params));
});

const retencionIslrSchema = z.object({
  empresaId: z.number().int(),
  fecha: z.string().min(1),
  proveedorRif: z.string().min(1),
  proveedorNombre: z.string().min(1),
  concepto: z.string().optional().nullable(),
  montoPagado: z.number().min(0),
  porcentajeRetencion: z.number().min(0),
  montoRetenido: z.number().min(0),
  numeroComprobante: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

fiscalRouter.post('/retenciones-islr', (req, res) => {
  const parsed = retencionIslrSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  const info = db
    .prepare(
      `INSERT INTO retenciones_islr (empresa_id, fecha, proveedor_rif, proveedor_nombre, concepto, monto_pagado, porcentaje_retencion, monto_retenido, numero_comprobante, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      d.empresaId, d.fecha, d.proveedorRif, d.proveedorNombre, d.concepto ?? null,
      d.montoPagado, d.porcentajeRetencion, d.montoRetenido, d.numeroComprobante ?? null, d.observaciones ?? null
    );
  res.status(201).json({ id: info.lastInsertRowid });
});

fiscalRouter.put('/retenciones-islr/:id', (req, res) => {
  const parsed = retencionIslrSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  db.prepare(
    `UPDATE retenciones_islr SET fecha=?, proveedor_rif=?, proveedor_nombre=?, concepto=?, monto_pagado=?, porcentaje_retencion=?, monto_retenido=?, numero_comprobante=?, observaciones=? WHERE id=?`
  ).run(
    d.fecha, d.proveedorRif, d.proveedorNombre, d.concepto ?? null, d.montoPagado,
    d.porcentajeRetencion, d.montoRetenido, d.numeroComprobante ?? null, d.observaciones ?? null, req.params.id
  );
  res.json({ ok: true });
});

fiscalRouter.delete('/retenciones-islr/:id', (req, res) => {
  db.prepare('DELETE FROM retenciones_islr WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ---------- IGTF (Impuesto a las Grandes Transacciones Financieras) ---------- */

fiscalRouter.get('/igtf', (req, res) => {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return res.status(400).json({ error: 'Debe indicar empresaId' });
  const { desde, hasta } = periodoRango(req);
  let sql = 'SELECT * FROM igtf_operaciones WHERE empresa_id = ?';
  const params: (string | number)[] = [empresaId];
  if (desde) { sql += ' AND fecha >= ?'; params.push(desde); }
  if (hasta) { sql += ' AND fecha <= ?'; params.push(hasta); }
  sql += ' ORDER BY fecha DESC, id DESC';
  const filas = db.prepare(sql).all(...params) as any[];
  const totalBase = filas.reduce((s, f) => s + f.base_imponible, 0);
  const totalMonto = filas.reduce((s, f) => s + f.monto, 0);
  res.json({ operaciones: filas, totalBase, totalMonto });
});

const igtfSchema = z.object({
  empresaId: z.number().int(),
  fecha: z.string().min(1),
  descripcion: z.string().min(1),
  baseImponible: z.number().min(0),
  alicuota: z.number().min(0).default(3),
  observaciones: z.string().optional().nullable(),
});

fiscalRouter.post('/igtf', (req, res) => {
  const parsed = igtfSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  const monto = Math.round(d.baseImponible * (d.alicuota / 100) * 100) / 100;
  const info = db
    .prepare(
      `INSERT INTO igtf_operaciones (empresa_id, fecha, descripcion, base_imponible, alicuota, monto, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(d.empresaId, d.fecha, d.descripcion, d.baseImponible, d.alicuota, monto, d.observaciones ?? null);
  res.status(201).json({ id: info.lastInsertRowid, monto });
});

fiscalRouter.delete('/igtf/:id', (req, res) => {
  db.prepare('DELETE FROM igtf_operaciones WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ---------- ISLR estimado (anticipos + tarifa progresiva Tarifa 2 - personas jurídicas) ---------- */

// Tarifa 2 del ISLR venezolano para personas jurídicas, expresada en Unidades Tributarias (UT).
const TARIFA_2_ISLR = [
  { hasta: 2000, tasa: 0.15, sustraendo: 0 },
  { hasta: 3000, tasa: 0.22, sustraendo: 140 },
  { hasta: Infinity, tasa: 0.34, sustraendo: 500 },
];

function calcularIslrTarifa2(utilidadFiscal: number, valorUt: number) {
  if (valorUt <= 0 || utilidadFiscal <= 0) {
    return { unidadesTributarias: 0, tasaAplicada: 0, impuestoEnUt: 0, impuestoBs: 0 };
  }
  const ut = utilidadFiscal / valorUt;
  const tramo = TARIFA_2_ISLR.find((t) => ut <= t.hasta)!;
  const impuestoEnUt = ut * tramo.tasa - tramo.sustraendo;
  const impuestoBs = Math.max(impuestoEnUt, 0) * valorUt;
  return { unidadesTributarias: ut, tasaAplicada: tramo.tasa, impuestoEnUt: Math.max(impuestoEnUt, 0), impuestoBs };
}

fiscalRouter.get('/islr-estimado', (req, res) => {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return res.status(400).json({ error: 'Debe indicar empresaId' });
  const { desde, hasta } = periodoRango(req);

  const empresa = db.prepare('SELECT valor_ut FROM empresas WHERE id = ?').get(empresaId) as { valor_ut: number } | undefined;
  const valorUt = empresa?.valor_ut ?? 0;

  function saldosPorTipo(tipos: string[]) {
    const placeholders = tipos.map(() => '?').join(',');
    let sql = `
      SELECT pc.naturaleza, COALESCE(SUM(al.debe),0) AS total_debe, COALESCE(SUM(al.haber),0) AS total_haber
      FROM plan_cuentas pc
      LEFT JOIN asiento_lineas al ON al.cuenta_id = pc.id
      LEFT JOIN asientos a ON a.id = al.asiento_id AND a.estado = 'registrado'
      WHERE pc.empresa_id = ? AND pc.permite_movimiento = 1 AND pc.tipo IN (${placeholders})
    `;
    const params: (string | number)[] = [empresaId, ...tipos];
    if (desde) { sql += ' AND (a.fecha IS NULL OR a.fecha >= ?)'; params.push(desde); }
    if (hasta) { sql += ' AND (a.fecha IS NULL OR a.fecha <= ?)'; params.push(hasta); }
    sql += ' GROUP BY pc.id';
    const filas = db.prepare(sql).all(...params) as any[];
    return filas.reduce((s, f) => s + (f.naturaleza === 'acreedora' ? f.total_haber - f.total_debe : f.total_debe - f.total_haber), 0);
  }

  const utilidadFiscal = saldosPorTipo(['ingreso']) - saldosPorTipo(['costo']) - saldosPorTipo(['gasto']);
  const { unidadesTributarias, tasaAplicada, impuestoEnUt, impuestoBs } = calcularIslrTarifa2(utilidadFiscal, valorUt);

  let sqlAnticipos = 'SELECT COALESCE(SUM(monto),0) AS total FROM islr_anticipos WHERE empresa_id = ?';
  const paramsAnticipos: (string | number)[] = [empresaId];
  if (desde) { sqlAnticipos += ' AND fecha >= ?'; paramsAnticipos.push(desde); }
  if (hasta) { sqlAnticipos += ' AND fecha <= ?'; paramsAnticipos.push(hasta); }
  const anticipos = (db.prepare(sqlAnticipos).get(...paramsAnticipos) as { total: number }).total;

  res.json({
    valorUt,
    utilidadFiscal,
    unidadesTributarias,
    tasaAplicada,
    impuestoEnUt,
    impuestoEstimado: impuestoBs,
    anticipos,
    saldoPorPagar: Math.max(impuestoBs - anticipos, 0),
    saldoAFavor: Math.max(anticipos - impuestoBs, 0),
  });
});

fiscalRouter.get('/islr-anticipos', (req, res) => {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return res.status(400).json({ error: 'Debe indicar empresaId' });
  const { desde, hasta } = periodoRango(req);
  let sql = 'SELECT * FROM islr_anticipos WHERE empresa_id = ?';
  const params: (string | number)[] = [empresaId];
  if (desde) { sql += ' AND fecha >= ?'; params.push(desde); }
  if (hasta) { sql += ' AND fecha <= ?'; params.push(hasta); }
  sql += ' ORDER BY fecha DESC, id DESC';
  res.json(db.prepare(sql).all(...params));
});

const islrAnticipoSchema = z.object({
  empresaId: z.number().int(),
  periodo: z.string().min(1),
  concepto: z.string().min(1),
  fecha: z.string().min(1),
  monto: z.number().min(0),
  observaciones: z.string().optional().nullable(),
});

fiscalRouter.post('/islr-anticipos', (req, res) => {
  const parsed = islrAnticipoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  const info = db
    .prepare('INSERT INTO islr_anticipos (empresa_id, periodo, concepto, fecha, monto, observaciones) VALUES (?, ?, ?, ?, ?, ?)')
    .run(d.empresaId, d.periodo, d.concepto, d.fecha, d.monto, d.observaciones ?? null);
  res.status(201).json({ id: info.lastInsertRowid });
});

fiscalRouter.delete('/islr-anticipos/:id', (req, res) => {
  db.prepare('DELETE FROM islr_anticipos WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ---------- Impuesto Municipal sobre Actividades Económicas ---------- */

fiscalRouter.get('/municipal', (req, res) => {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return res.status(400).json({ error: 'Debe indicar empresaId' });
  const { desde, hasta } = periodoRango(req);

  const empresa = db.prepare('SELECT municipio, alicuota_municipal FROM empresas WHERE id = ?').get(empresaId) as
    | { municipio: string | null; alicuota_municipal: number }
    | undefined;
  if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });

  let sql = 'SELECT COALESCE(SUM(base_imponible + exento),0) AS ingresos_brutos FROM libro_ventas WHERE empresa_id = ?';
  const params: (string | number)[] = [empresaId];
  if (desde) { sql += ' AND fecha >= ?'; params.push(desde); }
  if (hasta) { sql += ' AND fecha <= ?'; params.push(hasta); }
  const { ingresos_brutos: ingresosBrutos } = db.prepare(sql).get(...params) as { ingresos_brutos: number };

  const impuesto = Math.round(ingresosBrutos * (empresa.alicuota_municipal / 100) * 100) / 100;

  res.json({
    municipio: empresa.municipio,
    alicuotaMunicipal: empresa.alicuota_municipal,
    ingresosBrutos,
    impuestoMunicipal: impuesto,
  });
});
