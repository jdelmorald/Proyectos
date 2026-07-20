import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';

export const productosRouter = Router();
productosRouter.use(requireAuth);

productosRouter.get('/', (req, res) => {
  const q = (req.query.q as string | undefined)?.trim();
  let sql = 'SELECT * FROM productos WHERE activo = 1';
  const params: (string | number | null)[] = [];
  if (q) {
    sql += ' AND (descripcion LIKE ? OR codigo LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY descripcion';
  res.json(db.prepare(sql).all(...params));
});

const productoSchema = z.object({
  codigo: z.string().optional().nullable(),
  descripcion: z.string().min(1),
  unidad: z.string().min(1).default('Unidad'),
  precioUnitario: z.number().min(0).default(0),
  exentoIva: z.boolean().default(false),
});

productosRouter.post('/', (req, res) => {
  const parsed = productoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  const info = db
    .prepare(`INSERT INTO productos (codigo, descripcion, unidad, precio_unitario, exento_iva) VALUES (?, ?, ?, ?, ?)`)
    .run(d.codigo ?? null, d.descripcion, d.unidad, d.precioUnitario, d.exentoIva ? 1 : 0);
  res.status(201).json({ id: info.lastInsertRowid });
});

productosRouter.put('/:id', (req, res) => {
  const parsed = productoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const id = Number(req.params.id);
  const existente = db.prepare('SELECT id FROM productos WHERE id = ?').get(id);
  if (!existente) return res.status(404).json({ error: 'No encontrado' });
  const d = parsed.data;
  db.prepare(`UPDATE productos SET codigo=?, descripcion=?, unidad=?, precio_unitario=?, exento_iva=? WHERE id=?`).run(
    d.codigo ?? null,
    d.descripcion,
    d.unidad,
    d.precioUnitario,
    d.exentoIva ? 1 : 0,
    id
  );
  res.json({ ok: true });
});

productosRouter.delete('/:id', (req, res) => {
  db.prepare('UPDATE productos SET activo = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
