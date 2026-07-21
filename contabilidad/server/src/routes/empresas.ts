import { Router } from 'express';
import { z } from 'zod';
import { db, runInTransaction } from '../db';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { usuarioTieneAcceso } from '../middleware/accesoEmpresa';
import { generarSiguienteNumeroAsiento } from '../services/correlativo';
import { insertarPlanCuentasDefault } from '../services/planCuentasDefault';

export const empresasRouter = Router();
empresasRouter.use(requireAuth);

// Solo devuelve las empresas a las que el usuario logueado tiene acceso otorgado
// explícitamente (tabla usuario_empresas) — es la base de que un analista de
// Sumivensa, por ejemplo, ni siquiera vea que existen las otras empresas.
empresasRouter.get('/', (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT e.* FROM empresas e
         JOIN usuario_empresas ue ON ue.empresa_id = e.id AND ue.usuario_id = ?
         WHERE e.activo = 1 ORDER BY e.nombre`
      )
      .all(req.user!.id)
  );
});

const empresaSchema = z.object({
  nombre: z.string().min(1),
  rif: z.string().optional().nullable(),
  moneda: z.string().min(1).default('Bs.'),
  municipio: z.string().optional().nullable(),
  alicuotaMunicipal: z.number().min(0).default(0),
  valorUt: z.number().min(0).default(0),
  logoDataUrl: z.string().max(2_000_000).optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#0f766e'),
});

empresasRouter.post('/', requireAdmin, (req, res) => {
  const parsed = empresaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  const id = runInTransaction(() => {
    const info = db
      .prepare(
        'INSERT INTO empresas (nombre, rif, moneda, municipio, alicuota_municipal, valor_ut, logo_data_url, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(d.nombre, d.rif ?? null, d.moneda, d.municipio ?? null, d.alicuotaMunicipal, d.valorUt, d.logoDataUrl ?? null, d.color);
    const empresaId = info.lastInsertRowid as number;
    // Toda empresa nueva arranca con el mismo plan de cuentas base que las demás,
    // para poder registrar asientos de inmediato en igualdad de condiciones.
    insertarPlanCuentasDefault(empresaId);
    // Quien crea la empresa queda con acceso automáticamente; para que la vean
    // otros usuarios, un administrador se lo otorga desde Usuarios.
    db.prepare('INSERT OR IGNORE INTO usuario_empresas (usuario_id, empresa_id) VALUES (?, ?)').run(req.user!.id, empresaId);
    return empresaId;
  });
  res.status(201).json({ id });
});

empresasRouter.put('/:id', requireAdmin, (req, res) => {
  const parsed = empresaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const id = Number(req.params.id);
  if (!usuarioTieneAcceso(req.user!.id, id)) {
    return res.status(403).json({ error: 'No tiene acceso a esta empresa' });
  }
  const d = parsed.data;
  db.prepare(
    'UPDATE empresas SET nombre=?, rif=?, moneda=?, municipio=?, alicuota_municipal=?, valor_ut=?, logo_data_url=?, color=? WHERE id=?'
  ).run(d.nombre, d.rif ?? null, d.moneda, d.municipio ?? null, d.alicuotaMunicipal, d.valorUt, d.logoDataUrl ?? null, d.color, id);
  res.json({ ok: true });
});

empresasRouter.delete('/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existente = db.prepare('SELECT id FROM empresas WHERE id = ? AND activo = 1').get(id);
  if (!existente) return res.status(404).json({ error: 'No encontrada' });
  if (!usuarioTieneAcceso(req.user!.id, id)) {
    return res.status(403).json({ error: 'No tiene acceso a esta empresa' });
  }
  // Se desactiva en vez de borrar: así ningún asiento u otro registro histórico
  // que ya haga referencia a esta empresa queda huérfano. Deja de aparecer en
  // el sistema por completo, igual que un borrado, pero de forma reversible.
  db.prepare('UPDATE empresas SET activo = 0 WHERE id = ?').run(id);
  res.json({ ok: true });
});

// --- Datos de ejemplo: para explorar el sistema con movimientos ya cargados ---

const PREFIJO_DEMO = '[DEMO] ';

function idsCuentasPorCodigo(empresaId: number, codigos: string[]): Record<string, number> {
  const placeholders = codigos.map(() => '?').join(',');
  const filas = db
    .prepare(`SELECT id, codigo FROM plan_cuentas WHERE empresa_id = ? AND codigo IN (${placeholders})`)
    .all(empresaId, ...codigos) as { id: number; codigo: string }[];
  const mapa: Record<string, number> = {};
  for (const f of filas) mapa[f.codigo] = f.id;
  return mapa;
}

function obtenerOCrearTercero(empresaId: number, tipo: 'cliente' | 'proveedor', nombre: string, rif: string): number {
  const existente = db.prepare('SELECT id FROM terceros WHERE empresa_id = ? AND nombre = ?').get(empresaId, nombre) as
    | { id: number }
    | undefined;
  if (existente) return existente.id;
  const info = db.prepare('INSERT INTO terceros (empresa_id, tipo, nombre, rif) VALUES (?, ?, ?, ?)').run(empresaId, tipo, nombre, rif);
  return info.lastInsertRowid as number;
}

function obtenerOCrearCentroCosto(empresaId: number, codigo: string, nombre: string): number {
  const existente = db.prepare('SELECT id FROM centros_costo WHERE empresa_id = ? AND codigo = ?').get(empresaId, codigo) as
    | { id: number }
    | undefined;
  if (existente) return existente.id;
  const info = db.prepare('INSERT INTO centros_costo (empresa_id, codigo, nombre) VALUES (?, ?, ?)').run(empresaId, codigo, nombre);
  return info.lastInsertRowid as number;
}

interface LineaDemo {
  cuentaId: number;
  debe?: number;
  haber?: number;
  centroCostoId?: number;
  terceroId?: number;
  fechaVencimiento?: string;
  moneda?: 'VES' | 'USD';
  montoOriginal?: number;
  tasaCambio?: number;
  descripcion?: string;
}

function crearAsientoDemo(
  empresaId: number,
  usuarioId: number,
  fecha: string,
  tipo: 'apertura' | 'manual',
  descripcion: string,
  lineas: LineaDemo[]
) {
  runInTransaction(() => {
    const numero = generarSiguienteNumeroAsiento(empresaId);
    const info = db
      .prepare(
        `INSERT INTO asientos (empresa_id, numero, fecha, tipo, descripcion, estado, creado_por)
         VALUES (?, ?, ?, ?, ?, 'registrado', ?)`
      )
      .run(empresaId, numero, fecha, tipo, PREFIJO_DEMO + descripcion, usuarioId);
    const asientoId = info.lastInsertRowid as number;

    const insertLinea = db.prepare(
      `INSERT INTO asiento_lineas (asiento_id, cuenta_id, centro_costo_id, tercero_id, fecha_vencimiento, descripcion, debe, haber, moneda, monto_original, tasa_cambio, orden)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertPendiente = db.prepare(
      `INSERT INTO cuentas_pendientes (empresa_id, tipo, tercero_id, asiento_id, numero_referencia, fecha_emision, fecha_vencimiento, monto_original, saldo_pendiente, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const cuentaSubledger = db.prepare('SELECT subledger FROM plan_cuentas WHERE id = ?');

    lineas.forEach((l, i) => {
      insertLinea.run(
        asientoId,
        l.cuentaId,
        l.centroCostoId ?? null,
        l.terceroId ?? null,
        l.fechaVencimiento ?? null,
        l.descripcion ?? null,
        l.debe ?? 0,
        l.haber ?? 0,
        l.moneda ?? 'VES',
        l.montoOriginal ?? null,
        l.tasaCambio ?? null,
        i
      );
      const subledger = (cuentaSubledger.get(l.cuentaId) as { subledger: string | null } | undefined)?.subledger;
      if (subledger === 'cxc' && (l.debe ?? 0) > 0 && l.terceroId) {
        insertPendiente.run(empresaId, 'cxc', l.terceroId, asientoId, numero, fecha, l.fechaVencimiento ?? null, l.debe ?? 0, l.debe ?? 0, l.descripcion ?? null);
      } else if (subledger === 'cxp' && (l.haber ?? 0) > 0 && l.terceroId) {
        insertPendiente.run(empresaId, 'cxp', l.terceroId, asientoId, numero, fecha, l.fechaVencimiento ?? null, l.haber ?? 0, l.haber ?? 0, l.descripcion ?? null);
      }
    });
  });
}

function haceNDias(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

empresasRouter.post('/:id/datos-demo', requireAdmin, (req, res) => {
  const empresaId = Number(req.params.id);
  const empresa = db.prepare('SELECT id FROM empresas WHERE id = ? AND activo = 1').get(empresaId);
  if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });
  if (!usuarioTieneAcceso(req.user!.id, empresaId)) {
    return res.status(403).json({ error: 'No tiene acceso a esta empresa' });
  }

  const codigos = ['1.1.01', '1.1.02', '1.1.03', '1.1.04', '1.1.05', '1.2.01', '2.1.01', '2.1.02', '3.1.01', '4.1.01', '6.1.01', '6.1.02'];
  const c = idsCuentasPorCodigo(empresaId, codigos);
  const faltantes = codigos.filter((cod) => !c[cod]);
  if (faltantes.length > 0) {
    return res.status(409).json({
      error: `Esta empresa no tiene el plan de cuentas estándar completo (faltan códigos: ${faltantes.join(', ')}), no se pueden generar los datos de ejemplo.`,
    });
  }

  try {
    runInTransaction(() => {
      const cliente = obtenerOCrearTercero(empresaId, 'cliente', 'Cliente Demo C.A.', 'J-00000000-1');
      const proveedor = obtenerOCrearTercero(empresaId, 'proveedor', 'Proveedor Demo S.A.', 'J-00000000-2');
      const centroAdmin = obtenerOCrearCentroCosto(empresaId, 'ADM', 'Administración');
      const centroVentas = obtenerOCrearCentroCosto(empresaId, 'VEN', 'Ventas');

      const existeTasa = db.prepare('SELECT id FROM tasas_cambio WHERE fecha = ? AND moneda = ?').get(haceNDias(10), 'USD');
      if (!existeTasa) {
        db.prepare('INSERT INTO tasas_cambio (fecha, moneda, tasa) VALUES (?, ?, ?)').run(haceNDias(10), 'USD', 40);
      }

      crearAsientoDemo(empresaId, req.user!.id, haceNDias(50), 'apertura', 'Aporte de capital inicial', [
        { cuentaId: c['1.1.02'], debe: 50000, descripcion: 'Depósito de capital en banco' },
        { cuentaId: c['3.1.01'], haber: 50000, descripcion: 'Aporte de capital inicial' },
      ]);

      crearAsientoDemo(empresaId, req.user!.id, haceNDias(45), 'manual', 'Compra de mobiliario y equipos de oficina', [
        { cuentaId: c['1.2.01'], debe: 3000, centroCostoId: centroAdmin, descripcion: 'Mobiliario de oficina' },
        { cuentaId: c['1.1.02'], haber: 3000, descripcion: 'Pago según transferencia' },
      ]);

      crearAsientoDemo(empresaId, req.user!.id, haceNDias(30), 'manual', 'Venta de servicios a crédito - Cliente Demo C.A.', [
        { cuentaId: c['1.1.03'], debe: 1160, terceroId: cliente, fechaVencimiento: haceNDias(0), centroCostoId: centroVentas, descripcion: 'Factura a 30 días' },
        { cuentaId: c['4.1.01'], haber: 1000, descripcion: 'Venta de servicios' },
        { cuentaId: c['2.1.02'], haber: 160, descripcion: 'IVA débito fiscal 16%' },
      ]);

      crearAsientoDemo(empresaId, req.user!.id, haceNDias(25), 'manual', 'Compra de mercancía a crédito - Proveedor Demo S.A.', [
        { cuentaId: c['1.1.04'], debe: 800, descripcion: 'Compra de mercancía' },
        { cuentaId: c['1.1.05'], debe: 128, descripcion: 'IVA crédito fiscal 16%' },
        { cuentaId: c['2.1.01'], haber: 928, terceroId: proveedor, fechaVencimiento: haceNDias(-5), descripcion: 'Factura a 30 días' },
      ]);

      crearAsientoDemo(empresaId, req.user!.id, haceNDias(20), 'manual', 'Pago de nómina quincenal', [
        { cuentaId: c['6.1.01'], debe: 2500, centroCostoId: centroAdmin, descripcion: 'Nómina quincenal' },
        { cuentaId: c['1.1.02'], haber: 2500, descripcion: 'Pago vía transferencia' },
      ]);

      crearAsientoDemo(empresaId, req.user!.id, haceNDias(15), 'manual', 'Pago de alquiler de oficina', [
        { cuentaId: c['6.1.02'], debe: 600, centroCostoId: centroAdmin, descripcion: 'Alquiler del mes' },
        { cuentaId: c['1.1.01'], haber: 600, descripcion: 'Pago en efectivo' },
      ]);

      crearAsientoDemo(empresaId, req.user!.id, haceNDias(10), 'manual', 'Venta en dólares - Cliente Demo C.A.', [
        {
          cuentaId: c['1.1.03'], debe: 8000, terceroId: cliente, fechaVencimiento: haceNDias(-5), centroCostoId: centroVentas,
          moneda: 'USD', montoOriginal: 200, tasaCambio: 40, descripcion: 'Venta en USD a crédito',
        },
        { cuentaId: c['4.1.01'], haber: 8000, descripcion: 'Venta de servicios en USD' },
      ]);
    });
    res.status(201).json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error al generar los datos de ejemplo' });
  }
});

empresasRouter.delete('/:id/datos-demo', requireAdmin, (req, res) => {
  const empresaId = Number(req.params.id);
  const asientos = db
    .prepare(`SELECT id FROM asientos WHERE empresa_id = ? AND estado = 'registrado' AND descripcion LIKE ?`)
    .all(empresaId, `${PREFIJO_DEMO}%`) as { id: number }[];

  runInTransaction(() => {
    for (const a of asientos) {
      db.prepare(`UPDATE asientos SET estado='anulado', motivo_anulacion=?, updated_at=datetime('now') WHERE id=?`).run(
        'Datos de ejemplo removidos',
        a.id
      );
      db.prepare(`UPDATE cuentas_pendientes SET estado='anulado' WHERE asiento_id=?`).run(a.id);
    }
  });
  res.json({ ok: true, anulados: asientos.length });
});
