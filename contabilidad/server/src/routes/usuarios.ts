import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db, runInTransaction } from '../db';
import { requireAdmin, requireAuth } from '../middleware/auth';

export const usuariosRouter = Router();
usuariosRouter.use(requireAuth, requireAdmin);

function otorgarEmpresas(usuarioId: number, empresaIds: number[]) {
  db.prepare('DELETE FROM usuario_empresas WHERE usuario_id = ?').run(usuarioId);
  const insertar = db.prepare('INSERT OR IGNORE INTO usuario_empresas (usuario_id, empresa_id) VALUES (?, ?)');
  for (const empresaId of empresaIds) insertar.run(usuarioId, empresaId);
}

usuariosRouter.get('/', (_req, res) => {
  const usuarios = db.prepare('SELECT id, nombre, email, rol, activo, created_at FROM usuarios ORDER BY nombre').all() as { id: number }[];
  const empresasPorUsuario = db.prepare('SELECT usuario_id, empresa_id FROM usuario_empresas').all() as {
    usuario_id: number;
    empresa_id: number;
  }[];
  const mapa = new Map<number, number[]>();
  for (const fila of empresasPorUsuario) {
    if (!mapa.has(fila.usuario_id)) mapa.set(fila.usuario_id, []);
    mapa.get(fila.usuario_id)!.push(fila.empresa_id);
  }
  res.json(usuarios.map((u) => ({ ...u, empresaIds: mapa.get(u.id) ?? [] })));
});

const crearSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  rol: z.enum(['admin', 'operador']).default('operador'),
  empresaIds: z.array(z.number().int()).default([]),
});

usuariosRouter.post('/', (req, res) => {
  const parsed = crearSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const { nombre, email, password, rol, empresaIds } = parsed.data;
  const hash = bcrypt.hashSync(password, 10);
  try {
    const id = runInTransaction(() => {
      const info = db
        .prepare('INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)')
        .run(nombre, email, hash, rol);
      const usuarioId = info.lastInsertRowid as number;
      otorgarEmpresas(usuarioId, empresaIds);
      return usuarioId;
    });
    res.status(201).json({ id });
  } catch (e) {
    res.status(409).json({ error: 'Ya existe un usuario con ese correo' });
  }
});

const actualizarSchema = z.object({
  nombre: z.string().min(1).optional(),
  rol: z.enum(['admin', 'operador']).optional(),
  activo: z.boolean().optional(),
  password: z.string().min(6).optional(),
  empresaIds: z.array(z.number().int()).optional(),
});

usuariosRouter.put('/:id', (req, res) => {
  const parsed = actualizarSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const id = Number(req.params.id);
  const { nombre, rol, activo, password, empresaIds } = parsed.data;

  runInTransaction(() => {
    if (nombre !== undefined) db.prepare('UPDATE usuarios SET nombre = ? WHERE id = ?').run(nombre, id);
    if (rol !== undefined) db.prepare('UPDATE usuarios SET rol = ? WHERE id = ?').run(rol, id);
    if (activo !== undefined) db.prepare('UPDATE usuarios SET activo = ? WHERE id = ?').run(activo ? 1 : 0, id);
    if (password) {
      const hash = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(hash, id);
    }
    if (empresaIds !== undefined) otorgarEmpresas(id, empresaIds);
  });
  res.json({ ok: true });
});
