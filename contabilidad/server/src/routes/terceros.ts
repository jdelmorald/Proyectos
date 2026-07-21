import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';
import { requireAccesoEmpresaBody, requireAccesoEmpresaQuery, requireAccesoRecurso } from '../middleware/accesoEmpresa';

export const tercerosRouter = Router();
tercerosRouter.use(requireAuth, requireAccesoEmpresaQuery, requireAccesoEmpresaBody);

tercerosRouter.get('/', (req, res) => {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return res.status(400).json({ error: 'Debe indicar empresaId' });
  const tipo = req.query.tipo as string | undefined;
  let sql = 'SELECT * FROM terceros WHERE empresa_id = ? AND activo = 1';
  const params: (string | number)[] = [empresaId];
  if (tipo) { sql += ' AND tipo = ?'; params.push(tipo); }
  sql += ' ORDER BY nombre';
  res.json(db.prepare(sql).all(...params));
});

const terceroSchema = z.object({
  empresaId: z.number().int(),
  tipo: z.enum(['cliente', 'proveedor']),
  nombre: z.string().min(1),
  rif: z.string().optional().nullable(),
});

tercerosRouter.post('/', (req, res) => {
  const parsed = terceroSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  const info = db
    .prepare('INSERT INTO terceros (empresa_id, tipo, nombre, rif) VALUES (?, ?, ?, ?)')
    .run(d.empresaId, d.tipo, d.nombre, d.rif ?? null);
  res.status(201).json({ id: info.lastInsertRowid });
});

tercerosRouter.put('/:id', (req, res) => {
  const parsed = terceroSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  db.prepare('UPDATE terceros SET tipo=?, nombre=?, rif=? WHERE id=? AND empresa_id=?').run(
    d.tipo, d.nombre, d.rif ?? null, req.params.id, d.empresaId
  );
  res.json({ ok: true });
});

tercerosRouter.delete('/:id', requireAccesoRecurso('terceros'), (req, res) => {
  const enUso = db.prepare('SELECT id FROM cuentas_pendientes WHERE tercero_id = ? LIMIT 1').get(req.params.id);
  if (enUso) {
    return res.status(409).json({ error: 'No se puede eliminar: el tercero tiene cuentas pendientes registradas' });
  }
  db.prepare('UPDATE terceros SET activo = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
