import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';

export const tasasCambioRouter = Router();
tasasCambioRouter.use(requireAuth);

tasasCambioRouter.get('/', (req, res) => {
  const moneda = req.query.moneda as string | undefined;
  const desde = req.query.desde as string | undefined;
  const hasta = req.query.hasta as string | undefined;
  let sql = 'SELECT * FROM tasas_cambio WHERE 1=1';
  const params: (string | number)[] = [];
  if (moneda) { sql += ' AND moneda = ?'; params.push(moneda); }
  if (desde) { sql += ' AND fecha >= ?'; params.push(desde); }
  if (hasta) { sql += ' AND fecha <= ?'; params.push(hasta); }
  sql += ' ORDER BY fecha DESC, moneda';
  res.json(db.prepare(sql).all(...params));
});

// Última tasa vigente para una moneda en o antes de una fecha (o hoy).
tasasCambioRouter.get('/vigente', (req, res) => {
  const moneda = req.query.moneda as string;
  const fecha = (req.query.fecha as string | undefined) || new Date().toISOString().slice(0, 10);
  if (!moneda) return res.status(400).json({ error: 'Debe indicar moneda' });
  const fila = db
    .prepare('SELECT * FROM tasas_cambio WHERE moneda = ? AND fecha <= ? ORDER BY fecha DESC LIMIT 1')
    .get(moneda, fecha);
  if (!fila) return res.status(404).json({ error: `No hay tasa registrada para ${moneda}` });
  res.json(fila);
});

const tasaSchema = z.object({
  fecha: z.string().min(1),
  moneda: z.enum(['USD', 'COP', 'EUR']),
  tasa: z.number().positive(),
});

tasasCambioRouter.post('/', (req, res) => {
  const parsed = tasaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  db.prepare(
    `INSERT INTO tasas_cambio (fecha, moneda, tasa) VALUES (?, ?, ?)
     ON CONFLICT (fecha, moneda) DO UPDATE SET tasa = excluded.tasa`
  ).run(d.fecha, d.moneda, d.tasa);
  res.status(201).json({ ok: true });
});

tasasCambioRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tasas_cambio WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
