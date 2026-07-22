import { db } from '../db';

export interface CuentaDef {
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

export const PLAN_CUENTAS_DEFAULT: CuentaDef[] = [
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

export function insertarPlanCuentasDefault(empresaId: number, defs: CuentaDef[] = PLAN_CUENTAS_DEFAULT, padreId: number | null = null, nivel = 1) {
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
      insertarPlanCuentasDefault(empresaId, def.hijos, info.lastInsertRowid as number, nivel + 1);
    }
  }
}
