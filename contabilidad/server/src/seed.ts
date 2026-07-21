import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { db, runInTransaction } from './db';
import { insertarPlanCuentasDefault } from './services/planCuentasDefault';

// Logos de marca ya incluidos en el repo (client/src/assets), como data URL para
// que los reportes exportados en PDF/Excel salgan con el logo real desde el
// primer arranque, no solo la pantalla de selección de empresa.
function logoComoDataUrl(archivo: string): string | null {
  try {
    const ruta = path.join(__dirname, '..', '..', 'client', 'src', 'assets', archivo);
    const buffer = fs.readFileSync(ruta);
    const mime = archivo.endsWith('.jpg') || archivo.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

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
  {
    nombre: 'Sumivensa', rif: 'J-508014669', razonSocial: 'Suministros y Servicios Logísticos Venezolanos, S.A.',
    color: '#d6293a', logo: logoComoDataUrl('sumivensa-logo.png'),
  },
  {
    nombre: 'Indelderca', rif: 'J-502893873', razonSocial: "Inversiones Del Moral - D'Errico, C.A.",
    color: '#1a4a8c', logo: logoComoDataUrl('indelderca-logo.png'),
  },
  {
    nombre: 'Salud San Marcos', rif: 'J-504102849', razonSocial: 'Centro Médico San Marcos, C.A.',
    color: '#1fb3b3', logo: logoComoDataUrl('saludsanmarcos-logo.jpg'),
  },
  {
    nombre: 'Uomo Store', rif: 'J-502893873', razonSocial: "Inversiones Del Moral - D'Errico, C.A.",
    color: '#e2833c', logo: logoComoDataUrl('uomo-logo.png'),
  },
];

runInTransaction(() => {
  for (const emp of EMPRESAS) {
    let fila = db.prepare('SELECT id FROM empresas WHERE nombre = ?').get(emp.nombre) as { id: number } | undefined;
    let empresaId: number;
    if (!fila) {
      const info = db
        .prepare('INSERT INTO empresas (nombre, rif, razon_social, moneda, color, logo_data_url) VALUES (?, ?, ?, ?, ?, ?)')
        .run(emp.nombre, emp.rif, emp.razonSocial, 'Bs.', emp.color, emp.logo);
      empresaId = info.lastInsertRowid as number;
      console.log(`Empresa creada: ${emp.nombre}`);
    } else {
      empresaId = fila.id;
      // Empresa ya existente (instalación previa): completa RIF/razón social
      // solo si todavía están vacíos, sin pisar nada que el usuario ya haya
      // configurado a mano desde Configuración → Empresas.
      const actual = db.prepare('SELECT rif, razon_social, color FROM empresas WHERE id = ?').get(empresaId) as
        | { rif: string | null; razon_social: string | null; color: string | null }
        | undefined;
      if (actual && !actual.rif && emp.rif) {
        db.prepare('UPDATE empresas SET rif = ? WHERE id = ?').run(emp.rif, empresaId);
      }
      if (actual && !actual.razon_social && emp.razonSocial) {
        db.prepare('UPDATE empresas SET razon_social = ? WHERE id = ?').run(emp.razonSocial, empresaId);
      }
      // Corrección puntual: Indelderca se cargó originalmente con un azul claro
      // en vez del azul marino de su marca. Solo se corrige si el color sigue
      // siendo ese valor original, para no pisar un color que el usuario ya
      // haya personalizado a mano desde Configuración → Empresas.
      if (emp.nombre === 'Indelderca' && actual?.color === '#3a78c2') {
        db.prepare('UPDATE empresas SET color = ? WHERE id = ?').run(emp.color, empresaId);
      }
    }

    const tieneCuentas = db.prepare('SELECT id FROM plan_cuentas WHERE empresa_id = ? LIMIT 1').get(empresaId);
    if (!tieneCuentas) {
      insertarPlanCuentasDefault(empresaId);
      console.log(`Plan de cuentas creado para ${emp.nombre}.`);
    } else {
      console.log(`${emp.nombre} ya tiene un plan de cuentas, no se modificó.`);
    }
  }

  // Migración a permisos por empresa: si nadie tiene acceso explícito a ninguna
  // empresa todavía (instalación nueva, o instalación existente que se actualiza
  // a esta versión), se le da a todos los usuarios acceso a todas las empresas
  // actuales, para que nadie pierda de golpe algo que ya podía ver. El
  // administrador ajusta accesos puntuales después desde Usuarios.
  const totalPermisos = (db.prepare('SELECT COUNT(*) AS n FROM usuario_empresas').get() as { n: number }).n;
  if (totalPermisos === 0) {
    const usuarios = db.prepare('SELECT id FROM usuarios').all() as { id: number }[];
    const empresas = db.prepare('SELECT id FROM empresas').all() as { id: number }[];
    const otorgar = db.prepare('INSERT OR IGNORE INTO usuario_empresas (usuario_id, empresa_id) VALUES (?, ?)');
    for (const u of usuarios) {
      for (const e of empresas) otorgar.run(u.id, e.id);
    }
    if (usuarios.length > 0 && empresas.length > 0) {
      console.log(`Permisos iniciales: ${usuarios.length} usuario(s) con acceso a las ${empresas.length} empresa(s) existentes.`);
    }
  }
});

console.log('Seed completado.');
