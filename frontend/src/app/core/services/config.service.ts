import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { ConfigNegocio } from '../models/reserva.model';
import { environment } from '../../../environments/environment';

/** Configuración del negocio (nombre, horario, medios de pago...). Se carga una vez. */
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private http = inject(HttpClient);
  readonly config = signal<ConfigNegocio | null>(null);

  private config$ = this.http.get<ConfigNegocio>(`${environment.apiUrl}/config`).pipe(
    tap((c) => this.config.set(c)),
    shareReplay(1),
  );

  cargar(): Observable<ConfigNegocio> {
    return this.config$;
  }
}
