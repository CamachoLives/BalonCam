import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cancha } from '../models/cancha.model';
import { ConfigNegocio, Reserva } from '../models/reserva.model';

export interface ResumenDia {
  fecha: string;
  reservas: Reserva[];
  resumen: { reservas: number; totalDia: number; recaudado: number; porCobrar: number };
}

const CLAVE_PIN = 'baloncam_admin_pin';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin`;
  readonly pin = signal<string | null>(this.leerPin());

  private leerPin(): string | null {
    try { return sessionStorage.getItem(CLAVE_PIN); } catch { return null; }
  }

  private get headers() {
    return { headers: new HttpHeaders({ 'x-admin-pin': this.pin() ?? '' }) };
  }

  entrar(pin: string): Observable<{ ok: boolean }> {
    return this.http.get<{ ok: boolean }>(`${this.base}/verificar`, { headers: new HttpHeaders({ 'x-admin-pin': pin }) });
  }

  guardarPin(pin: string | null) {
    this.pin.set(pin);
    try { pin ? sessionStorage.setItem(CLAVE_PIN, pin) : sessionStorage.removeItem(CLAVE_PIN); } catch { /* sin almacenamiento */ }
  }

  reservas(fecha: string): Observable<ResumenDia> {
    return this.http.get<ResumenDia>(`${this.base}/reservas`, { ...this.headers, params: { fecha } });
  }

  accionReserva(id: number, accion: 'MARCAR_PAGADA' | 'CANCELAR'): Observable<Reserva> {
    return this.http.patch<Reserva>(`${this.base}/reservas/${id}`, { accion }, this.headers);
  }

  canchas(): Observable<Cancha[]> {
    return this.http.get<Cancha[]>(`${this.base}/canchas`, this.headers);
  }

  guardarCancha(id: number, datos: Partial<Cancha>): Observable<Cancha> {
    return this.http.put<Cancha>(`${this.base}/canchas/${id}`, datos, this.headers);
  }

  config(): Observable<ConfigNegocio> {
    return this.http.get<ConfigNegocio>(`${this.base}/config`, this.headers);
  }

  guardarConfig(datos: Record<string, unknown>): Observable<ConfigNegocio> {
    return this.http.put<ConfigNegocio>(`${this.base}/config`, datos, this.headers);
  }
}
