import { Router } from 'express';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';
import { requireAccesoEmpresaQuery, requireAccesoRecurso } from '../middleware/accesoEmpresa';

export const reportesRouter = Router();
reportesRouter.use(requireAuth, requireAccesoEmpresaQuery);

function saldoCuenta(naturaleza: 'deudora' | 'acreedora', debe: number, haber: number): number {
  return naturaleza === 'deudora' ? debe - haber : haber - debe;
}

// Libro Mayor: movimientos de una cuenta específica con saldo acumulado
reportesRouter.get('/libro-mayor/:cuentaId', requireAccesoRecurso('plan_cuentas', { nombreParam: 'cuentaId' }), (req, res) => {
  const cuentaId = Number(req.params.cuentaId);
  const desde = req.query.desde as string | undefined;
  const hasta = req.query.hasta as string | undefined;

  const cuenta = db.prepare('SELECT * FROM plan_cuentas WHERE id = ?').get(cuentaId) as any;
  if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' });

  let sql = `
    SELECT al.*, a.numero, a.fecha, a.descripcion AS asiento_descripcion, a.estado
    FROM asiento_lineas al
    JOIN asientos a ON a.id = al.asiento_id
    WHERE al.cuenta_id = ? AND a.estado = 'registrado'
  `;
  const params: (string | number)[] = [cuentaId];
  if (desde) { sql += ' AND a.fecha >= ?'; params.push(desde); }
  if (hasta) { sql += ' AND a.fecha <= ?'; params.push(hasta); }
  sql += ' ORDER BY a.fecha, a.id, al.orden';

  const movimientos = db.prepare(sql).all(...params) as any[];
  let saldo = 0;
  const detalle = movimientos.map((m) => {
    saldo += saldoCuenta(cuenta.naturaleza, m.debe, m.haber);
    return {
      asientoId: m.asiento_id,
      numero: m.numero,
      fecha: m.fecha,
      descripcion: m.descripcion || m.asiento_descripcion,
      debe: m.debe,
      haber: m.haber,
      saldo,
    };
  });

  res.json({
    cuenta: { id: cuenta.id, codigo: cuenta.codigo, nombre: cuenta.nombre, naturaleza: cuenta.naturaleza },
    movimientos: detalle,
    saldoFinal: saldo,
  });
});

// Balance de Comprobación: todas las cuentas con movimiento en el rango
reportesRouter.get('/balance-comprobacion', (req, res) => {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return res.status(400).json({ error: 'Debe indicar empresaId' });
  const desde = req.query.desde as string | undefined;
  const hasta = req.query.hasta as string | undefined;

  let sql = `
    SELECT pc.id, pc.codigo, pc.nombre, pc.tipo, pc.naturaleza,
      COALESCE(SUM(al.debe), 0) AS total_debe,
      COALESCE(SUM(al.haber), 0) AS total_haber
    FROM plan_cuentas pc
    LEFT JOIN asiento_lineas al ON al.cuenta_id = pc.id
    LEFT JOIN asientos a ON a.id = al.asiento_id
  `;
  const conditions = ['pc.empresa_id = ?', 'pc.permite_movimiento = 1', "(a.estado = 'registrado' OR a.id IS NULL)"];
  const params: (string | number)[] = [empresaId];
  if (desde) { conditions.push('(a.fecha IS NULL OR a.fecha >= ?)'); params.push(desde); }
  if (hasta) { conditions.push('(a.fecha IS NULL OR a.fecha <= ?)'); params.push(hasta); }
  sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' GROUP BY pc.id ORDER BY pc.codigo';

  const filas = db.prepare(sql).all(...params) as any[];
  const cuentas = filas
    .filter((f) => f.total_debe > 0 || f.total_haber > 0)
    .map((f) => {
      // El Balance de Comprobación muestra el saldo neto Debe-Haber tal cual,
      // independientemente de si es la naturaleza "normal" de la cuenta.
      const diferencia = f.total_debe - f.total_haber;
      return {
        id: f.id,
        codigo: f.codigo,
        nombre: f.nombre,
        tipo: f.tipo,
        naturaleza: f.naturaleza,
        totalDebe: f.total_debe,
        totalHaber: f.total_haber,
        saldoDeudor: diferencia > 0 ? diferencia : 0,
        saldoAcreedor: diferencia < 0 ? -diferencia : 0,
      };
    });

  const totales = cuentas.reduce(
    (acc, c) => ({
      totalDebe: acc.totalDebe + c.totalDebe,
      totalHaber: acc.totalHaber + c.totalHaber,
      saldoDeudor: acc.saldoDeudor + c.saldoDeudor,
      saldoAcreedor: acc.saldoAcreedor + c.saldoAcreedor,
    }),
    { totalDebe: 0, totalHaber: 0, saldoDeudor: 0, saldoAcreedor: 0 }
  );

  res.json({ cuentas, totales });
});

function saldosPorTipo(empresaId: number, hasta: string | undefined, desde: string | undefined, tipos: string[]) {
  let sql = `
    SELECT pc.id, pc.codigo, pc.nombre, pc.tipo, pc.naturaleza,
      COALESCE(SUM(al.debe), 0) AS total_debe,
      COALESCE(SUM(al.haber), 0) AS total_haber
    FROM plan_cuentas pc
    LEFT JOIN asiento_lineas al ON al.cuenta_id = pc.id
    LEFT JOIN asientos a ON a.id = al.asiento_id
  `;
  const placeholders = tipos.map(() => '?').join(',');
  const conditions = [
    'pc.empresa_id = ?', 'pc.permite_movimiento = 1', `pc.tipo IN (${placeholders})`,
    "(a.estado = 'registrado' OR a.id IS NULL)",
  ];
  const params: (string | number)[] = [empresaId, ...tipos];
  if (desde) { conditions.push('(a.fecha IS NULL OR a.fecha >= ?)'); params.push(desde); }
  if (hasta) { conditions.push('(a.fecha IS NULL OR a.fecha <= ?)'); params.push(hasta); }
  sql += ' WHERE ' + conditions.join(' AND ') + ' GROUP BY pc.id ORDER BY pc.codigo';

  const filas = db.prepare(sql).all(...params) as any[];
  return filas
    .filter((f) => f.total_debe > 0 || f.total_haber > 0)
    .map((f) => ({
      id: f.id,
      codigo: f.codigo,
      nombre: f.nombre,
      tipo: f.tipo,
      saldo: saldoCuenta(f.naturaleza, f.total_debe, f.total_haber),
    }));
}

// Estado de Resultados: ingresos - costos - gastos, para un período
reportesRouter.get('/estado-resultados', (req, res) => {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return res.status(400).json({ error: 'Debe indicar empresaId' });
  const desde = req.query.desde as string | undefined;
  const hasta = req.query.hasta as string | undefined;

  const ingresos = saldosPorTipo(empresaId, hasta, desde, ['ingreso']);
  const costos = saldosPorTipo(empresaId, hasta, desde, ['costo']);
  const gastos = saldosPorTipo(empresaId, hasta, desde, ['gasto']);

  const totalIngresos = ingresos.reduce((s, c) => s + c.saldo, 0);
  const totalCostos = costos.reduce((s, c) => s + c.saldo, 0);
  const totalGastos = gastos.reduce((s, c) => s + c.saldo, 0);
  const utilidadBruta = totalIngresos - totalCostos;
  const utilidadNeta = utilidadBruta - totalGastos;

  res.json({ ingresos, costos, gastos, totalIngresos, totalCostos, totalGastos, utilidadBruta, utilidadNeta });
});

// Balance General: activo = pasivo + patrimonio (+ utilidad del ejercicio acumulada a patrimonio)
reportesRouter.get('/balance-general', (req, res) => {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return res.status(400).json({ error: 'Debe indicar empresaId' });
  const hasta = req.query.hasta as string | undefined;

  const activos = saldosPorTipo(empresaId, hasta, undefined, ['activo']);
  const pasivos = saldosPorTipo(empresaId, hasta, undefined, ['pasivo']);
  const patrimonio = saldosPorTipo(empresaId, hasta, undefined, ['patrimonio']);
  const ingresos = saldosPorTipo(empresaId, hasta, undefined, ['ingreso']);
  const costos = saldosPorTipo(empresaId, hasta, undefined, ['costo']);
  const gastos = saldosPorTipo(empresaId, hasta, undefined, ['gasto']);

  const totalActivo = activos.reduce((s, c) => s + c.saldo, 0);
  const totalPasivo = pasivos.reduce((s, c) => s + c.saldo, 0);
  const totalPatrimonioCuentas = patrimonio.reduce((s, c) => s + c.saldo, 0);
  const utilidadEjercicio =
    ingresos.reduce((s, c) => s + c.saldo, 0) - costos.reduce((s, c) => s + c.saldo, 0) - gastos.reduce((s, c) => s + c.saldo, 0);
  const totalPatrimonio = totalPatrimonioCuentas + utilidadEjercicio;

  res.json({
    activos,
    pasivos,
    patrimonio,
    totalActivo,
    totalPasivo,
    totalPatrimonioCuentas,
    utilidadEjercicio,
    totalPatrimonio,
    totalPasivoMasPatrimonio: totalPasivo + totalPatrimonio,
    cuadra: Math.round(totalActivo * 100) === Math.round((totalPasivo + totalPatrimonio) * 100),
  });
});

// Flujo de Efectivo histórico: movimientos de cuentas marcadas como efectivo,
// clasificados según la actividad (operación/inversión/financiamiento) de la contrapartida.
reportesRouter.get('/flujo-efectivo', (req, res) => {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return res.status(400).json({ error: 'Debe indicar empresaId' });
  const desde = req.query.desde as string | undefined;
  const hasta = req.query.hasta as string | undefined;

  let sql = `
    SELECT al.asiento_id, al.debe, al.haber, pc.naturaleza
    FROM asiento_lineas al
    JOIN plan_cuentas pc ON pc.id = al.cuenta_id
    JOIN asientos a ON a.id = al.asiento_id
    WHERE pc.empresa_id = ? AND pc.es_efectivo = 1 AND a.estado = 'registrado'
  `;
  const params: (string | number)[] = [empresaId];
  if (desde) { sql += ' AND a.fecha >= ?'; params.push(desde); }
  if (hasta) { sql += ' AND a.fecha <= ?'; params.push(hasta); }

  const movimientosEfectivo = db.prepare(sql).all(...params) as any[];

  const contraStmt = db.prepare(`
    SELECT pc.actividad_flujo, COUNT(*) as n
    FROM asiento_lineas al
    JOIN plan_cuentas pc ON pc.id = al.cuenta_id
    WHERE al.asiento_id = ? AND pc.es_efectivo = 0
    GROUP BY pc.actividad_flujo
    ORDER BY n DESC
    LIMIT 1
  `);

  const totales = { operacion: 0, inversion: 0, financiamiento: 0, sinClasificar: 0 };
  for (const m of movimientosEfectivo) {
    const monto = saldoCuenta(m.naturaleza, m.debe, m.haber);
    const contra = contraStmt.get(m.asiento_id) as { actividad_flujo: string | null } | undefined;
    const actividad = contra?.actividad_flujo;
    if (actividad === 'operacion') totales.operacion += monto;
    else if (actividad === 'inversion') totales.inversion += monto;
    else if (actividad === 'financiamiento') totales.financiamiento += monto;
    else totales.sinClasificar += monto;
  }

  const flujoNeto = totales.operacion + totales.inversion + totales.financiamiento + totales.sinClasificar;

  res.json({ ...totales, flujoNeto });
});

// Resumen para el Dashboard Financiero: totales, serie mensual y desglose de gastos
reportesRouter.get('/dashboard', (req, res) => {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return res.status(400).json({ error: 'Debe indicar empresaId' });

  const anioActual = new Date().getFullYear();
  const desdeAnio = `${anioActual}-01-01`;

  const activos = saldosPorTipo(empresaId, undefined, undefined, ['activo']);
  const pasivos = saldosPorTipo(empresaId, undefined, undefined, ['pasivo']);
  const patrimonioCuentas = saldosPorTipo(empresaId, undefined, undefined, ['patrimonio']);
  const ingresosAcum = saldosPorTipo(empresaId, undefined, desdeAnio, ['ingreso']);
  const costosAcum = saldosPorTipo(empresaId, undefined, desdeAnio, ['costo']);
  const gastosAcum = saldosPorTipo(empresaId, undefined, desdeAnio, ['gasto']);

  const totalActivo = activos.reduce((s, c) => s + c.saldo, 0);
  const totalPasivo = pasivos.reduce((s, c) => s + c.saldo, 0);
  const totalIngresos = ingresosAcum.reduce((s, c) => s + c.saldo, 0);
  const totalCostos = costosAcum.reduce((s, c) => s + c.saldo, 0);
  const totalGastos = gastosAcum.reduce((s, c) => s + c.saldo, 0);
  const utilidadNeta = totalIngresos - totalCostos - totalGastos;
  const totalPatrimonio = patrimonioCuentas.reduce((s, c) => s + c.saldo, 0) + utilidadNeta;

  // Serie mensual del año en curso: ingresos, costos y gastos por mes
  const serieRaw = db
    .prepare(
      `SELECT strftime('%Y-%m', a.fecha) AS mes, pc.tipo, pc.naturaleza,
        COALESCE(SUM(al.debe), 0) AS total_debe, COALESCE(SUM(al.haber), 0) AS total_haber
       FROM asiento_lineas al
       JOIN plan_cuentas pc ON pc.id = al.cuenta_id
       JOIN asientos a ON a.id = al.asiento_id
       WHERE pc.empresa_id = ? AND a.estado = 'registrado' AND pc.tipo IN ('ingreso','costo','gasto') AND a.fecha >= ?
       GROUP BY mes, pc.tipo`
    )
    .all(empresaId, desdeAnio) as { mes: string; tipo: string; naturaleza: 'deudora' | 'acreedora'; total_debe: number; total_haber: number }[];

  const mesesMap = new Map<string, { mes: string; ingresos: number; costos: number; gastos: number }>();
  for (let m = 1; m <= new Date().getMonth() + 1; m++) {
    const key = `${anioActual}-${String(m).padStart(2, '0')}`;
    mesesMap.set(key, { mes: key, ingresos: 0, costos: 0, gastos: 0 });
  }
  for (const f of serieRaw) {
    if (!mesesMap.has(f.mes)) mesesMap.set(f.mes, { mes: f.mes, ingresos: 0, costos: 0, gastos: 0 });
    const entry = mesesMap.get(f.mes)!;
    const monto = saldoCuenta(f.naturaleza, f.total_debe, f.total_haber);
    if (f.tipo === 'ingreso') entry.ingresos += monto;
    else if (f.tipo === 'costo') entry.costos += monto;
    else if (f.tipo === 'gasto') entry.gastos += monto;
  }
  const serieMensual = [...mesesMap.values()]
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .map((e) => ({ ...e, utilidad: e.ingresos - e.costos - e.gastos }));

  // Desglose de gastos (para gráfico de dona) — top 6 cuentas + "Otros"
  const gastosOrdenados = [...gastosAcum].filter((g) => g.saldo > 0).sort((a, b) => b.saldo - a.saldo);
  const top = gastosOrdenados.slice(0, 6);
  const restoSuma = gastosOrdenados.slice(6).reduce((s, c) => s + c.saldo, 0);
  const gastosPorCuenta = restoSuma > 0 ? [...top, { id: -1, codigo: '', nombre: 'Otros', tipo: 'gasto', saldo: restoSuma }] : top;

  const asientosRecientes = db
    .prepare(
      `SELECT a.id, a.numero, a.fecha, a.descripcion,
        (SELECT COALESCE(SUM(debe),0) FROM asiento_lineas WHERE asiento_id = a.id) AS monto
       FROM asientos a WHERE a.empresa_id = ? AND a.estado = 'registrado' ORDER BY a.fecha DESC, a.id DESC LIMIT 6`
    )
    .all(empresaId);

  res.json({
    totalActivo,
    totalPasivo,
    totalPatrimonio,
    utilidadNeta,
    totalIngresos,
    totalGastos: totalGastos + totalCostos,
    serieMensual,
    gastosPorCuenta,
    asientosRecientes,
  });
});
