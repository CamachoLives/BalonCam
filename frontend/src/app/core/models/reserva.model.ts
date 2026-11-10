export type EstadoSlot = 'DISPONIBLE' | 'BLOQUEADO' | 'OCUPADO' | 'PASADO';
export type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'EXPIRADA';

export interface DisponibilidadSlot {
  canchaId: number;
  canchaNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoSlot;
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
}

export interface ConfirmarReservaRequest {
  token: string;
  nombre: string;
  telefono: string;
  email?: string;
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
  createdAt: string;
}
