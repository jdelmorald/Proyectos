import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db';
import { firmarToken, requireAuth } from '../middleware/auth';
import { AuthUser } from '../types';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const fila = db
    .prepare('SELECT id, nombre, email, password_hash, rol, activo FROM usuarios WHERE email = ?')
    .get(email) as
    | { id: number; nombre: string; email: string; password_hash: string; rol: 'admin' | 'operador'; activo: number }
    | undefined;

  if (!fila || !fila.activo || !bcrypt.compareSync(password, fila.password_hash)) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const user: AuthUser = { id: fila.id, nombre: fila.nombre, email: fila.email, rol: fila.rol };
  const token = firmarToken(user);
  res.json({ token, user });
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1),
  passwordNueva: z.string().min(6),
});

authRouter.post('/cambiar-password', requireAuth, (req, res) => {
  const parsed = cambiarPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const fila = db.prepare('SELECT password_hash FROM usuarios WHERE id = ?').get(req.user!.id) as
    | { password_hash: string }
    | undefined;
  if (!fila || !bcrypt.compareSync(parsed.data.passwordActual, fila.password_hash)) {
    return res.status(401).json({ error: 'La contraseña actual no es correcta' });
  }
  const nuevoHash = bcrypt.hashSync(parsed.data.passwordNueva, 10);
  db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(nuevoHash, req.user!.id);
  res.json({ ok: true });
});
