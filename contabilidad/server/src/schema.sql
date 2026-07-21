-- Esquema del Sistema Contable multiempresa (Sumivensa, Indelderca, Salud San Marcos)

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'operador' CHECK (rol IN ('admin', 'operador')),
  cedula TEXT,
  cargo TEXT,
  foto_data_url TEXT,
  empresa_principal_id INTEGER REFERENCES empresas(id),
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS empresas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  rif TEXT,
  razon_social TEXT,
  moneda TEXT NOT NULL DEFAULT 'Bs.',
  municipio TEXT,
  alicuota_municipal REAL NOT NULL DEFAULT 0,
  valor_ut REAL NOT NULL DEFAULT 0,
  logo_data_url TEXT,
  color TEXT NOT NULL DEFAULT '#0f766e',
  activo INTEGER NOT NULL DEFAULT 1
);

-- Qué empresas puede ver/usar cada usuario. Sin fila aquí, el usuario no tiene
-- acceso a esa empresa (ni a sus asientos, reportes, libros, etc.) aunque esté
-- autenticado. El rol admin/operador sigue rigiendo qué puede HACER; esta tabla
-- rige a cuáles empresas puede hacerlo.
CREATE TABLE IF NOT EXISTS usuario_empresas (
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  empresa_id INTEGER NOT NULL REFERENCES empresas(id),
  PRIMARY KEY (usuario_id, empresa_id)
);

CREATE TABLE IF NOT EXISTS plan_cuentas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id),
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto', 'costo')),
  naturaleza TEXT NOT NULL CHECK (naturaleza IN ('deudora', 'acreedora')),
  cuenta_padre_id INTEGER REFERENCES plan_cuentas(id),
  nivel INTEGER NOT NULL DEFAULT 1,
  permite_movimiento INTEGER NOT NULL DEFAULT 1,
  es_efectivo INTEGER NOT NULL DEFAULT 0,
  actividad_flujo TEXT CHECK (actividad_flujo IN ('operacion', 'inversion', 'financiamiento') OR actividad_flujo IS NULL),
  subledger TEXT CHECK (subledger IN ('cxc', 'cxp') OR subledger IS NULL),
  activo INTEGER NOT NULL DEFAULT 1,
  UNIQUE (empresa_id, codigo)
);

CREATE TABLE IF NOT EXISTS correlativos_contables (
  empresa_id INTEGER NOT NULL REFERENCES empresas(id),
  tipo TEXT NOT NULL DEFAULT 'asiento',
  prefijo TEXT NOT NULL DEFAULT 'AS',
  siguiente_numero INTEGER NOT NULL DEFAULT 1,
  digitos INTEGER NOT NULL DEFAULT 6,
  reinicio_anual INTEGER NOT NULL DEFAULT 1,
  anio_actual INTEGER,
  PRIMARY KEY (empresa_id, tipo)
);

CREATE TABLE IF NOT EXISTS asientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id),
  numero TEXT NOT NULL,
  fecha TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'manual' CHECK (tipo IN ('apertura', 'manual', 'ajuste', 'cierre')),
  descripcion TEXT,
  estado TEXT NOT NULL DEFAULT 'registrado' CHECK (estado IN ('registrado', 'anulado')),
  motivo_anulacion TEXT,
  creado_por INTEGER REFERENCES usuarios(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (empresa_id, numero)
);

CREATE TABLE IF NOT EXISTS asiento_lineas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asiento_id INTEGER NOT NULL REFERENCES asientos(id),
  cuenta_id INTEGER NOT NULL REFERENCES plan_cuentas(id),
  centro_costo_id INTEGER REFERENCES centros_costo(id),
  tercero_id INTEGER REFERENCES terceros(id),
  fecha_vencimiento TEXT,
  descripcion TEXT,
  debe REAL NOT NULL DEFAULT 0,
  haber REAL NOT NULL DEFAULT 0,
  moneda TEXT NOT NULL DEFAULT 'VES' CHECK (moneda IN ('VES', 'USD', 'COP', 'EUR')),
  monto_original REAL,
  tasa_cambio REAL,
  orden INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS centros_costo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id),
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1,
  UNIQUE (empresa_id, codigo)
);

CREATE TABLE IF NOT EXISTS tasas_cambio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  moneda TEXT NOT NULL CHECK (moneda IN ('USD', 'COP', 'EUR')),
  tasa REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (fecha, moneda)
);

CREATE TABLE IF NOT EXISTS terceros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('cliente', 'proveedor')),
  nombre TEXT NOT NULL,
  rif TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cuentas_pendientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('cxc', 'cxp')),
  tercero_id INTEGER NOT NULL REFERENCES terceros(id),
  asiento_id INTEGER NOT NULL REFERENCES asientos(id),
  numero_referencia TEXT,
  fecha_emision TEXT NOT NULL,
  fecha_vencimiento TEXT,
  monto_original REAL NOT NULL,
  saldo_pendiente REAL NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'pagado', 'anulado')),
  observaciones TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cuentas_pendientes_abonos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cuenta_pendiente_id INTEGER NOT NULL REFERENCES cuentas_pendientes(id),
  asiento_id INTEGER REFERENCES asientos(id),
  fecha TEXT NOT NULL,
  monto REAL NOT NULL,
  observaciones TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS retenciones_islr (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id),
  fecha TEXT NOT NULL,
  proveedor_rif TEXT NOT NULL,
  proveedor_nombre TEXT NOT NULL,
  concepto TEXT,
  monto_pagado REAL NOT NULL,
  porcentaje_retencion REAL NOT NULL,
  monto_retenido REAL NOT NULL,
  numero_comprobante TEXT,
  observaciones TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS libro_compras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id),
  fecha TEXT NOT NULL,
  tipo_documento TEXT NOT NULL DEFAULT 'Factura',
  numero_factura TEXT NOT NULL,
  numero_control TEXT,
  proveedor_rif TEXT NOT NULL,
  proveedor_nombre TEXT NOT NULL,
  base_imponible REAL NOT NULL DEFAULT 0,
  exento REAL NOT NULL DEFAULT 0,
  iva_porcentaje REAL NOT NULL DEFAULT 16,
  iva_monto REAL NOT NULL DEFAULT 0,
  iva_retenido REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  observaciones TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS libro_ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id),
  fecha TEXT NOT NULL,
  tipo_documento TEXT NOT NULL DEFAULT 'Factura',
  numero_factura TEXT NOT NULL,
  numero_control TEXT,
  cliente_rif TEXT,
  cliente_nombre TEXT NOT NULL,
  base_imponible REAL NOT NULL DEFAULT 0,
  exento REAL NOT NULL DEFAULT 0,
  iva_porcentaje REAL NOT NULL DEFAULT 16,
  iva_monto REAL NOT NULL DEFAULT 0,
  iva_retenido REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  observaciones TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS igtf_operaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id),
  fecha TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  base_imponible REAL NOT NULL,
  alicuota REAL NOT NULL DEFAULT 3,
  monto REAL NOT NULL,
  asiento_id INTEGER REFERENCES asientos(id),
  observaciones TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS islr_anticipos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id),
  periodo TEXT NOT NULL,
  concepto TEXT NOT NULL,
  fecha TEXT NOT NULL,
  monto REAL NOT NULL,
  observaciones TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS flujo_caja_proyectado (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id),
  periodo TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('ingreso', 'egreso')),
  concepto TEXT NOT NULL,
  monto_proyectado REAL NOT NULL DEFAULT 0,
  observaciones TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_plan_cuentas_empresa ON plan_cuentas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_asientos_empresa ON asientos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_asientos_fecha ON asientos(fecha);
CREATE INDEX IF NOT EXISTS idx_asiento_lineas_asiento ON asiento_lineas(asiento_id);
CREATE INDEX IF NOT EXISTS idx_asiento_lineas_cuenta ON asiento_lineas(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_libro_compras_empresa ON libro_compras(empresa_id);
CREATE INDEX IF NOT EXISTS idx_libro_ventas_empresa ON libro_ventas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_flujo_proyectado_empresa ON flujo_caja_proyectado(empresa_id);
CREATE INDEX IF NOT EXISTS idx_centros_costo_empresa ON centros_costo(empresa_id);
CREATE INDEX IF NOT EXISTS idx_asiento_lineas_centro_costo ON asiento_lineas(centro_costo_id);
CREATE INDEX IF NOT EXISTS idx_tasas_cambio_fecha ON tasas_cambio(fecha);
CREATE INDEX IF NOT EXISTS idx_terceros_empresa ON terceros(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_pendientes_empresa ON cuentas_pendientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_pendientes_tercero ON cuentas_pendientes(tercero_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_pendientes_estado ON cuentas_pendientes(estado);
CREATE INDEX IF NOT EXISTS idx_cuentas_pendientes_abonos_cp ON cuentas_pendientes_abonos(cuenta_pendiente_id);
CREATE INDEX IF NOT EXISTS idx_retenciones_islr_empresa ON retenciones_islr(empresa_id);
CREATE INDEX IF NOT EXISTS idx_igtf_operaciones_empresa ON igtf_operaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_islr_anticipos_empresa ON islr_anticipos(empresa_id);
