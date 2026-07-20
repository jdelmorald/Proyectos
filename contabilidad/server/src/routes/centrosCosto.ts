import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';

export const centrosCostoRouter = Router();
centrosCostoRouter.use(requireAuth);

centrosCostoRouter.get('/', (req, res) => {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return res.status(400).json({ error: 'Debe indicar empresaId' });
  res.json(
    db.prepare('SELECT * FROM centros_costo WHERE empresa_id = ? AND activo = 1 ORDER BY codigo').all(empresaId)
  );
});

const centroSchema = z.object({
  empresaId: z.number().int(),
  codigo: z.string().min(1),
  nombre: z.string().min(1),
});

centrosCostoRouter.post('/', (req, res) => {
  const parsed = centroSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  try {
    const info = db
      .prepare('INSERT INTO centros_costo (empresa_id, codigo, nombre) VALUES (?, ?, ?)')
      .run(d.empresaId, d.codigo, d.nombre);
    res.status(201).json({ id: info.lastInsertRowid });
  } catch {
    res.status(409).json({ error: 'Ya existe un centro de costo con ese código en esta empresa' });
  }
});

centrosCostoRouter.put('/:id', (req, res) => {
  const parsed = centroSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  db.prepare('UPDATE centros_costo SET codigo=?, nombre=? WHERE id=? AND empresa_id=?').run(
    d.codigo, d.nombre, req.params.id, d.empresaId
  );
  res.json({ ok: true });
});

centrosCostoRouter.delete('/:id', (req, res) => {
  const enUso = db.prepare('SELECT id FROM asiento_lineas WHERE centro_costo_id = ? LIMIT 1').get(req.params.id);
  if (enUso) {
    return res.status(409).json({ error: 'No se puede eliminar: el centro de costo tiene movimientos registrados' });
  }
  db.prepare('UPDATE centros_costo SET activo = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
