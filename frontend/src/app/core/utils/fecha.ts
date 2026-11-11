/** Fecha de hoy (YYYY-MM-DD) en hora de Colombia, sin importar la zona del dispositivo. */
export function hoyColombia(): string {
  const d = new Date(Date.now() - 5 * 3600_000);
  return d.toISOString().slice(0, 10);
}

export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(fecha + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** "20:00" -> "8:00 PM" */
export function formatHora(hora?: string | null): string {
  if (!hora) return '';
  const h = parseInt(hora.split(':')[0], 10);
  if (h === 0 || h === 24) return '12:00 AM';
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return '12:00 PM';
  return `${h - 12}:00 PM`;
}

/** 70000 -> "$70.000" */
export function formatPesos(valor?: number | null): string {
  return '$' + Math.round(valor ?? 0).toLocaleString('es-CO');
}

/** Enlace de WhatsApp con mensaje prellenado. */
export function enlaceWhatsapp(numero: string | undefined, mensaje: string): string {
  const n = (numero || '').replace(/\D/g, '');
  return `https://wa.me/${n}?text=${encodeURIComponent(mensaje)}`;
}
