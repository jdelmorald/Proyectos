import { Router } from 'express';
import { z } from 'zod';
import { db, runInTransaction } from '../db';
import { requireAuth } from '../middleware/auth';
import { generarSiguienteNumeroAsiento } from '../services/correlativo';

export const asientosRouter = Router();
asientosRouter.use(requireAuth);

function mapAsiento(fila: any, lineas: any[]) {
  return {
    id: fila.id,
    empresaId: fila.empresa_id,
    numero: fila.numero,
    fecha: fila.fecha,
    tipo: fila.tipo,
    descripcion: fila.descripcion,
    estado: fila.estado,
    motivoAnulacion: fila.motivo_anulacion,
    creadoPor: fila.creado_por,
    createdAt: fila.created_at,
    lineas: lineas.map((l) => ({
      id: l.id,
      cuentaId: l.cuenta_id,
      cuentaCodigo: l.codigo,
      cuentaNombre: l.nombre,
      subledger: l.subledger,
      centroCostoId: l.centro_costo_id,
      centroCostoNombre: l.centro_costo_nombre,
      terceroId: l.tercero_id,
      terceroNombre: l.tercero_nombre,
      fechaVencimiento: l.fecha_vencimiento,
      descripcion: l.descripcion,
      debe: l.debe,
      haber: l.haber,
      moneda: l.moneda,
      montoOriginal: l.monto_original,
      tasaCambio: l.tasa_cambio,
    })),
  };
}

const SELECT_LINEAS = `
  SELECT al.*, pc.codigo, pc.nombre, pc.subledger, cc.nombre AS centro_costo_nombre, t.nombre AS tercero_nombre
  FROM asiento_lineas al
  JOIN plan_cuentas pc ON pc.id = al.cuenta_id
  LEFT JOIN centros_costo cc ON cc.id = al.centro_costo_id
  LEFT JOIN terceros t ON t.id = al.tercero_id
  WHERE al.asiento_id = ? ORDER BY al.orden
`;

asientosRouter.get('/', (req, res) => {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return res.status(400).json({ error: 'Debe indicar empresaId' });
  const desde = req.query.desde as string | undefined;
  const hasta = req.query.hasta as string | undefined;
  const estado = req.query.estado as string | undefined;
  const q = (req.query.q as string | undefined)?.trim();

  let sql = 'SELECT * FROM asientos WHERE empresa_id = ?';
  const params: (string | number)[] = [empresaId];
  if (desde) { sql += ' AND fecha >= ?'; params.push(desde); }
  if (hasta) { sql += ' AND fecha <= ?'; params.push(hasta); }
  if (estado) { sql += ' AND estado = ?'; params.push(estado); }
  if (q) { sql += ' AND (numero LIKE ? OR descripcion LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY fecha DESC, id DESC LIMIT 500';

  const asientos = db.prepare(sql).all(...params) as any[];
  const lineasStmt = db.prepare(SELECT_LINEAS);
  res.json(asientos.map((a) => mapAsiento(a, lineasStmt.all(a.id) as any[])));
});

asientosRouter.get('/:id', (req, res) => {
  const fila = db.prepare('SELECT * FROM asientos WHERE id = ?').get(req.params.id) as any;
  if (!fila) return res.status(404).json({ error: 'No encontrado' });
  const lineas = db.prepare(SELECT_LINEAS).all(fila.id) as any[];
  res.json(mapAsiento(fila, lineas));
});

const lineaSchema = z.object({
  cuentaId: z.number().int(),
  descripcion: z.string().optional(),
  debe: z.number().min(0).default(0),
  haber: z.number().min(0).default(0),
  centroCostoId: z.number().int().nullable().optional(),
  terceroId: z.number().int().nullable().optional(),
  fechaVencimiento: z.string().nullable().optional(),
  moneda: z.enum(['VES', 'USD', 'COP', 'EUR']).default('VES'),
  montoOriginal: z.number().nullable().optional(),
  tasaCambio: z.number().positive().nullable().optional(),
});

const crearSchema = z.object({
  empresaId: z.number().int(),
  fecha: z.string().min(1),
  tipo: z.enum(['apertura', 'manual', 'ajuste', 'cierre']).default('manual'),
  descripcion: z.string().optional().nullable(),
  lineas: z.array(lineaSchema).min(2, 'Un asiento requiere al menos 2 líneas'),
});

asientosRouter.post('/', (req, res) => {
  const parsed = crearSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;

  const totalDebe = d.lineas.reduce((s, l) => s + l.debe, 0);
  const totalHaber = d.lineas.reduce((s, l) => s + l.haber, 0);
  if (Math.round(totalDebe * 100) !== Math.round(totalHaber * 100)) {
    return res.status(400).json({ error: `El asiento no cuadra: Debe ${totalDebe.toFixed(2)} ≠ Haber ${totalHaber.toFixed(2)}` });
  }
  if (totalDebe === 0) {
    return res.status(400).json({ error: 'El asiento no puede tener montos en cero' });
  }
  for (const l of d.lineas) {
    if (l.debe > 0 && l.haber > 0) {
      return res.status(400).json({ error: 'Una línea no puede tener monto en Debe y en Haber a la vez' });
    }
    if (l.debe === 0 && l.haber === 0) {
      return res.status(400).json({ error: 'Cada línea debe tener un monto en Debe o en Haber' });
    }
    if (l.moneda !== 'VES' && (!l.montoOriginal || !l.tasaCambio)) {
      return res.status(400).json({ error: 'Las líneas en moneda extranjera requieren monto original y tasa de cambio' });
    }
  }

  const cuentaIds = d.lineas.map((l) => l.cuentaId);
  const placeholders = cuentaIds.map(() => '?').join(',');
  const cuentas = db
    .prepare(`SELECT id, permite_movimiento, empresa_id, subledger FROM plan_cuentas WHERE id IN (${placeholders})`)
    .all(...cuentaIds) as { id: number; permite_movimiento: number; empresa_id: number; subledger: string | null }[];
  const cuentasMap = new Map(cuentas.map((c) => [c.id, c]));
  for (const l of d.lineas) {
    const cuenta = cuentasMap.get(l.cuentaId);
    if (!cuenta || cuenta.empresa_id !== d.empresaId) {
      return res.status(400).json({ error: 'Una de las cuentas no pertenece a esta empresa' });
    }
    if (!cuenta.permite_movimiento) {
      return res.status(400).json({ error: 'Una de las cuentas seleccionadas es de agrupación y no permite movimientos' });
    }
    if (cuenta.subledger && !l.terceroId) {
      return res.status(400).json({ error: 'Las líneas sobre cuentas de Cuentas por Cobrar/Pagar requieren indicar el tercero (cliente/proveedor)' });
    }
  }

  try {
    const id = runInTransaction(() => {
      const numero = generarSiguienteNumeroAsiento(d.empresaId);
      const info = db
        .prepare(
          `INSERT INTO asientos (empresa_id, numero, fecha, tipo, descripcion, estado, creado_por)
           VALUES (?, ?, ?, ?, ?, 'registrado', ?)`
        )
        .run(d.empresaId, numero, d.fecha, d.tipo, d.descripcion ?? null, req.user!.id);
      const asientoId = info.lastInsertRowid as number;

      const insertLinea = db.prepare(
        `INSERT INTO asiento_lineas (asiento_id, cuenta_id, centro_costo_id, tercero_id, fecha_vencimiento, descripcion, debe, haber, moneda, monto_original, tasa_cambio, orden)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      const insertPendiente = db.prepare(
        `INSERT INTO cuentas_pendientes (empresa_id, tipo, tercero_id, asiento_id, numero_referencia, fecha_emision, fecha_vencimiento, monto_original, saldo_pendiente, observaciones)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      d.lineas.forEach((l, i) => {
        insertLinea.run(
          asientoId, l.cuentaId, l.centroCostoId ?? null, l.terceroId ?? null, l.fechaVencimiento ?? null,
          l.descripcion ?? null, l.debe, l.haber, l.moneda, l.montoOriginal ?? null, l.tasaCambio ?? null, i
        );

        const cuenta = cuentasMap.get(l.cuentaId)!;
        if (cuenta.subledger === 'cxc' && l.debe > 0 && l.terceroId) {
          insertPendiente.run(d.empresaId, 'cxc', l.terceroId, asientoId, numero, d.fecha, l.fechaVencimiento ?? null, l.debe, l.debe, l.descripcion ?? null);
        } else if (cuenta.subledger === 'cxp' && l.haber > 0 && l.terceroId) {
          insertPendiente.run(d.empresaId, 'cxp', l.terceroId, asientoId, numero, d.fecha, l.fechaVencimiento ?? null, l.haber, l.haber, l.descripcion ?? null);
        }
      });
      return asientoId;
    });

    const fila = db.prepare('SELECT * FROM asientos WHERE id = ?').get(id) as any;
    const lineas = db.prepare(SELECT_LINEAS).all(id) as any[];
    res.status(201).json(mapAsiento(fila, lineas));
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error al registrar el asiento' });
  }
});

const anularSchema = z.object({ motivo: z.string().min(3) });

asientosRouter.post('/:id/anular', (req, res) => {
  const parsed = anularSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Debe indicar el motivo de anulación (mínimo 3 caracteres)' });
  }
  const id = Number(req.params.id);
  const existente = db.prepare('SELECT id, estado FROM asientos WHERE id = ?').get(id) as any;
  if (!existente) return res.status(404).json({ error: 'No encontrado' });
  if (existente.estado === 'anulado') return res.status(409).json({ error: 'Ya estaba anulado' });

  runInTransaction(() => {
    db.prepare(`UPDATE asientos SET estado='anulado', motivo_anulacion=?, updated_at=datetime('now') WHERE id=?`).run(
      parsed.data.motivo,
      id
    );
    db.prepare(`UPDATE cuentas_pendientes SET estado='anulado' WHERE asiento_id=?`).run(id);
  });
  res.json({ ok: true });
});
