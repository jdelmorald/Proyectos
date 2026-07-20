import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db, runInTransaction } from './db';
import { insertarPlanCuentasDefault } from './services/planCuentasDefault';

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
      insertarPlanCuentasDefault(empresaId);
      console.log(`Plan de cuentas creado para ${emp.nombre}.`);
    } else {
      console.log(`${emp.nombre} ya tiene un plan de cuentas, no se modificó.`);
    }
  }
});

console.log('Seed completado.');
