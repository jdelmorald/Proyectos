import { Router } from 'express';
import { z } from 'zod';
import { db, runInTransaction } from '../db';
import { requireAuth } from '../middleware/auth';
import { requireAccesoEmpresaQuery, requireAccesoRecurso } from '../middleware/accesoEmpresa';
import { generarSiguienteNumeroAsiento } from '../services/correlativo';

export const cuentasPendientesRouter = Router();
cuentasPendientesRouter.use(requireAuth, requireAccesoEmpresaQuery);

function mapCuentaPendiente(fila: any) {
  return {
    id: fila.id,
    empresaId: fila.empresa_id,
    tipo: fila.tipo,
    terceroId: fila.tercero_id,
    terceroNombre: fila.tercero_nombre,
    asientoId: fila.asiento_id,
    asientoNumero: fila.asiento_numero,
    numeroReferencia: fila.numero_referencia,
    fechaEmision: fila.fecha_emision,
    fechaVencimiento: fila.fecha_vencimiento,
    montoOriginal: fila.monto_original,
    saldoPendiente: fila.saldo_pendiente,
    estado: fila.estado,
    observaciones: fila.observaciones,
  };
}

cuentasPendientesRouter.get('/', (req, res) => {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return res.status(400).json({ error: 'Debe indicar empresaId' });
  const tipo = req.query.tipo as string | undefined;
  const estado = req.query.estado as string | undefined;
  const terceroId = req.query.terceroId ? Number(req.query.terceroId) : undefined;

  let sql = `
    SELECT cp.*, t.nombre AS tercero_nombre, a.numero AS asiento_numero
    FROM cuentas_pendientes cp
    JOIN terceros t ON t.id = cp.tercero_id
    JOIN asientos a ON a.id = cp.asiento_id
    WHERE cp.empresa_id = ?
  `;
  const params: (string | number)[] = [empresaId];
  if (tipo) { sql += ' AND cp.tipo = ?'; params.push(tipo); }
  if (estado) { sql += ' AND cp.estado = ?'; params.push(estado); }
  if (terceroId) { sql += ' AND cp.tercero_id = ?'; params.push(terceroId); }
  sql += ' ORDER BY cp.fecha_vencimiento IS NULL, cp.fecha_vencimiento, cp.id DESC';

  const filas = db.prepare(sql).all(...params) as any[];
  res.json(filas.map(mapCuentaPendiente));
});

cuentasPendientesRouter.get('/:id', requireAccesoRecurso('cuentas_pendientes'), (req, res) => {
  const fila = db
    .prepare(
      `SELECT cp.*, t.nombre AS tercero_nombre, a.numero AS asiento_numero
       FROM cuentas_pendientes cp
       JOIN terceros t ON t.id = cp.tercero_id
       JOIN asientos a ON a.id = cp.asiento_id
       WHERE cp.id = ?`
    )
    .get(req.params.id) as any;
  if (!fila) return res.status(404).json({ error: 'No encontrado' });
  const abonos = db
    .prepare('SELECT * FROM cuentas_pendientes_abonos WHERE cuenta_pendiente_id = ? ORDER BY fecha, id')
    .all(fila.id);
  res.json({ ...mapCuentaPendiente(fila), abonos });
});

const abonarSchema = z.object({
  fecha: z.string().min(1),
  monto: z.number().positive(),
  cuentaContrapartidaId: z.number().int(),
  observaciones: z.string().optional().nullable(),
});

// Registra un abono (cobro de una CxC o pago de una CxP): crea el asiento contable
// de contrapartida (Banco/Caja) automáticamente y reduce el saldo pendiente.
cuentasPendientesRouter.post('/:id/abonar', requireAccesoRecurso('cuentas_pendientes'), (req, res) => {
  const parsed = abonarSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten() });
  }
  const d = parsed.data;
  const id = Number(req.params.id);

  const cuentaPendiente = db.prepare('SELECT * FROM cuentas_pendientes WHERE id = ?').get(id) as any;
  if (!cuentaPendiente) return res.status(404).json({ error: 'No encontrado' });
  if (cuentaPendiente.estado === 'pagado' || cuentaPendiente.estado === 'anulado') {
    return res.status(409).json({ error: 'Esta cuenta ya está saldada o anulada' });
  }
  if (d.monto > cuentaPendiente.saldo_pendiente + 0.005) {
    return res.status(400).json({ error: `El monto excede el saldo pendiente (${cuentaPendiente.saldo_pendiente.toFixed(2)})` });
  }

  const lineaOriginal = db
    .prepare('SELECT cuenta_id FROM asiento_lineas WHERE asiento_id = ? AND (tercero_id = ? OR tercero_id IS NULL) LIMIT 1')
    .get(cuentaPendiente.asiento_id, cuentaPendiente.tercero_id) as { cuenta_id: number } | undefined;
  const cuentaSubledgerId = db
    .prepare(
      `SELECT al.cuenta_id FROM asiento_lineas al
       JOIN plan_cuentas pc ON pc.id = al.cuenta_id
       WHERE al.asiento_id = ? AND pc.subledger = ? LIMIT 1`
    )
    .get(cuentaPendiente.asiento_id, cuentaPendiente.tipo) as { cuenta_id: number } | undefined;
  const cuentaId = cuentaSubledgerId?.cuenta_id ?? lineaOriginal?.cuenta_id;
  if (!cuentaId) {
    return res.status(500).json({ error: 'No se pudo determinar la cuenta contable de la subcuenta pendiente' });
  }

  try {
    const resultado = runInTransaction(() => {
      const numero = generarSiguienteNumeroAsiento(cuentaPendiente.empresa_id);
      const descripcion =
        cuentaPendiente.tipo === 'cxc'
          ? `Cobro CxC ref. ${cuentaPendiente.numero_referencia || cuentaPendiente.asiento_id}`
          : `Pago CxP ref. ${cuentaPendiente.numero_referencia || cuentaPendiente.asiento_id}`;

      const info = db
        .prepare(
          `INSERT INTO asientos (empresa_id, numero, fecha, tipo, descripcion, estado, creado_por)
           VALUES (?, ?, ?, 'manual', ?, 'registrado', ?)`
        )
        .run(cuentaPendiente.empresa_id, numero, d.fecha, descripcion, req.user!.id);
      const asientoId = info.lastInsertRowid as number;

      const insertLinea = db.prepare(
        `INSERT INTO asiento_lineas (asiento_id, cuenta_id, tercero_id, descripcion, debe, haber, orden)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      if (cuentaPendiente.tipo === 'cxc') {
        // Cobro: entra dinero (Debe contrapartida) y se reduce la cuenta por cobrar (Haber).
        insertLinea.run(asientoId, d.cuentaContrapartidaId, null, descripcion, d.monto, 0, 0);
        insertLinea.run(asientoId, cuentaId, cuentaPendiente.tercero_id, descripcion, 0, d.monto, 1);
      } else {
        // Pago: se reduce la cuenta por pagar (Debe) y sale dinero (Haber contrapartida).
        insertLinea.run(asientoId, cuentaId, cuentaPendiente.tercero_id, descripcion, d.monto, 0, 0);
        insertLinea.run(asientoId, d.cuentaContrapartidaId, null, descripcion, 0, d.monto, 1);
      }

      db.prepare(
        'INSERT INTO cuentas_pendientes_abonos (cuenta_pendiente_id, asiento_id, fecha, monto, observaciones) VALUES (?, ?, ?, ?, ?)'
      ).run(id, asientoId, d.fecha, d.monto, d.observaciones ?? null);

      const nuevoSaldo = Math.round((cuentaPendiente.saldo_pendiente - d.monto) * 100) / 100;
      const nuevoEstado = nuevoSaldo <= 0.005 ? 'pagado' : 'parcial';
      db.prepare('UPDATE cuentas_pendientes SET saldo_pendiente = ?, estado = ? WHERE id = ?').run(
        Math.max(nuevoSaldo, 0),
        nuevoEstado,
        id
      );

      return { asientoId, saldoPendiente: Math.max(nuevoSaldo, 0), estado: nuevoEstado };
    });

    res.status(201).json(resultado);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error al registrar el abono' });
  }
});
