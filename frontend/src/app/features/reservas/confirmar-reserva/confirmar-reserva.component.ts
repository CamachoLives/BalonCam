import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReservaService } from '../../../core/services/reserva.service';
import { Reserva, METODOS_PAGO_INFO } from '../../../core/models/reserva.model';
import { formatHora, formatPesos, enlaceWhatsapp } from '../../../core/utils/fecha';

@Component({
  selector: 'app-confirmar-reserva',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center py-12 px-4">
      @if (cargando()) {
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-white/50">Cargando tu reserva...</p>
        </div>
      }

      @if (!cargando() && reserva(); as r) {
        <div class="max-w-md w-full" data-anim="popIn">
          <div class="text-center mb-8">
            @if (r.estado === 'CANCELADA') {
              <div class="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><span class="text-5xl">✖️</span></div>
              <h1 class="text-3xl font-black text-white">Reserva cancelada</h1>
              <p class="text-white/50 mt-1">Este horario quedó libre otra vez.</p>
            } @else {
              <div class="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/20"><span class="text-5xl">✅</span></div>
              <h1 class="text-3xl font-black text-white">¡Reserva Confirmada!</h1>
              <p class="text-emerald-400 mt-1">Tu lugar está asegurado. ¡A jugar!</p>
            }
          </div>

          <div class="card border border-emerald-500/30 relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-400"></div>
            <div class="space-y-4">
              <div class="bg-black/30 rounded-xl p-4 text-center">
                <p class="text-white/50 text-xs uppercase tracking-wider mb-1">Código de Reserva</p>
                <p class="font-mono text-emerald-400 text-2xl font-bold tracking-widest">{{ codigo() }}</p>
                <p class="text-white/40 text-xs mt-1">Muestra este código al llegar</p>
              </div>

              <div class="divide-y divide-white/5">
                <div class="flex justify-between py-3 gap-3"><span class="text-white/50 text-sm">Cancha</span><span class="text-white font-semibold text-sm text-right">{{ r.canchaNombre }}</span></div>
                <div class="flex justify-between py-3 gap-3"><span class="text-white/50 text-sm">Fecha</span><span class="text-white font-semibold text-sm text-right capitalize">{{ r.fecha | date:'EEEE d MMMM yyyy':'':'es' }}</span></div>
                <div class="flex justify-between py-3 gap-3"><span class="text-white/50 text-sm">Horario</span><span class="text-white font-semibold text-sm">{{ hora(r.horaInicio) }} – {{ hora(r.horaFin) }}</span></div>
                <div class="flex justify-between py-3 gap-3"><span class="text-white/50 text-sm">A nombre de</span><span class="text-white font-semibold text-sm text-right">{{ r.clienteNombre }}</span></div>
                <div class="flex justify-between py-3 gap-3"><span class="text-white/50 text-sm">Valor</span><span class="text-white font-semibold text-sm">{{ pesos(r.valorTotal) }}</span></div>
                <div class="flex justify-between py-3 gap-3"><span class="text-white/50 text-sm">Pago</span><span class="text-white font-semibold text-sm text-right">{{ infoPago[r.metodoPago].titulo || r.metodoPago }}</span></div>
                <div class="flex justify-between py-3 gap-3">
                  <span class="text-white/50 text-sm">Estado del pago</span>
                  <span class="font-semibold text-sm text-right"
                        [class]="r.estadoPago === 'PAGADO' ? 'text-emerald-400' : r.estadoPago === 'ANTICIPO' ? 'text-blue-300' : 'text-amber-300'">
                    @switch (r.estadoPago) {
                      @case ('PAGADO') { Pagado }
                      @case ('ANTICIPO') { Anticipo de {{ pesos(r.valorPagado) }} · saldo {{ pesos(r.saldoPendiente) }} }
                      @default { Pendiente: {{ pesos(r.saldoPendiente) }} }
                    }
                  </span>
                </div>
                @if (r.referenciaPago) {
                  <div class="flex justify-between py-3 gap-3"><span class="text-white/50 text-sm">Referencia</span><span class="text-white/80 font-mono text-xs">{{ r.referenciaPago }}</span></div>
                }
              </div>
            </div>
          </div>

          @if (r.estado !== 'CANCELADA' && r.metodoPago === 'NEQUI' && r.estadoPago === 'PENDIENTE') {
            <div class="mt-4 card border border-purple-500/30 bg-purple-900/20">
              <p class="text-white font-semibold">📲 Paga por Nequi</p>
              <p class="text-white/70 text-sm mt-1">Transfiere <b class="text-white">{{ pesos(r.valorTotal) }}</b> al Nequi
                <b class="text-white font-mono">{{ r.nequiNumero }}</b>@if (r.nequiTitular) { ({{ r.nequiTitular }}) } y envía el comprobante.</p>
              <a class="btn-primary w-full mt-3 block text-center" target="_blank" rel="noopener" [href]="linkComprobante()">Enviar comprobante por WhatsApp</a>
            </div>
          }
          @if (r.estado !== 'CANCELADA' && r.metodoPago === 'EN_CANCHA') {
            <div class="mt-4 bg-amber-900/20 border border-amber-500/20 rounded-xl p-4">
              <p class="text-amber-200 text-sm">💵 Pagas {{ pesos(r.saldoPendiente) }} al llegar a la cancha.</p>
            </div>
          }

          <div class="flex gap-3 mt-6">
            <button class="btn-secondary flex-1 text-sm" (click)="copiarCodigo()">{{ copiado() ? '✅ Copiado' : '📋 Copiar código' }}</button>
            <a routerLink="/" class="btn-primary flex-1 text-sm text-center">Volver al inicio</a>
          </div>

          @if (r.estado !== 'CANCELADA') {
            <div class="mt-6 bg-blue-900/20 border border-blue-500/20 rounded-xl p-4">
              <p class="text-blue-300 text-sm font-semibold mb-1">💡 Recuerda</p>
              <ul class="text-blue-100/70 text-xs space-y-1">
                <li>• Llega 10 minutos antes</li>
                <li>• Guarda este enlace: aquí puedes ver o cancelar tu reserva</li>
              </ul>
              <div class="flex flex-wrap gap-3 mt-3">
                @if (r.negocioWhatsapp) {
                  <a class="text-emerald-300 text-xs underline" target="_blank" rel="noopener" [href]="linkEncargado()">Escribir al encargado</a>
                }
                @if (!confirmandoCancelar()) {
                  <button class="text-red-300 text-xs underline" (click)="confirmandoCancelar.set(true)">Cancelar reserva</button>
                } @else {
                  <span class="text-xs text-white/70">¿Seguro?
                    <button class="text-red-300 underline ml-1" [disabled]="cancelando()" (click)="cancelar()">Sí, cancelar</button>
                    <button class="text-white/60 underline ml-2" (click)="confirmandoCancelar.set(false)">No</button>
                  </span>
                }
              </div>
            </div>
          }
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

  readonly infoPago = METODOS_PAGO_INFO;
  reserva = signal<Reserva | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);
  copiado = signal(false);
  confirmandoCancelar = signal(false);
  cancelando = signal(false);

  codigo = computed(() => (this.reserva()?.token ?? '').slice(0, 8).toUpperCase());

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.cargando.set(false);
      this.error.set('Enlace inválido.');
      return;
    }
    this.reservaService.obtenerPorToken(token).subscribe({
      next: (r) => { this.reserva.set(r); this.cargando.set(false); },
      error: () => { this.error.set('Revisa que el enlace esté completo.'); this.cargando.set(false); }
    });
  }

  private resumen(r: Reserva) {
    return `${r.canchaNombre}, ${r.fecha} de ${formatHora(r.horaInicio)} a ${formatHora(r.horaFin)}, a nombre de ${r.clienteNombre}. Código: ${this.codigo()}`;
  }

  linkComprobante() {
    const r = this.reserva()!;
    return enlaceWhatsapp(r.negocioWhatsapp, `Hola, envío el comprobante de pago de mi reserva: ${this.resumen(r)}`);
  }

  linkEncargado() {
    const r = this.reserva()!;
    return enlaceWhatsapp(r.negocioWhatsapp, `Hola, tengo una pregunta sobre mi reserva: ${this.resumen(r)}`);
  }

  copiarCodigo() {
    navigator.clipboard?.writeText(this.codigo()).then(() => {
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    });
  }

  cancelar() {
    const r = this.reserva();
    if (!r) return;
    this.cancelando.set(true);
    this.reservaService.cancelar(r.token).subscribe({
      next: () => { this.reserva.set({ ...r, estado: 'CANCELADA' }); this.cancelando.set(false); this.confirmandoCancelar.set(false); },
      error: () => { this.cancelando.set(false); },
    });
  }

  hora(h?: string | null) { return formatHora(h); }
  pesos(v?: number | null) { return formatPesos(v); }
}
