import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { ReservaService } from '../../../core/services/reserva.service';
import { Reserva } from '../../../core/models/reserva.model';

@Component({
  selector: 'app-confirmar-reserva',
  standalone: true,
  imports: [CommonModule, RouterLink],
  animations: [
    trigger('popIn', [
      transition(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('500ms cubic-bezier(0.175, 0.885, 0.32, 1.275)', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center py-12 px-4">
      @if (cargando()) {
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-white/50">Cargando tu reserva...</p>
        </div>
      }

      @if (!cargando() && reserva()) {
        <div class="max-w-md w-full" [@popIn]>
          <!-- Icono de éxito animado -->
          <div class="text-center mb-8">
            <div class="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/20">
              <span class="text-5xl">✅</span>
            </div>
            <h1 class="text-3xl font-black text-white">¡Reserva Confirmada!</h1>
            <p class="text-emerald-400 mt-1">Tu lugar está asegurado. ¡A jugar!</p>
          </div>

          <!-- Ticket de reserva -->
          <div class="card border border-emerald-500/30 relative overflow-hidden">
            <!-- Decoración ticket -->
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-400"></div>

            <div class="space-y-4">
              <!-- Código de reserva -->
              <div class="bg-black/30 rounded-xl p-4 text-center">
                <p class="text-white/50 text-xs uppercase tracking-wider mb-1">Código de Reserva</p>
                <p class="font-mono text-emerald-400 text-xl font-bold tracking-widest">
                  {{ reserva()!.token.toUpperCase() | slice:0:8 }}
                </p>
                <p class="text-white/30 text-xs mt-1">Presenta este código al llegar</p>
              </div>

              <!-- Detalles -->
              <div class="divide-y divide-white/5">
                <div class="flex justify-between py-3">
                  <span class="text-white/50 text-sm">Cancha</span>
                  <span class="text-white font-semibold text-sm">{{ reserva()!.canchaNombre }}</span>
                </div>
                <div class="flex justify-between py-3">
                  <span class="text-white/50 text-sm">Fecha</span>
                  <span class="text-white font-semibold text-sm">
                    {{ reserva()!.fecha | date:'EEEE d MMMM yyyy':'':'es' }}
                  </span>
                </div>
                <div class="flex justify-between py-3">
                  <span class="text-white/50 text-sm">Horario</span>
                  <span class="text-white font-semibold text-sm">
                    {{ formatHora(reserva()!.horaInicio) }} – {{ formatHora(reserva()!.horaFin) }}
                  </span>
                </div>
                <div class="flex justify-between py-3">
                  <span class="text-white/50 text-sm">Nombre</span>
                  <span class="text-white font-semibold text-sm">{{ reserva()!.clienteNombre }}</span>
                </div>
                <div class="flex justify-between py-3">
                  <span class="text-white/50 text-sm">Teléfono</span>
                  <span class="text-white font-semibold text-sm">{{ reserva()!.clienteTelefono }}</span>
                </div>
                <div class="flex justify-between py-3">
                  <span class="text-white/50 text-sm">Estado</span>
                  <span class="text-emerald-400 font-semibold text-sm">✅ Confirmada</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Acciones -->
          <div class="flex gap-3 mt-6">
            <button class="btn-secondary flex-1 text-sm" (click)="copiarToken()">
              {{ copiado() ? '✅ Copiado' : '📋 Copiar código' }}
            </button>
            <a routerLink="/" class="btn-primary flex-1 text-sm text-center">
              Volver al inicio
            </a>
          </div>

          <!-- Info extra -->
          <div class="mt-6 bg-blue-900/20 border border-blue-500/20 rounded-xl p-4">
            <p class="text-blue-300 text-sm font-semibold mb-1">💡 Recuerda</p>
            <ul class="text-blue-200/60 text-xs space-y-1">
              <li>• Llega 10 minutos antes</li>
              <li>• Muestra este código al encargado</li>
              <li>• Para cancelar usa el mismo código</li>
            </ul>
          </div>
        </div>
      }

      @if (!cargando() && error()) {
        <div class="max-w-md w-full text-center">
          <span class="text-5xl">❌</span>
          <h2 class="text-2xl font-bold text-white mt-4">Reserva no encontrada</h2>
          <p class="text-white/50 mt-2">{{ error() }}</p>
          <a routerLink="/" class="btn-primary inline-block mt-6">Volver al inicio</a>
        </div>
      }
    </div>
  `,
})
export class ConfirmarReservaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private reservaService = inject(ReservaService);

  reserva = signal<Reserva | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);
  copiado = signal(false);

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.cargando.set(false);
      this.error.set('Token inválido.');
      return;
    }
    this.reservaService.obtenerPorToken(token).subscribe({
      next: (r) => { this.reserva.set(r); this.cargando.set(false); },
      error: () => { this.error.set('No se encontró la reserva.'); this.cargando.set(false); }
    });
  }

  copiarToken() {
    const token = this.reserva()?.token;
    if (!token) return;
    navigator.clipboard.writeText(token).then(() => {
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    });
  }

  formatHora(hora?: string): string {
    if (!hora) return '';
    const [h] = hora.split(':');
    const hNum = parseInt(h);
    if (hNum === 0) return '12:00 AM';
    if (hNum < 12) return `${hNum}:00 AM`;
    if (hNum === 12) return '12:00 PM';
    return `${hNum - 12}:00 PM`;
  }
}
