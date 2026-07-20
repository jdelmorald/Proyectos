import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { requireAdmin, requireAuth } from '../middleware/auth';

export const empresasRouter = Router();
empresasRouter.use(requireAuth);

empresasRouter.get('/', (_req, res) => {
  res.json(db.prepare('SELECT * FROM empresas WHERE activo = 1 ORDER BY nombre').all());
});

const empresaSchema = z.object({
  nombre: z.string().min(1),
  rif: z.string().optional().nullable(),
  moneda: z.string().min(1).default('Bs.'),
  municipio: z.string().optional().nullable(),
  alicuotaMunicipal: z.number().min(0).default(0),
  valorUt: z.number().min(0).default(0),
});

empresasRouter.post('/', requireAdmin, (req, res) => {
  const parsed = empresaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  const info = db
    .prepare('INSERT INTO empresas (nombre, rif, moneda, municipio, alicuota_municipal, valor_ut) VALUES (?, ?, ?, ?, ?, ?)')
    .run(d.nombre, d.rif ?? null, d.moneda, d.municipio ?? null, d.alicuotaMunicipal, d.valorUt);
  res.status(201).json({ id: info.lastInsertRowid });
});

empresasRouter.put('/:id', requireAdmin, (req, res) => {
  const parsed = empresaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const id = Number(req.params.id);
  const d = parsed.data;
  db.prepare(
    'UPDATE empresas SET nombre=?, rif=?, moneda=?, municipio=?, alicuota_municipal=?, valor_ut=? WHERE id=?'
  ).run(d.nombre, d.rif ?? null, d.moneda, d.municipio ?? null, d.alicuotaMunicipal, d.valorUt, id);
  res.json({ ok: true });
});
