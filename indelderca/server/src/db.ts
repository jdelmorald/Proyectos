import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = process.env.DB_PATH || './data/indelderca.db';
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Usa el módulo SQLite incorporado en Node.js (node:sqlite) en vez de un paquete
// nativo externo, para que la instalación no dependa de compilar nada (evita
// requerir Visual Studio Build Tools u otras herramientas de compilación en Windows).
export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// La fila única de configuración de empresa (id=1) se crea si no existe.
const empresaExiste = db.prepare('SELECT id FROM empresa WHERE id = 1').get();
if (!empresaExiste) {
  db.prepare(
    `INSERT INTO empresa (id, nombre, moneda, iva_porcentaje_default) VALUES (1, 'Indelderca', 'Bs.', 16)`
  ).run();
}

// Contador de anidamiento para permitir llamar runInTransaction dentro de otra
// transacción ya abierta (SQLite no soporta BEGIN anidado, pero sí SAVEPOINT).
let transactionDepth = 0;

/** Ejecuta `fn` dentro de una transacción SQL. Soporta llamadas anidadas mediante SAVEPOINT. */
export function runInTransaction<T>(fn: () => T): T {
  transactionDepth += 1;
  const esRaiz = transactionDepth === 1;
  const savepoint = `sp_${transactionDepth}`;

  db.exec(esRaiz ? 'BEGIN IMMEDIATE' : `SAVEPOINT ${savepoint}`);
  try {
    const result = fn();
    db.exec(esRaiz ? 'COMMIT' : `RELEASE ${savepoint}`);
    return result;
  } catch (err) {
    if (esRaiz) {
      db.exec('ROLLBACK');
    } else {
      db.exec(`ROLLBACK TO ${savepoint}`);
      db.exec(`RELEASE ${savepoint}`);
    }
    throw err;
  } finally {
    transactionDepth -= 1;
  }
}
