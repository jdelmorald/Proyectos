import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db, runInTransaction } from './db';

const email = process.env.SEED_ADMIN_EMAIL || 'admin@contabilidad.com';
const password = process.env.SEED_ADMIN_PASSWORD || 'CambiarClave123!';

const existente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
if (!existente) {
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, 'admin')`).run(
    'Director Financiero',
    email,
    hash
  );
  console.log(`Usuario administrador creado: ${email} / ${password}`);
  console.log('IMPORTANTE: inicie sesión y cambie esta contraseña de inmediato.');
} else {
  console.log(`El usuario administrador ${email} ya existe, no se modificó.`);
}

const EMPRESAS = [
  { nombre: 'Sumivensa', rif: null },
  { nombre: 'Indelderca', rif: null },
  { nombre: 'Salud San Marcos', rif: null },
];

interface CuentaDef {
  codigo: string;
  nombre: string;
  tipo: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto' | 'costo';
  naturaleza: 'deudora' | 'acreedora';
  permiteMovimiento: boolean;
  esEfectivo?: boolean;
  actividadFlujo?: 'operacion' | 'inversion' | 'financiamiento';
  subledger?: 'cxc' | 'cxp';
  hijos?: CuentaDef[];
}

const PLAN_CUENTAS_DEFAULT: CuentaDef[] = [
  {
    codigo: '1', nombre: 'ACTIVO', tipo: 'activo', naturaleza: 'deudora', permiteMovimiento: false,
    hijos: [
      {
        codigo: '1.1', nombre: 'ACTIVO CIRCULANTE', tipo: 'activo', naturaleza: 'deudora', permiteMovimiento: false,
        hijos: [
          { codigo: '1.1.01', nombre: 'Caja', tipo: 'activo', naturaleza: 'deudora', permiteMovimiento: true, esEfectivo: true },
          { codigo: '1.1.02', nombre: 'Bancos', tipo: 'activo', naturaleza: 'deudora', permiteMovimiento: true, esEfectivo: true },
          { codigo: '1.1.03', nombre: 'Cuentas por Cobrar Clientes', tipo: 'activo', naturaleza: 'deudora', permiteMovimiento: true, actividadFlujo: 'operacion', subledger: 'cxc' },
          { codigo: '1.1.04', nombre: 'Inventario / Mercancía', tipo: 'activo', naturaleza: 'deudora', permiteMovimiento: true, actividadFlujo: 'operacion' },
          { codigo: '1.1.05', nombre: 'IVA Crédito Fiscal', tipo: 'activo', naturaleza: 'deudora', permiteMovimiento: true, actividadFlujo: 'operacion' },
          { codigo: '1.1.06', nombre: 'Gastos Pagados por Anticipado', tipo: 'activo', naturaleza: 'deudora', permiteMovimiento: true, actividadFlujo: 'operacion' },
        ],
      },
      {
        codigo: '1.2', nombre: 'ACTIVO FIJO', tipo: 'activo', naturaleza: 'deudora', permiteMovimiento: false,
        hijos: [
          { codigo: '1.2.01', nombre: 'Mobiliario y Equipos', tipo: 'activo', naturaleza: 'deudora', permiteMovimiento: true, actividadFlujo: 'inversion' },
          { codigo: '1.2.02', nombre: 'Equipos de Computación', tipo: 'activo', naturaleza: 'deudora', permiteMovimiento: true, actividadFlujo: 'inversion' },
          { codigo: '1.2.03', nombre: 'Vehículos', tipo: 'activo', naturaleza: 'deudora', permiteMovimiento: true, actividadFlujo: 'inversion' },
          { codigo: '1.2.04', nombre: 'Depreciación Acumulada', tipo: 'activo', naturaleza: 'acreedora', permiteMovimiento: true, actividadFlujo: 'inversion' },
        ],
      },
    ],
  },
  {
    codigo: '2', nombre: 'PASIVO', tipo: 'pasivo', naturaleza: 'acreedora', permiteMovimiento: false,
    hijos: [
      {
        codigo: '2.1', nombre: 'PASIVO CIRCULANTE', tipo: 'pasivo', naturaleza: 'acreedora', permiteMovimiento: false,
        hijos: [
          { codigo: '2.1.01', nombre: 'Cuentas por Pagar Proveedores', tipo: 'pasivo', naturaleza: 'acreedora', permiteMovimiento: true, actividadFlujo: 'operacion', subledger: 'cxp' },
          { codigo: '2.1.02', nombre: 'IVA Débito Fiscal', tipo: 'pasivo', naturaleza: 'acreedora', permiteMovimiento: true, actividadFlujo: 'operacion' },
          { codigo: '2.1.03', nombre: 'Retenciones de IVA por Pagar', tipo: 'pasivo', naturaleza: 'acreedora', permiteMovimiento: true, actividadFlujo: 'operacion' },
          { codigo: '2.1.04', nombre: 'Retenciones de ISLR por Pagar', tipo: 'pasivo', naturaleza: 'acreedora', permiteMovimiento: true, actividadFlujo: 'operacion' },
          { codigo: '2.1.05', nombre: 'Prestaciones Sociales por Pagar', tipo: 'pasivo', naturaleza: 'acreedora', permiteMovimiento: true, actividadFlujo: 'operacion' },
          { codigo: '2.1.06', nombre: 'Impuestos por Pagar', tipo: 'pasivo', naturaleza: 'acreedora', permiteMovimiento: true, actividadFlujo: 'operacion' },
        ],
      },
      {
        codigo: '2.2', nombre: 'PASIVO A LARGO PLAZO', tipo: 'pasivo', naturaleza: 'acreedora', permiteMovimiento: false,
        hijos: [
          { codigo: '2.2.01', nombre: 'Préstamos Bancarios por Pagar', tipo: 'pasivo', naturaleza: 'acreedora', permiteMovimiento: true, actividadFlujo: 'financiamiento' },
        ],
      },
    ],
  },
  {
    codigo: '3', nombre: 'PATRIMONIO', tipo: 'patrimonio', naturaleza: 'acreedora', permiteMovimiento: false,
    hijos: [
      { codigo: '3.1.01', nombre: 'Capital Social', tipo: 'patrimonio', naturaleza: 'acreedora', permiteMovimiento: true, actividadFlujo: 'financiamiento' },
      { codigo: '3.1.02', nombre: 'Utilidades Retenidas', tipo: 'patrimonio', naturaleza: 'acreedora', permiteMovimiento: true, actividadFlujo: 'financiamiento' },
    ],
  },
  {
    codigo: '4', nombre: 'INGRESOS', tipo: 'ingreso', naturaleza: 'acreedora', permiteMovimiento: false,
    hijos: [
      { codigo: '4.1.01', nombre: 'Ventas de Mercancía / Servicios', tipo: 'ingreso', naturaleza: 'acreedora', permiteMovimiento: true, actividadFlujo: 'operacion' },
      { codigo: '4.1.02', nombre: 'Otros Ingresos', tipo: 'ingreso', naturaleza: 'acreedora', permiteMovimiento: true, actividadFlujo: 'operacion' },
    ],
  },
  {
    codigo: '5', nombre: 'COSTOS', tipo: 'costo', naturaleza: 'deudora', permiteMovimiento: false,
    hijos: [
      { codigo: '5.1.01', nombre: 'Costo de Ventas', tipo: 'costo', naturaleza: 'deudora', permiteMovimiento: true, actividadFlujo: 'operacion' },
    ],
  },
  {
    codigo: '6', nombre: 'GASTOS', tipo: 'gasto', naturaleza: 'deudora', permiteMovimiento: false,
    hijos: [
      { codigo: '6.1.01', nombre: 'Gastos de Personal / Nómina', tipo: 'gasto', naturaleza: 'deudora', permiteMovimiento: true, actividadFlujo: 'operacion' },
      { codigo: '6.1.02', nombre: 'Gastos de Alquiler', tipo: 'gasto', naturaleza: 'deudora', permiteMovimiento: true, actividadFlujo: 'operacion' },
      { codigo: '6.1.03', nombre: 'Servicios (Luz, Agua, Internet)', tipo: 'gasto', naturaleza: 'deudora', permiteMovimiento: true, actividadFlujo: 'operacion' },
      { codigo: '6.1.04', nombre: 'Publicidad y Mercadeo', tipo: 'gasto', naturaleza: 'deudora', permiteMovimiento: true, actividadFlujo: 'operacion' },
      { codigo: '6.1.05', nombre: 'Mantenimiento', tipo: 'gasto', naturaleza: 'deudora', permiteMovimiento: true, actividadFlujo: 'operacion' },
      { codigo: '6.1.06', nombre: 'Depreciación del Ejercicio', tipo: 'gasto', naturaleza: 'deudora', permiteMovimiento: true, actividadFlujo: 'operacion' },
      { codigo: '6.1.07', nombre: 'Gastos Financieros', tipo: 'gasto', naturaleza: 'deudora', permiteMovimiento: true, actividadFlujo: 'financiamiento' },
      { codigo: '6.1.08', nombre: 'Otros Gastos', tipo: 'gasto', naturaleza: 'deudora', permiteMovimiento: true, actividadFlujo: 'operacion' },
    ],
  },
];

function insertarCuentas(empresaId: number, defs: CuentaDef[], padreId: number | null, nivel: number) {
  const insert = db.prepare(
    `INSERT INTO plan_cuentas (empresa_id, codigo, nombre, tipo, naturaleza, cuenta_padre_id, nivel, permite_movimiento, es_efectivo, actividad_flujo, subledger)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const def of defs) {
    const info = insert.run(
      empresaId, def.codigo, def.nombre, def.tipo, def.naturaleza, padreId, nivel,
      def.permiteMovimiento ? 1 : 0, def.esEfectivo ? 1 : 0, def.actividadFlujo ?? null, def.subledger ?? null
    );
    if (def.hijos && def.hijos.length > 0) {
      insertarCuentas(empresaId, def.hijos, info.lastInsertRowid as number, nivel + 1);
    }
  }
}

runInTransaction(() => {
  for (const emp of EMPRESAS) {
    let fila = db.prepare('SELECT id FROM empresas WHERE nombre = ?').get(emp.nombre) as { id: number } | undefined;
    let empresaId: number;
    if (!fila) {
      const info = db.prepare('INSERT INTO empresas (nombre, rif, moneda) VALUES (?, ?, ?)').run(emp.nombre, emp.rif, 'Bs.');
      empresaId = info.lastInsertRowid as number;
      console.log(`Empresa creada: ${emp.nombre}`);
    } else {
      empresaId = fila.id;
    }

    const tieneCuentas = db.prepare('SELECT id FROM plan_cuentas WHERE empresa_id = ? LIMIT 1').get(empresaId);
    if (!tieneCuentas) {
      insertarCuentas(empresaId, PLAN_CUENTAS_DEFAULT, null, 1);
      console.log(`Plan de cuentas creado para ${emp.nombre}.`);
    } else {
      console.log(`${emp.nombre} ya tiene un plan de cuentas, no se modificó.`);
    }
  }
});

console.log('Seed completado.');
