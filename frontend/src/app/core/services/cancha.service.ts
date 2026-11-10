import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cancha } from '../models/cancha.model';
import { DisponibilidadSlot } from '../models/reserva.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CanchaService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  listarTodas(): Observable<Cancha[]> {
    return this.http.get<Cancha[]>(`${this.base}/canchas`);
  }

  listarPrincipales(): Observable<Cancha[]> {
    return this.http.get<Cancha[]>(`${this.base}/canchas/principales`);
  }

  obtenerDisponibilidad(canchaId: number, fecha: string): Observable<DisponibilidadSlot[]> {
    return this.http.get<DisponibilidadSlot[]>(`${this.base}/canchas/${canchaId}/disponibilidad`, {
      params: { fecha }
    });
  }

  obtenerDisponibilidadTodas(fecha: string): Observable<Record<number, DisponibilidadSlot[]>> {
    return this.http.get<Record<number, DisponibilidadSlot[]>>(`${this.base}/canchas/disponibilidad`, {
      params: { fecha }
    });
  }
}
