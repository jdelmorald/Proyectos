-- Esquema de base de datos del módulo de Gestión de Pacientes de Salud San Marcos

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'operador' CHECK (rol IN ('admin', 'operador')),
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS empresa (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  nombre TEXT NOT NULL DEFAULT 'Salud San Marcos',
  razon_social TEXT,
  rif TEXT,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  logo_base64 TEXT,
  moneda TEXT NOT NULL DEFAULT 'Bs.',
  iva_porcentaje_default REAL NOT NULL DEFAULT 16,
  pie_pagina TEXT
);

CREATE TABLE IF NOT EXISTS pacientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero_historia TEXT,
  nombre TEXT NOT NULL,
  cedula TEXT,
  fecha_nacimiento TEXT,
  sexo TEXT CHECK (sexo IN ('Masculino', 'Femenino') OR sexo IS NULL),
  telefono TEXT,
  direccion TEXT,
  tipo_sangre TEXT,
  alergias TEXT,
  contacto_emergencia_nombre TEXT,
  contacto_emergencia_telefono TEXT,
  seguro TEXT,
  observaciones TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS correlativos (
  tipo TEXT PRIMARY KEY,
  prefijo TEXT NOT NULL,
  siguiente_numero INTEGER NOT NULL DEFAULT 1,
  digitos INTEGER NOT NULL DEFAULT 6,
  reinicio_anual INTEGER NOT NULL DEFAULT 1,
  anio_actual INTEGER,
  prefijo_control TEXT DEFAULT '00',
  siguiente_control INTEGER DEFAULT 1,
  digitos_control INTEGER NOT NULL DEFAULT 6
);

CREATE TABLE IF NOT EXISTS documentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,
  numero TEXT NOT NULL,
  numero_control TEXT,
  fecha TEXT NOT NULL,
  contacto_id INTEGER REFERENCES pacientes(id),
  referencia_documento_id INTEGER REFERENCES documentos(id),
  estado TEXT NOT NULL DEFAULT 'emitido' CHECK (estado IN ('borrador', 'emitido', 'anulado')),
  motivo_anulacion TEXT,
  datos_json TEXT NOT NULL DEFAULT '{}',
  items_json TEXT NOT NULL DEFAULT '[]',
  firmantes_json TEXT NOT NULL DEFAULT '[]',
  subtotal REAL NOT NULL DEFAULT 0,
  base_imponible REAL NOT NULL DEFAULT 0,
  monto_exento REAL NOT NULL DEFAULT 0,
  iva_porcentaje REAL NOT NULL DEFAULT 0,
  iva_monto REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  observaciones TEXT,
  creado_por INTEGER REFERENCES usuarios(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (tipo, numero)
);

CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON documentos(tipo);
CREATE INDEX IF NOT EXISTS idx_documentos_contacto ON documentos(contacto_id);
CREATE INDEX IF NOT EXISTS idx_documentos_estado ON documentos(estado);
