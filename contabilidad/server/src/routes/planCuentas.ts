import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';
import { requireAccesoEmpresaBody, requireAccesoEmpresaQuery, requireAccesoRecurso } from '../middleware/accesoEmpresa';

export const planCuentasRouter = Router();
planCuentasRouter.use(requireAuth, requireAccesoEmpresaQuery, requireAccesoEmpresaBody);

planCuentasRouter.get('/', (req, res) => {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return res.status(400).json({ error: 'Debe indicar empresaId' });
  const cuentas = db
    .prepare('SELECT * FROM plan_cuentas WHERE empresa_id = ? AND activo = 1 ORDER BY codigo')
    .all(empresaId);
  res.json(cuentas);
});

const cuentaSchema = z.object({
  empresaId: z.number().int(),
  codigo: z.string().min(1),
  nombre: z.string().min(1),
  tipo: z.enum(['activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto', 'costo']),
  naturaleza: z.enum(['deudora', 'acreedora']),
  cuentaPadreId: z.number().int().nullable().optional(),
  nivel: z.number().int().min(1).default(1),
  permiteMovimiento: z.boolean().default(true),
  esEfectivo: z.boolean().default(false),
  actividadFlujo: z.enum(['operacion', 'inversion', 'financiamiento']).nullable().optional(),
  subledger: z.enum(['cxc', 'cxp']).nullable().optional(),
});

planCuentasRouter.post('/', (req, res) => {
  const parsed = cuentaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  try {
    const info = db
      .prepare(
        `INSERT INTO plan_cuentas (empresa_id, codigo, nombre, tipo, naturaleza, cuenta_padre_id, nivel, permite_movimiento, es_efectivo, actividad_flujo, subledger)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        d.empresaId,
        d.codigo,
        d.nombre,
        d.tipo,
        d.naturaleza,
        d.cuentaPadreId ?? null,
        d.nivel,
        d.permiteMovimiento ? 1 : 0,
        d.esEfectivo ? 1 : 0,
        d.actividadFlujo ?? null,
        d.subledger ?? null
      );
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (e: any) {
    res.status(409).json({ error: 'Ya existe una cuenta con ese código en esta empresa' });
  }
});

planCuentasRouter.put('/:id', (req, res) => {
  const parsed = cuentaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const id = Number(req.params.id);
  const d = parsed.data;
  db.prepare(
    `UPDATE plan_cuentas SET codigo=?, nombre=?, tipo=?, naturaleza=?, cuenta_padre_id=?, nivel=?, permite_movimiento=?, es_efectivo=?, actividad_flujo=?, subledger=? WHERE id=? AND empresa_id=?`
  ).run(
    d.codigo,
    d.nombre,
    d.tipo,
    d.naturaleza,
    d.cuentaPadreId ?? null,
    d.nivel,
    d.permiteMovimiento ? 1 : 0,
    d.esEfectivo ? 1 : 0,
    d.actividadFlujo ?? null,
    d.subledger ?? null,
    id,
    d.empresaId
  );
  res.json({ ok: true });
});

planCuentasRouter.delete('/:id', requireAccesoRecurso('plan_cuentas'), (req, res) => {
  const enUso = db.prepare('SELECT id FROM asiento_lineas WHERE cuenta_id = ? LIMIT 1').get(req.params.id);
  if (enUso) {
    return res.status(409).json({ error: 'No se puede eliminar: la cuenta tiene movimientos registrados' });
  }
  db.prepare('UPDATE plan_cuentas SET activo = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
