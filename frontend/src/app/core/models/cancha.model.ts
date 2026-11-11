export type TipoCancha = 'FUTBOL_11' | 'FUTBOL_10' | 'FUTBOL_8' | 'FUTBOL_5';
export type EstadoCancha = 'ACTIVA' | 'MANTENIMIENTO' | 'INACTIVA';

export interface Cancha {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: TipoCancha;
  estado: EstadoCancha;
  precioPorHora: number;
  posicionX: number;
  posicionY: number;
  canchaPadreId?: number | null;
  canchaPadre?: { id: number; nombre: string } | null;
  ordenVisual: number;
}

export const TIPO_CANCHA_TEXTO: Record<TipoCancha, string> = {
  FUTBOL_11: 'Fútbol 11',
  FUTBOL_10: 'Fútbol 10',
  FUTBOL_8: 'Fútbol 8',
  FUTBOL_5: 'Fútbol 5',
};
