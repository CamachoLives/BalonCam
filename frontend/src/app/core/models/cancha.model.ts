export type TipoCancha = 'FUTBOL_11' | 'FUTBOL_10' | 'FUTBOL_5';
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
  canchaPadre?: Cancha;
  ordenVisual: number;
}
