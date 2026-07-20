import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';

export const activosRouter = Router();
activosRouter.use(requireAuth);

activosRouter.get('/', (req, res) => {
  const q = (req.query.q as string | undefined)?.trim();
  let sql = 'SELECT * FROM activos WHERE activo = 1';
  const params: (string | number | null)[] = [];
  if (q) {
    sql += ' AND (nombre LIKE ? OR codigo LIKE ? OR numero_serie LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY nombre';
  res.json(db.prepare(sql).all(...params));
});

const activoSchema = z.object({
  codigo: z.string().optional().nullable(),
  nombre: z.string().min(1),
  categoria: z.string().optional().nullable(),
  marcaModelo: z.string().optional().nullable(),
  numeroSerie: z.string().optional().nullable(),
  ubicacion: z.string().optional().nullable(),
  estado: z.enum(['Operativo', 'En mantenimiento', 'Fuera de servicio', 'De baja']).default('Operativo'),
  responsable: z.string().optional().nullable(),
  fechaAdquisicion: z.string().optional().nullable(),
  valorAdquisicion: z.number().optional().nullable(),
  proveedor: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

activosRouter.post('/', (req, res) => {
  const parsed = activoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  const info = db
    .prepare(
      `INSERT INTO activos (codigo, nombre, categoria, marca_modelo, numero_serie, ubicacion, estado, responsable, fecha_adquisicion, valor_adquisicion, proveedor, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      d.codigo ?? null,
      d.nombre,
      d.categoria ?? null,
      d.marcaModelo ?? null,
      d.numeroSerie ?? null,
      d.ubicacion ?? null,
      d.estado,
      d.responsable ?? null,
      d.fechaAdquisicion ?? null,
      d.valorAdquisicion ?? null,
      d.proveedor ?? null,
      d.observaciones ?? null
    );
  res.status(201).json({ id: info.lastInsertRowid });
});

activosRouter.put('/:id', (req, res) => {
  const parsed = activoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const id = Number(req.params.id);
  const existente = db.prepare('SELECT id FROM activos WHERE id = ?').get(id);
  if (!existente) return res.status(404).json({ error: 'No encontrado' });
  const d = parsed.data;
  db.prepare(
    `UPDATE activos SET codigo=?, nombre=?, categoria=?, marca_modelo=?, numero_serie=?, ubicacion=?, estado=?, responsable=?, fecha_adquisicion=?, valor_adquisicion=?, proveedor=?, observaciones=? WHERE id=?`
  ).run(
    d.codigo ?? null,
    d.nombre,
    d.categoria ?? null,
    d.marcaModelo ?? null,
    d.numeroSerie ?? null,
    d.ubicacion ?? null,
    d.estado,
    d.responsable ?? null,
    d.fechaAdquisicion ?? null,
    d.valorAdquisicion ?? null,
    d.proveedor ?? null,
    d.observaciones ?? null,
    id
  );
  res.json({ ok: true });
});

activosRouter.delete('/:id', (req, res) => {
  db.prepare('UPDATE activos SET activo = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
