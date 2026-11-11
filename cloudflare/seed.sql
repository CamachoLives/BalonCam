-- Datos iniciales de demostración (se pueden cambiar desde el panel /admin)
INSERT OR IGNORE INTO config (clave, valor) VALUES
  ('negocio_nombre', 'BalonCam'),
  ('negocio_whatsapp', '573148917721'),
  ('hora_inicio', '7'),
  ('hora_fin', '24'),
  ('bloqueo_minutos', '5'),
  ('anticipo_porcentaje', '50'),
  ('metodos_pago', '["EN_LINEA","NEQUI","EN_CANCHA"]'),
  ('nequi_numero', '3148917721'),
  ('nequi_titular', 'BalonCam'),
  ('pago_modo', 'demo'),
  ('zona_horaria_offset', '-5');

INSERT OR IGNORE INTO canchas (id, nombre, descripcion, tipo, estado, precio_por_hora, posicion_x, posicion_y, cancha_padre_id, orden_visual) VALUES
  (1, 'Cancha Principal', 'Campo completo de fútbol 11. Grass sintético de alta calidad.', 'FUTBOL_11', 'ACTIVA', 180000, 0, 0, NULL, 0),
  (2, 'Cancha A', 'Fútbol 5 - Sector Izquierdo', 'FUTBOL_5', 'ACTIVA', 70000, 1, 0, 1, 1),
  (3, 'Cancha B', 'Fútbol 5 - Sector Central', 'FUTBOL_5', 'ACTIVA', 70000, 2, 0, 1, 2),
  (4, 'Cancha C', 'Fútbol 5 - Sector Derecho', 'FUTBOL_5', 'ACTIVA', 70000, 3, 0, 1, 3);
