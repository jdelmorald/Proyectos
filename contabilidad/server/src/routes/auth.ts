import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db';
import { firmarToken, requireAuth } from '../middleware/auth';
import { AuthUser } from '../types';

export const authRouter = Router();

const SELECT_PERFIL = `
  SELECT u.id, u.nombre, u.email, u.rol, u.cedula, u.cargo, u.foto_data_url, u.empresa_principal_id,
    e.nombre AS empresa_principal_nombre
  FROM usuarios u
  LEFT JOIN empresas e ON e.id = u.empresa_principal_id
  WHERE u.id = ?
`;

function mapPerfil(fila: any) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    email: fila.email,
    rol: fila.rol,
    cedula: fila.cedula,
    cargo: fila.cargo,
    fotoDataUrl: fila.foto_data_url,
    empresaPrincipalId: fila.empresa_principal_id,
    empresaPrincipalNombre: fila.empresa_principal_nombre,
  };
}

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

  // El JWT solo lleva lo mínimo para autorizar (id/nombre/email/rol) — la foto y
  // el resto del perfil viajan aparte en la respuesta, nunca dentro del token,
  // porque el token se reenvía en cada llamada a la API como encabezado.
  const user: AuthUser = { id: fila.id, nombre: fila.nombre, email: fila.email, rol: fila.rol };
  const token = firmarToken(user);
  const perfil = mapPerfil(db.prepare(SELECT_PERFIL).get(fila.id));
  res.json({ token, user: perfil });
});

authRouter.get('/me', requireAuth, (req, res) => {
  const fila = db.prepare(SELECT_PERFIL).get(req.user!.id);
  if (!fila) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ user: mapPerfil(fila) });
});

const perfilSchema = z.object({
  nombre: z.string().min(1).optional(),
  cedula: z.string().max(30).optional().nullable(),
  cargo: z.string().max(80).optional().nullable(),
  fotoDataUrl: z.string().max(2_000_000).optional().nullable(),
});

authRouter.put('/perfil', requireAuth, (req, res) => {
  const parsed = perfilSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const { nombre, cedula, cargo, fotoDataUrl } = parsed.data;
  const id = req.user!.id;
  if (nombre !== undefined) db.prepare('UPDATE usuarios SET nombre = ? WHERE id = ?').run(nombre, id);
  if (cedula !== undefined) db.prepare('UPDATE usuarios SET cedula = ? WHERE id = ?').run(cedula, id);
  if (cargo !== undefined) db.prepare('UPDATE usuarios SET cargo = ? WHERE id = ?').run(cargo, id);
  if (fotoDataUrl !== undefined) db.prepare('UPDATE usuarios SET foto_data_url = ? WHERE id = ?').run(fotoDataUrl, id);
  const perfil = mapPerfil(db.prepare(SELECT_PERFIL).get(id));
  res.json({ user: perfil });
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
