import { Router } from 'express';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';
import { requireAccesoEmpresaQuery, requireAccesoRecurso } from '../middleware/accesoEmpresa';

export const reportesRouter = Router();
reportesRouter.use(requireAuth, requireAccesoEmpresaQuery);

function saldoCuenta(naturaleza: 'deudora' | 'acreedora', debe: number, haber: number): number {
  return naturaleza === 'deudora' ? debe - haber : haber - debe;
}

// Libro Diario: registro cronológico de TODOS los asientos con el detalle real
// de partida doble (código de cuenta + Debe/Haber por línea), tal como exige
// un libro diario formal — no una lista de vouchers con un solo monto total.
// Incluye los asientos anulados (nunca se reutiliza ni se borra un correlativo)
// para que el libro no tenga huecos de numeración sin explicación.
reportesRouter.get('/libro-diario', (req, res) => {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return res.status(400).json({ error: 'Debe indicar empresaId' });
  const desde = req.query.desde as string | undefined;
  const hasta = req.query.hasta as string | undefined;

  let sql = `
    SELECT a.id AS asiento_id, a.numero, a.fecha, a.descripcion AS glosa, a.estado,
      al.orden, al.debe, al.haber, al.descripcion AS linea_descripcion,
      pc.codigo AS cuenta_codigo, pc.nombre AS cuenta_nombre
    FROM asiento_lineas al
    JOIN asientos a ON a.id = al.asiento_id
    JOIN plan_cuentas pc ON pc.id = al.cuenta_id
    WHERE a.empresa_id = ?
  `;
  const params: (string | number)[] = [empresaId];
  if (desde) { sql += ' AND a.fecha >= ?'; params.push(desde); }
  if (hasta) { sql += ' AND a.fecha <= ?'; params.push(hasta); }
  sql += ' ORDER BY a.fecha ASC, a.id ASC, al.orden ASC';

  const filas = db.prepare(sql).all(...params) as any[];

  let totalDebe = 0;
  let totalHaber = 0;
  const asientosVistos = new Set<number>();
  const lineas = filas.map((f) => {
    totalDebe += f.debe;
    totalHaber += f.haber;
    const esPrimeraLinea = !asientosVistos.has(f.asiento_id);
    asientosVistos.add(f.asiento_id);
    return {
      asientoId: f.asiento_id,
      numero: f.numero,
      fecha: f.fecha,
      estado: f.estado,
      glosa: f.glosa,
      cuentaCodigo: f.cuenta_codigo,
      cuentaNombre: f.cuenta_nombre,
      descripcionLinea: f.linea_descripcion,
      debe: f.debe,
      haber: f.haber,
      esPrimeraLinea,
    };
  });

  res.json({ lineas, totalDebe, totalHaber, totalAsientos: asientosVistos.size });
});

// Libro Mayor: movimientos de una cuenta específica con saldo acumulado
reportesRouter.get('/libro-mayor/:cuentaId', requireAccesoRecurso('plan_cuentas', { nombreParam: 'cuentaId' }), (req, res) => {
  const cuentaId = Number(req.params.cuentaId);
  const desde = req.query.desde as string | undefined;
  const hasta = req.query.hasta as string | undefined;

  const cuenta = db.prepare('SELECT * FROM plan_cuentas WHERE id = ?').get(cuentaId) as any;
  if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' });

  // Si se filtra por "desde", el saldo mostrado en cada movimiento debe partir
  // del saldo acumulado ANTES de esa fecha (saldo inicial arrastrado), no de
  // cero — de lo contrario la columna "Saldo" no representa el saldo real de
  // la cuenta, solo el neto del periodo filtrado.
  let saldoInicial = 0;
  if (desde) {
    const previos = db
      .prepare(
        `SELECT COALESCE(SUM(al.debe), 0) AS total_debe, COALESCE(SUM(al.haber), 0) AS total_haber
         FROM asiento_lineas al JOIN asientos a ON a.id = al.asiento_id
         WHERE al.cuenta_id = ? AND a.estado = 'registrado' AND a.fecha < ?`
      )
      .get(cuentaId, desde) as { total_debe: number; total_haber: number };
    saldoInicial = saldoCuenta(cuenta.naturaleza, previos.total_debe, previos.total_haber);
  }

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
  let saldo = saldoInicial;
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
    saldoInicial,
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

function saldoCuentaHasta(cuentaId: number, naturaleza: 'deudora' | 'acreedora', antesDe: string): number {
  const r = db
    .prepare(
      `SELECT COALESCE(SUM(al.debe), 0) AS d, COALESCE(SUM(al.haber), 0) AS h
       FROM asiento_lineas al JOIN asientos a ON a.id = al.asiento_id
       WHERE al.cuenta_id = ? AND a.estado = 'registrado' AND a.fecha < ?`
    )
    .get(cuentaId, antesDe) as { d: number; h: number };
  return saldoCuenta(naturaleza, r.d, r.h);
}

function movimientoCuentaEntre(cuentaId: number, naturaleza: 'deudora' | 'acreedora', desde: string, hasta: string): number {
  const r = db
    .prepare(
      `SELECT COALESCE(SUM(al.debe), 0) AS d, COALESCE(SUM(al.haber), 0) AS h
       FROM asiento_lineas al JOIN asientos a ON a.id = al.asiento_id
       WHERE al.cuenta_id = ? AND a.estado = 'registrado' AND a.fecha >= ? AND a.fecha <= ?`
    )
    .get(cuentaId, desde, hasta) as { d: number; h: number };
  return saldoCuenta(naturaleza, r.d, r.h);
}

// Estado de Cambios en el Patrimonio Neto: saldo inicial, movimientos del
// periodo y saldo final de cada cuenta de patrimonio, más la utilidad del
// ejercicio (todavía no cerrada a Utilidades Retenidas) como línea aparte —
// exactamente como se presenta en un estado de cambios en el patrimonio real.
reportesRouter.get('/estado-cambios-patrimonio', (req, res) => {
  const empresaId = Number(req.query.empresaId);
  if (!empresaId) return res.status(400).json({ error: 'Debe indicar empresaId' });
  const desde = req.query.desde as string | undefined;
  const hasta = req.query.hasta as string | undefined;
  if (!desde || !hasta) return res.status(400).json({ error: 'Debe indicar desde y hasta' });

  const cuentas = db
    .prepare(`SELECT id, codigo, nombre, naturaleza FROM plan_cuentas WHERE empresa_id = ? AND tipo = 'patrimonio' AND permite_movimiento = 1 ORDER BY codigo`)
    .all(empresaId) as { id: number; codigo: string; nombre: string; naturaleza: 'deudora' | 'acreedora' }[];

  const filas = cuentas.map((c) => {
    const saldoInicial = saldoCuentaHasta(c.id, c.naturaleza, desde);
    const movimientoPeriodo = movimientoCuentaEntre(c.id, c.naturaleza, desde, hasta);
    return { codigo: c.codigo, nombre: c.nombre, saldoInicial, movimientoPeriodo, saldoFinal: saldoInicial + movimientoPeriodo };
  });

  const ingresos = saldosPorTipo(empresaId, hasta, desde, ['ingreso']);
  const costos = saldosPorTipo(empresaId, hasta, desde, ['costo']);
  const gastos = saldosPorTipo(empresaId, hasta, desde, ['gasto']);
  const utilidadEjercicio =
    ingresos.reduce((s, c) => s + c.saldo, 0) - costos.reduce((s, c) => s + c.saldo, 0) - gastos.reduce((s, c) => s + c.saldo, 0);
  filas.push({ codigo: '', nombre: 'Utilidad del ejercicio', saldoInicial: 0, movimientoPeriodo: utilidadEjercicio, saldoFinal: utilidadEjercicio });

  const totales = filas.reduce(
    (acc, f) => ({
      saldoInicial: acc.saldoInicial + f.saldoInicial,
      movimientoPeriodo: acc.movimientoPeriodo + f.movimientoPeriodo,
      saldoFinal: acc.saldoFinal + f.saldoFinal,
    }),
    { saldoInicial: 0, movimientoPeriodo: 0, saldoFinal: 0 }
  );

  res.json({ filas, totales });
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

  // EBITDA (utilidad antes de intereses, impuestos, depreciación y amortización):
  // como el sistema no registra el gasto de impuesto sobre la renta como un
  // asiento contable (el ISLR se calcula aparte en el Módulo Fiscal), la
  // "utilidadNeta" de aquí ya está antes de impuesto — no hace falta sumarlo
  // de vuelta. Sí hay que sumar de vuelta la depreciación/amortización y los
  // gastos financieros, identificados por el nombre de la cuenta de gasto
  // (p.ej. "Depreciación del Ejercicio", "Gastos Financieros").
  const depreciacionYAmortizacion = gastosAcum
    .filter((g) => /deprecia|amortiza/i.test(g.nombre))
    .reduce((s, c) => s + c.saldo, 0);
  const gastosFinancieros = gastosAcum
    .filter((g) => /financier|inter[eé]s/i.test(g.nombre))
    .reduce((s, c) => s + c.saldo, 0);
  const ebitda = utilidadNeta + depreciacionYAmortizacion + gastosFinancieros;

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
    ebitda,
    depreciacionYAmortizacion,
    gastosFinancieros,
    serieMensual,
    gastosPorCuenta,
    asientosRecientes,
  });
});
