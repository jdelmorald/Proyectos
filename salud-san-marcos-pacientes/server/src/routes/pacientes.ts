import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';

export const pacientesRouter = Router();
pacientesRouter.use(requireAuth);

pacientesRouter.get('/', (req, res) => {
  const q = (req.query.q as string | undefined)?.trim();
  let sql = 'SELECT * FROM pacientes WHERE activo = 1';
  const params: (string | number | null)[] = [];
  if (q) {
    sql += ' AND (nombre LIKE ? OR cedula LIKE ? OR numero_historia LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY nombre';
  res.json(db.prepare(sql).all(...params));
});

pacientesRouter.get('/:id', (req, res) => {
  const paciente = db.prepare('SELECT * FROM pacientes WHERE id = ?').get(req.params.id);
  if (!paciente) return res.status(404).json({ error: 'No encontrado' });
  res.json(paciente);
});

const pacienteSchema = z.object({
  numeroHistoria: z.string().optional().nullable(),
  nombre: z.string().min(1),
  cedula: z.string().optional().nullable(),
  fechaNacimiento: z.string().optional().nullable(),
  sexo: z.enum(['Masculino', 'Femenino']).optional().nullable(),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  tipoSangre: z.string().optional().nullable(),
  alergias: z.string().optional().nullable(),
  contactoEmergenciaNombre: z.string().optional().nullable(),
  contactoEmergenciaTelefono: z.string().optional().nullable(),
  seguro: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

pacientesRouter.post('/', (req, res) => {
  const parsed = pacienteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  const info = db
    .prepare(
      `INSERT INTO pacientes (numero_historia, nombre, cedula, fecha_nacimiento, sexo, telefono, direccion, tipo_sangre, alergias, contacto_emergencia_nombre, contacto_emergencia_telefono, seguro, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      d.numeroHistoria ?? null,
      d.nombre,
      d.cedula ?? null,
      d.fechaNacimiento ?? null,
      d.sexo ?? null,
      d.telefono ?? null,
      d.direccion ?? null,
      d.tipoSangre ?? null,
      d.alergias ?? null,
      d.contactoEmergenciaNombre ?? null,
      d.contactoEmergenciaTelefono ?? null,
      d.seguro ?? null,
      d.observaciones ?? null
    );
  res.status(201).json({ id: info.lastInsertRowid });
});

pacientesRouter.put('/:id', (req, res) => {
  const parsed = pacienteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const id = Number(req.params.id);
  const existente = db.prepare('SELECT id FROM pacientes WHERE id = ?').get(id);
  if (!existente) return res.status(404).json({ error: 'No encontrado' });
  const d = parsed.data;
  db.prepare(
    `UPDATE pacientes SET numero_historia=?, nombre=?, cedula=?, fecha_nacimiento=?, sexo=?, telefono=?, direccion=?, tipo_sangre=?, alergias=?, contacto_emergencia_nombre=?, contacto_emergencia_telefono=?, seguro=?, observaciones=? WHERE id=?`
  ).run(
    d.numeroHistoria ?? null,
    d.nombre,
    d.cedula ?? null,
    d.fechaNacimiento ?? null,
    d.sexo ?? null,
    d.telefono ?? null,
    d.direccion ?? null,
    d.tipoSangre ?? null,
    d.alergias ?? null,
    d.contactoEmergenciaNombre ?? null,
    d.contactoEmergenciaTelefono ?? null,
    d.seguro ?? null,
    d.observaciones ?? null,
    id
  );
  res.json({ ok: true });
});

pacientesRouter.delete('/:id', (req, res) => {
  db.prepare('UPDATE pacientes SET activo = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
