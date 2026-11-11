export type EstadoSlot = 'DISPONIBLE' | 'BLOQUEADO' | 'OCUPADO' | 'PASADO' | 'NO_DISPONIBLE';
export type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'EXPIRADA';
export type MetodoPago = 'EN_LINEA' | 'NEQUI' | 'EN_CANCHA';
export type EstadoPago = 'PENDIENTE' | 'ANTICIPO' | 'PAGADO';

export interface DisponibilidadSlot {
  canchaId: number;
  canchaNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoSlot;
  motivo?: string | null;
  precioPorHora: number;
}

export interface BloquearSlotRequest {
  canchaId: number;
  fecha: string;
  horaInicio: string;
}

export interface BloqueoResponse {
  token: string;
  expiresAt: string;
  duracionMinutos: number;
  canchaId: number;
  fecha: string;
  horaInicio: string;
  precioPorHora?: number;
}

export interface ConfirmarReservaRequest {
  token: string;
  nombre: string;
  telefono: string;
  email?: string;
  metodoPago: MetodoPago;
}

export interface Reserva {
  id: number;
  token: string;
  canchaId: number;
  canchaNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoReserva;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;
  metodoPago: MetodoPago;
  estadoPago: EstadoPago;
  valorTotal: number;
  valorPagado: number;
  saldoPendiente: number;
  referenciaPago?: string | null;
  createdAt: string;
  negocioWhatsapp?: string;
  nequiNumero?: string;
  nequiTitular?: string;
}

export interface ConfigNegocio {
  negocioNombre: string;
  negocioWhatsapp: string;
  horaInicio: number;
  horaFin: number;
  bloqueoMinutos: number;
  anticipoPorcentaje: number;
  metodosPago: MetodoPago[];
  nequiNumero: string;
  nequiTitular: string;
  pagoModo: string;
  diasAnticipacion: number;
  hoy: string;
}

export const METODOS_PAGO_INFO: Record<MetodoPago, { titulo: string; detalle: string; icono: string }> = {
  EN_LINEA: { titulo: 'Pagar en línea', detalle: 'Tarjeta, PSE o Nequi desde la pasarela de pago.', icono: '💳' },
  NEQUI: { titulo: 'Transferencia Nequi', detalle: 'Transfieres y envías el comprobante por WhatsApp.', icono: '📲' },
  EN_CANCHA: { titulo: 'Pagar en la cancha', detalle: 'Pagas al llegar, en efectivo o transferencia.', icono: '💵' },
};
