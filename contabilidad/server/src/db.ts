import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = process.env.DB_PATH || './data/contabilidad.db';
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

// Migraciones aditivas: agrega columnas nuevas a instalaciones existentes que
// se crearon antes de que estas columnas existieran en schema.sql. CREATE TABLE
// IF NOT EXISTS no modifica una tabla ya creada, así que hace falta ALTER TABLE.
function columnaExiste(tabla: string, columna: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${tabla})`).all() as { name: string }[];
  return cols.some((c) => c.name === columna);
}
function agregarColumnaSiFalta(tabla: string, columna: string, definicion: string) {
  if (!columnaExiste(tabla, columna)) {
    db.exec(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`);
  }
}

agregarColumnaSiFalta('empresas', 'municipio', 'TEXT');
agregarColumnaSiFalta('empresas', 'alicuota_municipal', 'REAL NOT NULL DEFAULT 0');
agregarColumnaSiFalta('asiento_lineas', 'centro_costo_id', 'INTEGER REFERENCES centros_costo(id)');
agregarColumnaSiFalta('asiento_lineas', 'tercero_id', 'INTEGER REFERENCES terceros(id)');
agregarColumnaSiFalta('asiento_lineas', 'fecha_vencimiento', 'TEXT');
agregarColumnaSiFalta('asiento_lineas', 'moneda', "TEXT NOT NULL DEFAULT 'VES'");
agregarColumnaSiFalta('asiento_lineas', 'monto_original', 'REAL');
agregarColumnaSiFalta('asiento_lineas', 'tasa_cambio', 'REAL');
agregarColumnaSiFalta('plan_cuentas', 'subledger', 'TEXT');
agregarColumnaSiFalta('libro_ventas', 'iva_retenido', 'REAL NOT NULL DEFAULT 0');
agregarColumnaSiFalta('empresas', 'valor_ut', 'REAL NOT NULL DEFAULT 0');
agregarColumnaSiFalta('empresas', 'logo_data_url', 'TEXT');
agregarColumnaSiFalta('empresas', 'color', "TEXT NOT NULL DEFAULT '#0f766e'");
agregarColumnaSiFalta('usuarios', 'cedula', 'TEXT');
agregarColumnaSiFalta('usuarios', 'cargo', 'TEXT');
agregarColumnaSiFalta('usuarios', 'foto_data_url', 'TEXT');
agregarColumnaSiFalta('usuarios', 'empresa_principal_id', 'INTEGER REFERENCES empresas(id)');
agregarColumnaSiFalta('empresas', 'razon_social', 'TEXT');

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
