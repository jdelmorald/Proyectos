import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';
import { requireAccesoEmpresaBody, requireAccesoEmpresaQuery, requireAccesoRecurso } from '../middleware/accesoEmpresa';

export const flujoProyectadoRouter = Router();
flujoProyectadoRouter.use(requireAuth, requireAccesoEmpresaQuery, requireAccesoEmpresaBody);

flujoProyectadoRouter.get('/', (req, res) => {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return res.status(400).json({ error: 'Debe indicar empresaId' });
  const desdePeriodo = req.query.desde as string | undefined;
  const hastaPeriodo = req.query.hasta as string | undefined;

  let sql = 'SELECT * FROM flujo_caja_proyectado WHERE empresa_id = ?';
  const params: (string | number)[] = [empresaId];
  if (desdePeriodo) { sql += ' AND periodo >= ?'; params.push(desdePeriodo); }
  if (hastaPeriodo) { sql += ' AND periodo <= ?'; params.push(hastaPeriodo); }
  sql += ' ORDER BY periodo, categoria, id';
  res.json(db.prepare(sql).all(...params));
});

// Resumen por periodo: ingresos, egresos y saldo neto proyectado, con acumulado
flujoProyectadoRouter.get('/resumen', (req, res) => {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return res.status(400).json({ error: 'Debe indicar empresaId' });

  const filas = db
    .prepare(
      `SELECT periodo, categoria, COALESCE(SUM(monto_proyectado), 0) AS total
       FROM flujo_caja_proyectado WHERE empresa_id = ? GROUP BY periodo, categoria ORDER BY periodo`
    )
    .all(empresaId) as { periodo: string; categoria: 'ingreso' | 'egreso'; total: number }[];

  const periodos = new Map<string, { periodo: string; ingresos: number; egresos: number }>();
  for (const f of filas) {
    if (!periodos.has(f.periodo)) periodos.set(f.periodo, { periodo: f.periodo, ingresos: 0, egresos: 0 });
    const p = periodos.get(f.periodo)!;
    if (f.categoria === 'ingreso') p.ingresos = f.total;
    else p.egresos = f.total;
  }

  let acumulado = 0;
  const resumen = [...periodos.values()]
    .sort((a, b) => a.periodo.localeCompare(b.periodo))
    .map((p) => {
      const neto = p.ingresos - p.egresos;
      acumulado += neto;
      return { ...p, neto, acumulado };
    });

  res.json(resumen);
});

const registroSchema = z.object({
  empresaId: z.number().int(),
  periodo: z.string().regex(/^\d{4}-\d{2}$/, 'Formato de periodo inválido (YYYY-MM)'),
  categoria: z.enum(['ingreso', 'egreso']),
  concepto: z.string().min(1),
  montoProyectado: z.number(),
  observaciones: z.string().optional().nullable(),
});

flujoProyectadoRouter.post('/', (req, res) => {
  const parsed = registroSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  const info = db
    .prepare(
      `INSERT INTO flujo_caja_proyectado (empresa_id, periodo, categoria, concepto, monto_proyectado, observaciones)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(d.empresaId, d.periodo, d.categoria, d.concepto, d.montoProyectado, d.observaciones ?? null);
  res.status(201).json({ id: info.lastInsertRowid });
});

flujoProyectadoRouter.put('/:id', requireAccesoRecurso('flujo_caja_proyectado'), (req, res) => {
  const parsed = registroSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const id = Number(req.params.id);
  const d = parsed.data;
  db.prepare(
    `UPDATE flujo_caja_proyectado SET periodo=?, categoria=?, concepto=?, monto_proyectado=?, observaciones=? WHERE id=? AND empresa_id=?`
  ).run(d.periodo, d.categoria, d.concepto, d.montoProyectado, d.observaciones ?? null, id, d.empresaId);
  res.json({ ok: true });
});

flujoProyectadoRouter.delete('/:id', requireAccesoRecurso('flujo_caja_proyectado'), (req, res) => {
  db.prepare('DELETE FROM flujo_caja_proyectado WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
