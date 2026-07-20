import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { DOCUMENT_TYPES } from './documentTypes';
import { LOGO_BASE64 } from './logoBase64';

const insertCorrelativo = db.prepare(
  `INSERT OR IGNORE INTO correlativos (tipo, prefijo, siguiente_numero, digitos, reinicio_anual, anio_actual, prefijo_control, siguiente_control, digitos_control)
   VALUES (?, ?, 1, 6, 1, ?, '00', 1, 6)`
);

const anioActual = new Date().getFullYear();
for (const tipo of DOCUMENT_TYPES) {
  insertCorrelativo.run(tipo.key, tipo.prefijo, anioActual);
}
console.log(`Correlativos verificados para ${DOCUMENT_TYPES.length} tipos de documento.`);

const email = process.env.SEED_ADMIN_EMAIL || 'admin@saludsanmarcos.com';
const password = process.env.SEED_ADMIN_PASSWORD || 'CambiarClave123!';

const existente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
if (!existente) {
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, 'admin')`).run(
    'Administrador Salud San Marcos',
    email,
    hash
  );
  console.log(`Usuario administrador creado: ${email} / ${password}`);
  console.log('IMPORTANTE: inicie sesión y cambie esta contraseña de inmediato.');
} else {
  console.log(`El usuario administrador ${email} ya existe, no se modificó.`);
}

db.prepare(
  `UPDATE empresa SET nombre='Salud San Marcos', moneda=COALESCE(NULLIF(moneda,''),'Bs.'), iva_porcentaje_default=COALESCE(iva_porcentaje_default,16), logo_base64=COALESCE(logo_base64, ?) WHERE id=1`
).run(LOGO_BASE64);

console.log('Seed completado.');
