-- Datos iniciales - solo inserta si no existen
INSERT INTO canchas (nombre, descripcion, tipo, estado, precio_por_hora, posicion_x, posicion_y, orden_visual)
SELECT 'Cancha Principal', 'Campo completo de fútbol 11. Grass sintético de alta calidad.', 'FUTBOL_11', 'ACTIVA', 180000, 0, 0, 1
WHERE NOT EXISTS (SELECT 1 FROM canchas WHERE nombre = 'Cancha Principal');

-- Subcanchas de fútbol 5
INSERT INTO canchas (nombre, descripcion, tipo, estado, precio_por_hora, posicion_x, posicion_y, cancha_padre_id, orden_visual)
SELECT 'Cancha A', 'Fútbol 5 - Sector Izquierdo', 'FUTBOL_5', 'ACTIVA', 70000, 1, 0,
       (SELECT id FROM canchas WHERE nombre = 'Cancha Principal'), 1
WHERE NOT EXISTS (SELECT 1 FROM canchas WHERE nombre = 'Cancha A');

INSERT INTO canchas (nombre, descripcion, tipo, estado, precio_por_hora, posicion_x, posicion_y, cancha_padre_id, orden_visual)
SELECT 'Cancha B', 'Fútbol 5 - Sector Central', 'FUTBOL_5', 'ACTIVA', 70000, 2, 0,
       (SELECT id FROM canchas WHERE nombre = 'Cancha Principal'), 2
WHERE NOT EXISTS (SELECT 1 FROM canchas WHERE nombre = 'Cancha B');

INSERT INTO canchas (nombre, descripcion, tipo, estado, precio_por_hora, posicion_x, posicion_y, cancha_padre_id, orden_visual)
SELECT 'Cancha C', 'Fútbol 5 - Sector Derecho', 'FUTBOL_5', 'ACTIVA', 70000, 3, 0,
       (SELECT id FROM canchas WHERE nombre = 'Cancha Principal'), 3
WHERE NOT EXISTS (SELECT 1 FROM canchas WHERE nombre = 'Cancha C');
