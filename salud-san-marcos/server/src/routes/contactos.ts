import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';

export const contactosRouter = Router();
contactosRouter.use(requireAuth);

contactosRouter.get('/', (req, res) => {
  const tipo = req.query.tipo as string | undefined;
  const q = (req.query.q as string | undefined)?.trim();

  let sql = 'SELECT * FROM contactos WHERE activo = 1';
  const params: (string | number | null)[] = [];
  if (tipo === 'cliente' || tipo === 'proveedor') {
    sql += ' AND tipo = ?';
    params.push(tipo);
  }
  if (q) {
    sql += ' AND (nombre LIKE ? OR rif_cedula LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY nombre';
  res.json(db.prepare(sql).all(...params));
});

contactosRouter.get('/:id', (req, res) => {
  const contacto = db.prepare('SELECT * FROM contactos WHERE id = ?').get(req.params.id);
  if (!contacto) return res.status(404).json({ error: 'No encontrado' });
  res.json(contacto);
});

const contactoSchema = z.object({
  tipo: z.enum(['cliente', 'proveedor']),
  nombre: z.string().min(1),
  rifCedula: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  contactoNombre: z.string().optional().nullable(),
});

contactosRouter.post('/', (req, res) => {
  const parsed = contactoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  const info = db
    .prepare(
      `INSERT INTO contactos (tipo, nombre, rif_cedula, direccion, telefono, email, contacto_nombre) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(d.tipo, d.nombre, d.rifCedula ?? null, d.direccion ?? null, d.telefono ?? null, d.email ?? null, d.contactoNombre ?? null);
  res.status(201).json({ id: info.lastInsertRowid });
});

contactosRouter.put('/:id', (req, res) => {
  const parsed = contactoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const id = Number(req.params.id);
  const existente = db.prepare('SELECT id FROM contactos WHERE id = ?').get(id);
  if (!existente) return res.status(404).json({ error: 'No encontrado' });
  const d = parsed.data;
  db.prepare(
    `UPDATE contactos SET tipo=?, nombre=?, rif_cedula=?, direccion=?, telefono=?, email=?, contacto_nombre=? WHERE id=?`
  ).run(d.tipo, d.nombre, d.rifCedula ?? null, d.direccion ?? null, d.telefono ?? null, d.email ?? null, d.contactoNombre ?? null, id);
  res.json({ ok: true });
});

contactosRouter.delete('/:id', (req, res) => {
  db.prepare('UPDATE contactos SET activo = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
