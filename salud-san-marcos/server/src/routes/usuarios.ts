import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db';
import { requireAdmin, requireAuth } from '../middleware/auth';

export const usuariosRouter = Router();
usuariosRouter.use(requireAuth, requireAdmin);

usuariosRouter.get('/', (_req, res) => {
  const usuarios = db.prepare('SELECT id, nombre, email, rol, activo, created_at FROM usuarios ORDER BY nombre').all();
  res.json(usuarios);
});

const crearSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  rol: z.enum(['admin', 'operador']).default('operador'),
});

usuariosRouter.post('/', (req, res) => {
  const parsed = crearSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const { nombre, email, password, rol } = parsed.data;
  const hash = bcrypt.hashSync(password, 10);
  try {
    const info = db
      .prepare('INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)')
      .run(nombre, email, hash, rol);
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (e) {
    res.status(409).json({ error: 'Ya existe un usuario con ese correo' });
  }
});

const actualizarSchema = z.object({
  nombre: z.string().min(1).optional(),
  rol: z.enum(['admin', 'operador']).optional(),
  activo: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

usuariosRouter.put('/:id', (req, res) => {
  const parsed = actualizarSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const id = Number(req.params.id);
  const { nombre, rol, activo, password } = parsed.data;

  if (nombre !== undefined) db.prepare('UPDATE usuarios SET nombre = ? WHERE id = ?').run(nombre, id);
  if (rol !== undefined) db.prepare('UPDATE usuarios SET rol = ? WHERE id = ?').run(rol, id);
  if (activo !== undefined) db.prepare('UPDATE usuarios SET activo = ? WHERE id = ?').run(activo ? 1 : 0, id);
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(hash, id);
  }
  res.json({ ok: true });
});
