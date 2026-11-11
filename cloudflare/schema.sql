-- BalonCam - esquema D1 (SQLite)
-- Todo lo configurable del negocio vive en la tabla config.

CREATE TABLE IF NOT EXISTS config (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS canchas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('FUTBOL_11','FUTBOL_10','FUTBOL_8','FUTBOL_5')),
  estado TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA','MANTENIMIENTO','INACTIVA')),
  precio_por_hora INTEGER NOT NULL,
  posicion_x INTEGER DEFAULT 0,
  posicion_y INTEGER DEFAULT 0,
  cancha_padre_id INTEGER REFERENCES canchas(id),
  orden_visual INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reservas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  cancha_id INTEGER NOT NULL REFERENCES canchas(id),
  fecha TEXT NOT NULL,            -- YYYY-MM-DD (hora Colombia)
  hora_inicio TEXT NOT NULL,      -- HH:MM
  hora_fin TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'CONFIRMADA' CHECK (estado IN ('PENDIENTE','CONFIRMADA','CANCELADA','EXPIRADA')),
  cliente_nombre TEXT NOT NULL,
  cliente_telefono TEXT NOT NULL,
  cliente_email TEXT,
  metodo_pago TEXT NOT NULL DEFAULT 'EN_CANCHA',
  estado_pago TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado_pago IN ('PENDIENTE','ANTICIPO','PAGADO')),
  valor_total INTEGER NOT NULL DEFAULT 0,
  valor_pagado INTEGER NOT NULL DEFAULT 0,
  referencia_pago TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  confirmada_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_reserva_cancha_fecha ON reservas(cancha_id, fecha, hora_inicio);

CREATE TABLE IF NOT EXISTS bloqueos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  cancha_id INTEGER NOT NULL REFERENCES canchas(id),
  fecha TEXT NOT NULL,
  hora_inicio TEXT NOT NULL,
  expires_at INTEGER NOT NULL      -- epoch ms
);
CREATE INDEX IF NOT EXISTS idx_bloqueo_cancha_fecha ON bloqueos(cancha_id, fecha, hora_inicio);
