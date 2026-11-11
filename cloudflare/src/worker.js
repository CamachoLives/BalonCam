/**
 * BalonCam API - Cloudflare Worker + D1
 *
 * Mantiene los mismos endpoints que el backend Spring Boot (/api/...),
 * así el frontend Angular funciona igual con cualquiera de los dos.
 *
 * Reglas clave:
 *  - Una cancha "padre" (fútbol 11) y sus "hijas" (fútbol 5) comparten el
 *    mismo espacio: si se reserva la grande, las pequeñas quedan ocupadas en
 *    esa hora, y si se reserva una pequeña, la grande queda ocupada.
 *  - Antes de pedir los datos, el horario se bloquea unos minutos con un token
 *    para que dos personas no reserven lo mismo al tiempo.
 *  - Todo lo del negocio (horario, anticipo, métodos de pago, nombre, Nequi,
 *    WhatsApp) se lee de la tabla config y se cambia desde /admin.
 */

const ESTADOS_ACTIVOS = "('PENDIENTE','CONFIRMADA')";
const CONFIG_PUBLICA = [
  'negocio_nombre', 'negocio_whatsapp', 'hora_inicio', 'hora_fin', 'bloqueo_minutos',
  'anticipo_porcentaje', 'metodos_pago', 'nequi_numero', 'nequi_titular', 'pago_modo',
  'zona_horaria_offset', 'dias_anticipacion',
];
const CONFIG_EDITABLE = CONFIG_PUBLICA;
const METODOS_VALIDOS = ['EN_LINEA', 'NEQUI', 'EN_CANCHA'];

// ---------- utilidades ----------

class HttpError extends Error {
  constructor(status, codigo, mensaje) { super(mensaje); this.status = status; this.codigo = codigo; }
}

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  });

const pad = (n) => String(n).padStart(2, '0');
const horaStr = (h) => `${pad(h % 24)}:00`;
const esFecha = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z'));
const esHora = (s) => typeof s === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(s);
const normHora = (s) => s.slice(0, 5);

function nuevoToken(len) {
  const bytes = new Uint8Array(len / 2);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function leerJson(request) {
  try { return await request.json(); }
  catch { throw new HttpError(400, 'JSON_INVALIDO', 'El cuerpo de la petición no es JSON válido.'); }
}

// ---------- configuración ----------

async function cargarConfig(env) {
  const { results } = await env.DB.prepare('SELECT clave, valor FROM config').all();
  const c = Object.fromEntries(results.map((r) => [r.clave, r.valor]));
  return {
    raw: c,
    nombre: c.negocio_nombre || 'BalonCam',
    whatsapp: c.negocio_whatsapp || '',
    horaInicio: parseInt(c.hora_inicio ?? '7', 10),
    horaFin: parseInt(c.hora_fin ?? '24', 10),
    bloqueoMinutos: parseInt(c.bloqueo_minutos ?? '5', 10),
    anticipo: parseInt(c.anticipo_porcentaje ?? '100', 10),
    metodosPago: (() => { try { return JSON.parse(c.metodos_pago || '[]'); } catch { return ['EN_CANCHA']; } })(),
    nequiNumero: c.nequi_numero || '',
    nequiTitular: c.nequi_titular || '',
    pagoModo: c.pago_modo || 'demo',
    offset: parseInt(c.zona_horaria_offset ?? '-5', 10),
    diasAnticipacion: parseInt(c.dias_anticipacion ?? '30', 10),
  };
}

function configPublica(cfg) {
  return {
    negocioNombre: cfg.nombre,
    negocioWhatsapp: cfg.whatsapp,
    horaInicio: cfg.horaInicio,
    horaFin: cfg.horaFin,
    bloqueoMinutos: cfg.bloqueoMinutos,
    anticipoPorcentaje: cfg.anticipo,
    metodosPago: cfg.metodosPago,
    nequiNumero: cfg.nequiNumero,
    nequiTitular: cfg.nequiTitular,
    pagoModo: cfg.pagoModo,
    diasAnticipacion: cfg.diasAnticipacion,
    hoy: ahoraLocal(cfg).fecha,
  };
}

/** Fecha y hora actuales en la zona del negocio (Colombia = UTC-5, sin horario de verano). */
function ahoraLocal(cfg) {
  const d = new Date(Date.now() + cfg.offset * 3600_000);
  return { fecha: d.toISOString().slice(0, 10), hora: d.getUTCHours(), minuto: d.getUTCMinutes() };
}

function sumarDias(fecha, dias) {
  const d = new Date(fecha + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

// ---------- canchas ----------

async function todasLasCanchas(env) {
  const { results } = await env.DB.prepare('SELECT * FROM canchas ORDER BY orden_visual, id').all();
  return results;
}

function mapCancha(c, porId) {
  const padre = c.cancha_padre_id ? porId.get(c.cancha_padre_id) : null;
  return {
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    tipo: c.tipo,
    estado: c.estado,
    precioPorHora: c.precio_por_hora,
    posicionX: c.posicion_x,
    posicionY: c.posicion_y,
    canchaPadreId: c.cancha_padre_id ?? null,
    canchaPadre: padre ? { id: padre.id, nombre: padre.nombre } : null,
    ordenVisual: c.orden_visual,
  };
}

/** Canchas que comparten espacio físico con la cancha dada: ella misma, su padre y sus hijas. */
function relacionadas(canchaId, canchas) {
  const c = canchas.find((x) => x.id === canchaId);
  if (!c) return [canchaId];
  const ids = new Set([c.id]);
  if (c.cancha_padre_id) ids.add(c.cancha_padre_id);
  for (const h of canchas) if (h.cancha_padre_id === c.id) ids.add(h.id);
  return [...ids].map((n) => parseInt(n, 10));
}

async function disponibilidad(env, cfg, canchas, cancha, fecha) {
  const ids = relacionadas(cancha.id, canchas);
  const lista = ids.join(',');
  const ahoraMs = Date.now();
  const [res, blo] = await env.DB.batch([
    env.DB.prepare(`SELECT cancha_id, hora_inicio FROM reservas WHERE fecha = ? AND cancha_id IN (${lista}) AND estado IN ${ESTADOS_ACTIVOS}`).bind(fecha),
    env.DB.prepare(`SELECT cancha_id, hora_inicio FROM bloqueos WHERE fecha = ? AND cancha_id IN (${lista}) AND expires_at > ?`).bind(fecha, ahoraMs),
  ]);
  const ocupadas = new Map();
  for (const r of res.results) ocupadas.set(r.hora_inicio, r.cancha_id === cancha.id ? 'OCUPADO' : 'OCUPADO_RELACIONADA');
  const bloqueadas = new Set(blo.results.map((b) => b.hora_inicio));

  const ahora = ahoraLocal(cfg);
  const slots = [];
  for (let h = cfg.horaInicio; h < cfg.horaFin; h++) {
    const ini = horaStr(h);
    let estado = 'DISPONIBLE';
    if (cancha.estado !== 'ACTIVA') estado = 'NO_DISPONIBLE';
    else if (ocupadas.has(ini)) estado = 'OCUPADO';
    else if (bloqueadas.has(ini)) estado = 'BLOQUEADO';
    else if (fecha < ahora.fecha || (fecha === ahora.fecha && h <= ahora.hora)) estado = 'PASADO';
    slots.push({
      canchaId: cancha.id,
      canchaNombre: cancha.nombre,
      fecha,
      horaInicio: ini,
      horaFin: horaStr(h + 1),
      estado,
      motivo: ocupadas.get(ini) === 'OCUPADO_RELACIONADA' ? 'Espacio compartido reservado' : null,
      precioPorHora: cancha.precio_por_hora,
    });
  }
  return slots;
}

// ---------- reservas ----------

function mapReserva(r, cfg) {
  return {
    id: r.id,
    token: r.token,
    canchaId: r.cancha_id,
    canchaNombre: r.cancha_nombre,
    fecha: r.fecha,
    horaInicio: r.hora_inicio,
    horaFin: r.hora_fin,
    estado: r.estado,
    clienteNombre: r.cliente_nombre,
    clienteTelefono: r.cliente_telefono,
    clienteEmail: r.cliente_email,
    metodoPago: r.metodo_pago,
    estadoPago: r.estado_pago,
    valorTotal: r.valor_total,
    valorPagado: r.valor_pagado,
    saldoPendiente: Math.max(0, r.valor_total - r.valor_pagado),
    referenciaPago: r.referencia_pago,
    createdAt: r.created_at,
    negocioWhatsapp: cfg?.whatsapp,
    nequiNumero: cfg?.nequiNumero,
    nequiTitular: cfg?.nequiTitular,
  };
}

async function reservaPorToken(env, token) {
  return env.DB.prepare(
    'SELECT r.*, c.nombre AS cancha_nombre FROM reservas r JOIN canchas c ON c.id = r.cancha_id WHERE r.token = ?'
  ).bind(token).first();
}

async function bloquear(env, cfg, body) {
  const canchaId = parseInt(body?.canchaId, 10);
  const fecha = body?.fecha;
  const horaInicio = body?.horaInicio;
  if (!canchaId || !esFecha(fecha) || !esHora(horaInicio)) {
    throw new HttpError(400, 'DATOS_INVALIDOS', 'Faltan la cancha, la fecha o la hora.');
  }
  const hora = normHora(horaInicio);
  const h = parseInt(hora, 10);
  if (hora.slice(3) !== '00' || h < cfg.horaInicio || h >= cfg.horaFin) {
    throw new HttpError(400, 'HORA_INVALIDA', 'Ese horario está fuera del horario de atención.');
  }
  const ahora = ahoraLocal(cfg);
  if (fecha < ahora.fecha || (fecha === ahora.fecha && h <= ahora.hora)) {
    throw new HttpError(409, 'SLOT_NO_DISPONIBLE', 'Ese horario ya pasó. Elige otro.');
  }
  if (fecha > sumarDias(ahora.fecha, cfg.diasAnticipacion)) {
    throw new HttpError(400, 'FECHA_LEJANA', `Solo se puede reservar hasta ${cfg.diasAnticipacion} días antes.`);
  }

  const canchas = await todasLasCanchas(env);
  const cancha = canchas.find((c) => c.id === canchaId);
  if (!cancha) throw new HttpError(404, 'NO_ENCONTRADA', 'Cancha no encontrada.');
  if (cancha.estado !== 'ACTIVA') throw new HttpError(409, 'SLOT_NO_DISPONIBLE', 'Esta cancha no está disponible en este momento.');

  const lista = relacionadas(canchaId, canchas).join(',');
  const token = nuevoToken(32);
  const ahoraMs = Date.now();
  const expira = ahoraMs + cfg.bloqueoMinutos * 60_000;

  // Inserción atómica: solo entra si no hay reserva ni bloqueo vigente en el mismo espacio.
  const [, ins] = await env.DB.batch([
    env.DB.prepare('DELETE FROM bloqueos WHERE expires_at <= ?').bind(ahoraMs),
    env.DB.prepare(`
      INSERT INTO bloqueos (token, cancha_id, fecha, hora_inicio, expires_at)
      SELECT ?, ?, ?, ?, ?
      WHERE NOT EXISTS (SELECT 1 FROM reservas WHERE cancha_id IN (${lista}) AND fecha = ? AND hora_inicio = ? AND estado IN ${ESTADOS_ACTIVOS})
        AND NOT EXISTS (SELECT 1 FROM bloqueos WHERE cancha_id IN (${lista}) AND fecha = ? AND hora_inicio = ? AND expires_at > ?)
    `).bind(token, canchaId, fecha, hora, expira, fecha, hora, fecha, hora, ahoraMs),
  ]);

  if (!ins.meta.changes) {
    const reservada = await env.DB.prepare(
      `SELECT 1 FROM reservas WHERE cancha_id IN (${lista}) AND fecha = ? AND hora_inicio = ? AND estado IN ${ESTADOS_ACTIVOS} LIMIT 1`
    ).bind(fecha, hora).first();
    throw new HttpError(409, 'SLOT_NO_DISPONIBLE', reservada
      ? 'Este horario ya fue reservado. Elige otro.'
      : 'Alguien más está completando esta reserva. Intenta en unos minutos.');
  }

  return {
    token,
    expiresAt: new Date(expira).toISOString(),
    duracionMinutos: cfg.bloqueoMinutos,
    canchaId,
    fecha,
    horaInicio: hora,
    precioPorHora: cancha.precio_por_hora,
  };
}

async function confirmar(env, cfg, body) {
  const token = String(body?.token || '');
  const nombre = String(body?.nombre || '').trim();
  const telefono = String(body?.telefono || '').replace(/[^\d+]/g, '');
  const email = body?.email ? String(body.email).trim() : null;
  const metodoPago = String(body?.metodoPago || 'EN_CANCHA');

  if (!token) throw new HttpError(400, 'DATOS_INVALIDOS', 'Falta el token de la reserva.');
  if (nombre.length < 2 || nombre.length > 150) throw new HttpError(400, 'DATOS_INVALIDOS', 'Escribe tu nombre completo.');
  if (telefono.replace(/\D/g, '').length < 7 || telefono.length > 20) throw new HttpError(400, 'DATOS_INVALIDOS', 'Escribe un teléfono válido.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'DATOS_INVALIDOS', 'El correo no es válido.');
  if (!METODOS_VALIDOS.includes(metodoPago) || !cfg.metodosPago.includes(metodoPago)) {
    throw new HttpError(400, 'METODO_PAGO_INVALIDO', 'Ese medio de pago no está disponible.');
  }

  const bloqueo = await env.DB.prepare('SELECT * FROM bloqueos WHERE token = ?').bind(token).first();
  if (!bloqueo) throw new HttpError(410, 'TOKEN_INVALIDO', 'El tiempo para confirmar expiró. Elige el horario de nuevo.');
  if (bloqueo.expires_at <= Date.now()) {
    await env.DB.prepare('DELETE FROM bloqueos WHERE id = ?').bind(bloqueo.id).run();
    throw new HttpError(410, 'TOKEN_INVALIDO', 'El tiempo para confirmar expiró. Elige el horario de nuevo.');
  }

  const canchas = await todasLasCanchas(env);
  const cancha = canchas.find((c) => c.id === bloqueo.cancha_id);
  const lista = relacionadas(bloqueo.cancha_id, canchas).join(',');
  const total = cancha.precio_por_hora;

  // Pago: en modo demo el pago en línea se simula (no se cobra nada real).
  let estadoPago = 'PENDIENTE';
  let pagado = 0;
  let referencia = null;
  if (metodoPago === 'EN_LINEA') {
    if (cfg.pagoModo !== 'demo') {
      throw new HttpError(400, 'PASARELA_NO_CONFIGURADA', 'El pago en línea aún no está conectado a una pasarela real.');
    }
    pagado = Math.round((total * Math.min(100, Math.max(0, cfg.anticipo))) / 100);
    estadoPago = pagado >= total ? 'PAGADO' : 'ANTICIPO';
    referencia = 'DEMO-' + nuevoToken(8).toUpperCase();
  }

  const reservaToken = nuevoToken(24);
  const horaFin = horaStr(parseInt(bloqueo.hora_inicio, 10) + 1);
  const [ins] = await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO reservas (token, cancha_id, fecha, hora_inicio, hora_fin, estado, cliente_nombre, cliente_telefono, cliente_email,
                            metodo_pago, estado_pago, valor_total, valor_pagado, referencia_pago, confirmada_at)
      SELECT ?, ?, ?, ?, ?, 'CONFIRMADA', ?, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%SZ','now')
      WHERE NOT EXISTS (SELECT 1 FROM reservas WHERE cancha_id IN (${lista}) AND fecha = ? AND hora_inicio = ? AND estado IN ${ESTADOS_ACTIVOS})
    `).bind(reservaToken, bloqueo.cancha_id, bloqueo.fecha, bloqueo.hora_inicio, horaFin, nombre, telefono, email,
      metodoPago, estadoPago, total, pagado, referencia, bloqueo.fecha, bloqueo.hora_inicio),
    env.DB.prepare('DELETE FROM bloqueos WHERE id = ?').bind(bloqueo.id),
  ]);
  if (!ins.meta.changes) {
    throw new HttpError(409, 'SLOT_NO_DISPONIBLE', 'Este horario ya fue reservado mientras completabas el formulario.');
  }
  return mapReserva(await reservaPorToken(env, reservaToken), cfg);
}

// ---------- administración ----------

function exigirAdmin(request, env) {
  const pin = request.headers.get('x-admin-pin') || '';
  if (!env.ADMIN_PIN || pin !== env.ADMIN_PIN) {
    throw new HttpError(401, 'NO_AUTORIZADO', 'PIN de administrador incorrecto.');
  }
}

async function adminReservas(env, cfg, fecha) {
  const { results } = await env.DB.prepare(`
    SELECT r.*, c.nombre AS cancha_nombre FROM reservas r JOIN canchas c ON c.id = r.cancha_id
    WHERE r.fecha = ? ORDER BY r.hora_inicio, c.orden_visual
  `).bind(fecha).all();
  const lista = results.map((r) => mapReserva(r, cfg));
  const activas = lista.filter((r) => r.estado !== 'CANCELADA');
  return {
    fecha,
    reservas: lista,
    resumen: {
      reservas: activas.length,
      totalDia: activas.reduce((s, r) => s + r.valorTotal, 0),
      recaudado: activas.reduce((s, r) => s + r.valorPagado, 0),
      porCobrar: activas.reduce((s, r) => s + r.saldoPendiente, 0),
    },
  };
}

async function adminActualizarReserva(env, cfg, id, body) {
  const r = await env.DB.prepare('SELECT * FROM reservas WHERE id = ?').bind(id).first();
  if (!r) throw new HttpError(404, 'NO_ENCONTRADA', 'Reserva no encontrada.');
  if (body.accion === 'MARCAR_PAGADA') {
    await env.DB.prepare("UPDATE reservas SET estado_pago = 'PAGADO', valor_pagado = valor_total WHERE id = ?").bind(id).run();
  } else if (body.accion === 'CANCELAR') {
    await env.DB.prepare("UPDATE reservas SET estado = 'CANCELADA' WHERE id = ?").bind(id).run();
  } else {
    throw new HttpError(400, 'ACCION_INVALIDA', 'Acción no reconocida.');
  }
  const act = await env.DB.prepare('SELECT r.*, c.nombre AS cancha_nombre FROM reservas r JOIN canchas c ON c.id = r.cancha_id WHERE r.id = ?').bind(id).first();
  return mapReserva(act, cfg);
}

async function adminGuardarConfig(env, body) {
  // Validar el horario con los valores combinados antes de guardar nada.
  const actual = await cargarConfig(env);
  const hi = parseInt(body?.hora_inicio ?? actual.horaInicio, 10);
  const hf = parseInt(body?.hora_fin ?? actual.horaFin, 10);
  if (isNaN(hi) || isNaN(hf) || hi < 0 || hf > 24 || hi >= hf) {
    throw new HttpError(400, 'DATOS_INVALIDOS', 'El horario de apertura debe ser antes del cierre (0 a 24).');
  }
  const ant = body?.anticipo_porcentaje !== undefined ? parseInt(body.anticipo_porcentaje, 10) : actual.anticipo;
  if (isNaN(ant) || ant < 0 || ant > 100) throw new HttpError(400, 'DATOS_INVALIDOS', 'El anticipo debe estar entre 0 y 100%.');
  const stmts = [];
  for (const [clave, valor] of Object.entries(body || {})) {
    if (!CONFIG_EDITABLE.includes(clave)) continue;
    let v = typeof valor === 'string' ? valor : JSON.stringify(valor);
    if (['hora_inicio', 'hora_fin', 'bloqueo_minutos', 'anticipo_porcentaje', 'dias_anticipacion'].includes(clave)) {
      const n = parseInt(v, 10);
      if (isNaN(n) || n < 0) throw new HttpError(400, 'DATOS_INVALIDOS', `Valor inválido para ${clave}.`);
      v = String(n);
    }
    if (clave === 'metodos_pago') {
      const arr = Array.isArray(valor) ? valor : JSON.parse(v);
      if (!arr.length || arr.some((m) => !METODOS_VALIDOS.includes(m))) throw new HttpError(400, 'DATOS_INVALIDOS', 'Métodos de pago inválidos.');
      v = JSON.stringify(arr);
    }
    stmts.push(env.DB.prepare('INSERT INTO config (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor').bind(clave, v));
  }
  if (stmts.length) await env.DB.batch(stmts);
  return configPublica(await cargarConfig(env));
}

async function adminActualizarCancha(env, id, body) {
  const c = await env.DB.prepare('SELECT * FROM canchas WHERE id = ?').bind(id).first();
  if (!c) throw new HttpError(404, 'NO_ENCONTRADA', 'Cancha no encontrada.');
  const nombre = body.nombre !== undefined ? String(body.nombre).trim() : c.nombre;
  const descripcion = body.descripcion !== undefined ? String(body.descripcion).trim() : c.descripcion;
  const precio = body.precioPorHora !== undefined ? parseInt(body.precioPorHora, 10) : c.precio_por_hora;
  const estado = body.estado !== undefined ? String(body.estado) : c.estado;
  if (!nombre || isNaN(precio) || precio < 0 || !['ACTIVA', 'MANTENIMIENTO', 'INACTIVA'].includes(estado)) {
    throw new HttpError(400, 'DATOS_INVALIDOS', 'Revisa el nombre, el precio y el estado.');
  }
  await env.DB.prepare('UPDATE canchas SET nombre = ?, descripcion = ?, precio_por_hora = ?, estado = ? WHERE id = ?')
    .bind(nombre, descripcion, precio, estado, id).run();
  const canchas = await todasLasCanchas(env);
  return mapCancha(canchas.find((x) => x.id === id), new Map(canchas.map((x) => [x.id, x])));
}

// ---------- router de la API ----------

async function api(request, env, url) {
  const p = url.pathname.replace(/\/+$/, '');
  const m = request.method;
  const cfg = await cargarConfig(env);
  let g;

  if (m === 'GET' && p === '/api/config') return json(configPublica(cfg));

  if (m === 'GET' && (p === '/api/canchas' || p === '/api/canchas/principales')) {
    const canchas = await todasLasCanchas(env);
    const porId = new Map(canchas.map((c) => [c.id, c]));
    let lista = canchas.filter((c) => c.estado !== 'INACTIVA');
    if (p.endsWith('principales')) lista = lista.filter((c) => !c.cancha_padre_id);
    return json(lista.map((c) => mapCancha(c, porId)));
  }

  if (m === 'GET' && p === '/api/canchas/disponibilidad') {
    const fecha = url.searchParams.get('fecha');
    if (!esFecha(fecha)) throw new HttpError(400, 'FECHA_INVALIDA', 'Fecha inválida.');
    const canchas = await todasLasCanchas(env);
    const out = {};
    for (const c of canchas.filter((x) => x.estado !== 'INACTIVA')) out[c.id] = await disponibilidad(env, cfg, canchas, c, fecha);
    return json(out);
  }

  if (m === 'GET' && (g = p.match(/^\/api\/canchas\/(\d+)(\/disponibilidad)?$/))) {
    const canchas = await todasLasCanchas(env);
    const c = canchas.find((x) => x.id === parseInt(g[1], 10));
    if (!c) throw new HttpError(404, 'NO_ENCONTRADA', 'Cancha no encontrada.');
    if (!g[2]) return json(mapCancha(c, new Map(canchas.map((x) => [x.id, x]))));
    const fecha = url.searchParams.get('fecha');
    if (!esFecha(fecha)) throw new HttpError(400, 'FECHA_INVALIDA', 'Fecha inválida.');
    return json(await disponibilidad(env, cfg, canchas, c, fecha));
  }

  if (m === 'POST' && p === '/api/reservas/bloquear') return json(await bloquear(env, cfg, await leerJson(request)), 201);
  if (m === 'POST' && p === '/api/reservas/confirmar') return json(await confirmar(env, cfg, await leerJson(request)), 201);

  if ((g = p.match(/^\/api\/reservas\/([a-f0-9]{16,64})$/))) {
    const r = await reservaPorToken(env, g[1]);
    if (!r) throw new HttpError(404, 'NO_ENCONTRADA', 'Reserva no encontrada.');
    if (m === 'GET') return json(mapReserva(r, cfg));
    if (m === 'DELETE') {
      await env.DB.prepare("UPDATE reservas SET estado = 'CANCELADA' WHERE id = ?").bind(r.id).run();
      return new Response(null, { status: 204 });
    }
  }

  if (p.startsWith('/api/admin')) {
    exigirAdmin(request, env);
    if (m === 'GET' && p === '/api/admin/verificar') return json({ ok: true, negocioNombre: cfg.nombre });
    if (m === 'GET' && p === '/api/admin/reservas') {
      const fecha = url.searchParams.get('fecha') || ahoraLocal(cfg).fecha;
      if (!esFecha(fecha)) throw new HttpError(400, 'FECHA_INVALIDA', 'Fecha inválida.');
      return json(await adminReservas(env, cfg, fecha));
    }
    if (m === 'PATCH' && (g = p.match(/^\/api\/admin\/reservas\/(\d+)$/))) {
      return json(await adminActualizarReserva(env, cfg, parseInt(g[1], 10), await leerJson(request)));
    }
    if (m === 'GET' && p === '/api/admin/config') return json(configPublica(cfg));
    if (m === 'PUT' && p === '/api/admin/config') return json(await adminGuardarConfig(env, await leerJson(request)));
    if (m === 'GET' && p === '/api/admin/canchas') {
      const canchas = await todasLasCanchas(env);
      const porId = new Map(canchas.map((c) => [c.id, c]));
      return json(canchas.map((c) => mapCancha(c, porId)));
    }
    if (m === 'PUT' && (g = p.match(/^\/api\/admin\/canchas\/(\d+)$/))) {
      return json(await adminActualizarCancha(env, parseInt(g[1], 10), await leerJson(request)));
    }
  }

  throw new HttpError(404, 'NO_ENCONTRADO', 'Ruta no encontrada.');
}

// ---------- archivos del sitio (Angular) ----------

const TIPOS = {
  js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', html: 'text/html; charset=utf-8',
  json: 'application/json', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', ico: 'image/x-icon',
  webp: 'image/webp', woff2: 'font/woff2', txt: 'text/plain; charset=utf-8',
};

/**
 * Sirve el frontend desde una URL pública fija (por ejemplo una carpeta del repositorio en GitHub
 * apuntando a un commit). Solo se usa cuando no hay binding ASSETS (despliegue por API).
 */
async function assetRemoto(env, request, url) {
  let path = url.pathname;
  if (path === '/' || !path) path = '/index.html';
  const conExtension = /\.[a-z0-9]+$/i.test(path);
  if (!conExtension) path = '/index.html'; // rutas de Angular (/reservar, /admin...)
  if (path.includes('..')) return new Response('No encontrado', { status: 404 });

  const cache = caches.default;
  const claveCache = new Request(new URL(path, url.origin).toString());
  const enCache = await cache.match(claveCache);
  if (enCache) return enCache;

  const origen = await fetch(env.ASSETS_BASE_URL.replace(/\/$/, '') + path, { cf: { cacheTtl: 86400, cacheEverything: true } });
  if (!origen.ok) return new Response('No encontrado', { status: 404 });
  const ext = path.split('.').pop().toLowerCase();
  const resp = new Response(origen.body, {
    headers: {
      'content-type': TIPOS[ext] || 'application/octet-stream',
      'cache-control': path === '/index.html' ? 'public, max-age=60' : 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
    },
  });
  await cache.put(claveCache, resp.clone());
  return resp;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      try {
        return await api(request, env, url);
      } catch (e) {
        if (e instanceof HttpError) return json({ codigo: e.codigo, mensaje: e.message }, e.status);
        console.error(e);
        return json({ codigo: 'ERROR', mensaje: 'Ocurrió un error inesperado. Intenta de nuevo.' }, 500);
      }
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    if (env.ASSETS_BASE_URL) return assetRemoto(env, request, url);
    return new Response('Frontend no configurado', { status: 404 });
  },
};
