import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  BloquearSlotRequest, BloqueoResponse,
  ConfirmarReservaRequest, Reserva
} from '../models/reserva.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReservaService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  bloquearSlot(req: BloquearSlotRequest): Observable<BloqueoResponse> {
    return this.http.post<BloqueoResponse>(`${this.base}/reservas/bloquear`, req);
  }

  confirmarReserva(req: ConfirmarReservaRequest): Observable<Reserva> {
    return this.http.post<Reserva>(`${this.base}/reservas/confirmar`, req);
  }

  obtenerPorToken(token: string): Observable<Reserva> {
    return this.http.get<Reserva>(`${this.base}/reservas/${token}`);
  }

  cancelar(token: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/reservas/${token}`);
  }
}
