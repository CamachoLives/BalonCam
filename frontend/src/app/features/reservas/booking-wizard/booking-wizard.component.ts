import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { CanchaService } from '../../../core/services/cancha.service';
import { ReservaService } from '../../../core/services/reserva.service';
import { Cancha } from '../../../core/models/cancha.model';
import { DisponibilidadSlot, BloqueoResponse } from '../../../core/models/reserva.model';

type Paso = 1 | 2 | 3;

@Component({
  selector: 'app-booking-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(30px)', opacity: 0 }),
        animate('350ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('250ms ease-in', style({ transform: 'translateX(-30px)', opacity: 0 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <div class="min-h-screen py-8 px-4">
      <div class="max-w-2xl mx-auto">
        <!-- Header -->
        <div class="mb-8" [@fadeIn]>
          <button class="text-white/50 hover:text-white text-sm flex items-center gap-2 mb-4 transition-colors" (click)="volver()">
            ← Volver
          </button>
          <h1 class="text-3xl font-black text-white">Reservar Cancha</h1>
          <p class="text-white/50 mt-1">Proceso rápido en 3 pasos</p>
        </div>

        <!-- Stepper -->
        <div class="flex items-center gap-2 mb-8" [@fadeIn]>
          @for (paso of pasos; track paso.num) {
            <div class="flex items-center gap-2 flex-1">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                     [class]="pasoActual() >= paso.num
                       ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40'
                       : 'bg-white/10 text-white/40'">
                  @if (pasoActual() > paso.num) { ✓ }
                  @else { {{ paso.num }} }
                </div>
                <span class="text-sm font-medium hidden sm:block"
                      [class]="pasoActual() === paso.num ? 'text-white' : 'text-white/40'">
                  {{ paso.label }}
                </span>
              </div>
              @if (!$last) {
                <div class="flex-1 h-0.5 mx-2 rounded transition-all duration-500"
                     [class]="pasoActual() > paso.num ? 'bg-emerald-500' : 'bg-white/10'"></div>
              }
            </div>
          }
        </div>

        <!-- PASO 1: Seleccionar cancha y fecha -->
        @if (pasoActual() === 1) {
          <div class="space-y-4" [@slideIn]>
            <div class="card">
              <h2 class="text-lg font-bold text-white mb-4">🏟️ Selecciona la Cancha y Fecha</h2>

              <!-- Selector de fecha -->
              <div class="mb-4">
                <label class="text-white/60 text-sm font-medium block mb-2">Fecha</label>
                <input type="date" class="input-field" [(ngModel)]="fecha" [min]="hoy"
                       (ngModelChange)="onFechaChange()" />
              </div>

              <!-- Lista de canchas -->
              <div class="mb-4">
                <label class="text-white/60 text-sm font-medium block mb-2">Cancha</label>
                @if (cargandoCanchas()) {
                  <div class="text-center py-6 text-white/40">Cargando canchas...</div>
                }
                <div class="grid gap-3">
                  @for (cancha of canchas(); track cancha.id) {
                    <div class="border-2 rounded-xl p-4 cursor-pointer transition-all duration-200"
                         [class]="canchaSeleccionada()?.id === cancha.id
                           ? 'border-emerald-400 bg-emerald-500/10'
                           : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'"
                         (click)="seleccionarCancha(cancha)">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="text-white font-semibold">{{ cancha.nombre }}</p>
                          <p class="text-white/50 text-sm">{{ cancha.descripcion }}</p>
                          <span class="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
                                [class]="cancha.tipo === 'FUTBOL_5' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'">
                            {{ cancha.tipo === 'FUTBOL_5' ? 'Fútbol 5' : 'Fútbol 11' }}
                          </span>
                        </div>
                        <div class="text-right">
                          <p class="text-emerald-400 font-bold">{{ cancha.precioPorHora | currency:'COP':'symbol':'1.0-0' }}</p>
                          <p class="text-white/40 text-xs">por hora</p>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <button class="btn-primary w-full"
                      [disabled]="!canchaSeleccionada() || !fecha"
                      [class.opacity-50]="!canchaSeleccionada() || !fecha"
                      (click)="irAPaso2()">
                Continuar →
              </button>
            </div>
          </div>
        }

        <!-- PASO 2: Seleccionar horario -->
        @if (pasoActual() === 2) {
          <div class="space-y-4" [@slideIn]>
            <div class="card">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-white">🕐 Selecciona el Horario</h2>
                <div class="text-right">
                  <p class="text-emerald-400 font-semibold text-sm">{{ canchaSeleccionada()?.nombre }}</p>
                  <p class="text-white/40 text-xs">{{ fecha | date:'EEEE d MMM':'':'es' }}</p>
                </div>
              </div>

              @if (cargandoSlots()) {
                <div class="text-center py-8">
                  <div class="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2"></div>
                  <p class="text-white/40 text-sm">Verificando disponibilidad...</p>
                </div>
              }

              @if (!cargandoSlots()) {
                <!-- Leyenda -->
                <div class="flex flex-wrap gap-3 mb-4 text-xs">
                  <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-emerald-500"></span> Disponible</span>
                  <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-amber-500"></span> Reservado</span>
                  <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-orange-500 animate-pulse"></span> En proceso</span>
                  <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-gray-600"></span> No disponible</span>
                </div>

                <!-- Grid de horarios -->
                <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  @for (slot of slots(); track slot.horaInicio) {
                    <div class="rounded-xl p-2.5 text-center text-sm font-semibold border-2 transition-all duration-200"
                         [class]="getClaseSlot(slot)"
                         (click)="seleccionarSlot(slot)">
                      <p class="text-xs font-bold">{{ formatHora(slot.horaInicio) }}</p>
                      <p class="text-xs opacity-70">{{ formatHora(slot.horaFin) }}</p>
                      <p class="text-xs mt-1">{{ getTextoSlot(slot) }}</p>
                    </div>
                  }
                </div>
              }

              @if (errorSlots()) {
                <div class="bg-red-900/30 border border-red-500/30 rounded-xl p-4 text-center mt-4">
                  <p class="text-red-300 text-sm">{{ errorSlots() }}</p>
                </div>
              }

              <div class="flex gap-3 mt-4">
                <button class="btn-secondary flex-1" (click)="pasoActual.set(1)">← Atrás</button>
                <button class="btn-primary flex-1"
                        [disabled]="!slotSeleccionado()"
                        [class.opacity-50]="!slotSeleccionado()"
                        (click)="bloquearYAvanzar()">
                  @if (bloqueando()) {
                    <span class="flex items-center justify-center gap-2">
                      <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Verificando...
                    </span>
                  } @else {
                    Continuar →
                  }
                </button>
              </div>
            </div>
          </div>
        }

        <!-- PASO 3: Datos y confirmación -->
        @if (pasoActual() === 3) {
          <div class="space-y-4" [@slideIn]>
            <!-- Resumen del slot con countdown -->
            <div class="card border border-emerald-500/30 bg-emerald-900/20">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-emerald-400 font-semibold">✅ Horario reservado temporalmente</p>
                  <p class="text-white/70 text-sm">{{ canchaSeleccionada()?.nombre }} · {{ formatHora(slotSeleccionado()?.horaInicio) }} - {{ formatHora(slotSeleccionado()?.horaFin) }}</p>
                  <p class="text-white/50 text-sm">{{ fecha | date:'d MMM yyyy':'':'es' }}</p>
                </div>
                <!-- Countdown timer -->
                <div class="text-center">
                  <div class="w-14 h-14 rounded-full border-4 flex items-center justify-center relative"
                       [style.border-color]="tiempoRestante() > 60 ? '#10b981' : '#f59e0b'">
                    <span class="font-mono font-bold text-sm"
                          [class]="tiempoRestante() > 60 ? 'text-emerald-400' : 'text-amber-400'">
                      {{ formatTiempo(tiempoRestante()) }}
                    </span>
                  </div>
                  <p class="text-white/40 text-xs mt-1">restante</p>
                </div>
              </div>
            </div>

            @if (tiempoRestante() <= 0) {
              <div class="card border border-red-500/30 bg-red-900/20">
                <p class="text-red-300 font-semibold">⏰ El tiempo expiró</p>
                <p class="text-white/50 text-sm mt-1">Debes seleccionar un horario nuevamente.</p>
                <button class="btn-secondary mt-3 w-full" (click)="reiniciar()">Intentar de nuevo</button>
              </div>
            }

            <!-- Formulario datos cliente -->
            <div class="card">
              <h2 class="text-lg font-bold text-white mb-4">👤 Tus Datos</h2>

              <div class="space-y-4">
                <div>
                  <label class="text-white/60 text-sm font-medium block mb-1.5">Nombre completo *</label>
                  <input type="text" class="input-field" [(ngModel)]="form.nombre"
                         placeholder="Ej: Juan Pérez" maxlength="100" />
                </div>
                <div>
                  <label class="text-white/60 text-sm font-medium block mb-1.5">Teléfono *</label>
                  <input type="tel" class="input-field" [(ngModel)]="form.telefono"
                         placeholder="Ej: 3001234567" />
                </div>
                <div>
                  <label class="text-white/60 text-sm font-medium block mb-1.5">
                    Email <span class="text-white/30">(opcional)</span>
                  </label>
                  <input type="email" class="input-field" [(ngModel)]="form.email"
                         placeholder="para recibir confirmación" />
                </div>
              </div>

              @if (errorConfirmacion()) {
                <div class="mt-4 bg-red-900/30 border border-red-500/30 rounded-xl p-3">
                  <p class="text-red-300 text-sm">{{ errorConfirmacion() }}</p>
                </div>
              }

              <div class="flex gap-3 mt-6">
                <button class="btn-secondary flex-1" (click)="pasoActual.set(2)" [disabled]="confirmando()">
                  ← Atrás
                </button>
                <button class="btn-primary flex-1"
                        [disabled]="!formularioValido() || confirmando() || tiempoRestante() <= 0"
                        [class.opacity-50]="!formularioValido() || confirmando() || tiempoRestante() <= 0"
                        (click)="confirmar()">
                  @if (confirmando()) {
                    <span class="flex items-center justify-center gap-2">
                      <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Confirmando...
                    </span>
                  } @else {
                    ¡Confirmar Reserva! ✅
                  }
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class BookingWizardComponent implements OnInit {
  private canchaService = inject(CanchaService);
  private reservaService = inject(ReservaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  pasoActual = signal<Paso>(1);
  canchas = signal<Cancha[]>([]);
  canchaSeleccionada = signal<Cancha | null>(null);
  slots = signal<DisponibilidadSlot[]>([]);
  slotSeleccionado = signal<DisponibilidadSlot | null>(null);
  bloqueo = signal<BloqueoResponse | null>(null);
  cargandoCanchas = signal(false);
  cargandoSlots = signal(false);
  bloqueando = signal(false);
  confirmando = signal(false);
  errorSlots = signal<string | null>(null);
  errorConfirmacion = signal<string | null>(null);
  tiempoRestante = signal(0);

  fecha: string = new Date().toISOString().split('T')[0];
  hoy = new Date().toISOString().split('T')[0];

  form = { nombre: '', telefono: '', email: '' };

  pasos = [
    { num: 1 as Paso, label: 'Cancha' },
    { num: 2 as Paso, label: 'Horario' },
    { num: 3 as Paso, label: 'Confirmar' },
  ];

  private countdown: ReturnType<typeof setInterval> | null = null;

  formularioValido = computed(() =>
    this.form.nombre.trim().length >= 2 &&
    this.form.telefono.trim().length >= 7
  );

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['fecha']) this.fecha = params['fecha'];
      this.cargarCanchas(params['canchaId'] ? +params['canchaId'] : null);
    });
  }

  cargarCanchas(preseleccionId: number | null = null) {
    this.cargandoCanchas.set(true);
    this.canchaService.listarTodas().subscribe({
      next: (canchas) => {
        this.canchas.set(canchas);
        this.cargandoCanchas.set(false);
        if (preseleccionId) {
          const c = canchas.find(c => c.id === preseleccionId);
          if (c) this.seleccionarCancha(c);
        }
      },
      error: () => this.cargandoCanchas.set(false)
    });
  }

  seleccionarCancha(cancha: Cancha) {
    this.canchaSeleccionada.set(cancha);
  }

  onFechaChange() {
    this.slotSeleccionado.set(null);
    if (this.pasoActual() === 2) this.cargarSlots();
  }

  irAPaso2() {
    if (!this.canchaSeleccionada()) return;
    this.pasoActual.set(2);
    this.cargarSlots();
  }

  cargarSlots() {
    const cancha = this.canchaSeleccionada();
    if (!cancha) return;
    this.cargandoSlots.set(true);
    this.errorSlots.set(null);
    this.canchaService.obtenerDisponibilidad(cancha.id, this.fecha).subscribe({
      next: (slots) => {
        this.slots.set(slots);
        this.cargandoSlots.set(false);
      },
      error: (err) => {
        this.errorSlots.set('No se pudo cargar la disponibilidad.');
        this.cargandoSlots.set(false);
      }
    });
  }

  seleccionarSlot(slot: DisponibilidadSlot) {
    if (slot.estado !== 'DISPONIBLE') return;
    this.slotSeleccionado.set(slot);
  }

  bloquearYAvanzar() {
    const slot = this.slotSeleccionado();
    const cancha = this.canchaSeleccionada();
    if (!slot || !cancha) return;

    this.bloqueando.set(true);
    this.reservaService.bloquearSlot({
      canchaId: cancha.id,
      fecha: this.fecha,
      horaInicio: slot.horaInicio
    }).subscribe({
      next: (resp) => {
        this.bloqueo.set(resp);
        this.bloqueando.set(false);
        this.pasoActual.set(3);
        this.iniciarCountdown(resp.expiresAt);
      },
      error: (err) => {
        this.bloqueando.set(false);
        const msg = err.error?.mensaje || 'Este horario ya no está disponible.';
        this.errorSlots.set(msg);
        this.cargarSlots();
      }
    });
  }

  confirmar() {
    const bloqueo = this.bloqueo();
    if (!bloqueo) return;

    this.confirmando.set(true);
    this.errorConfirmacion.set(null);
    this.reservaService.confirmarReserva({
      token: bloqueo.token,
      nombre: this.form.nombre,
      telefono: this.form.telefono,
      email: this.form.email || undefined
    }).subscribe({
      next: (reserva) => {
        this.confirmando.set(false);
        this.limpiarCountdown();
        this.router.navigate(['/reserva', reserva.token]);
      },
      error: (err) => {
        this.confirmando.set(false);
        const msg = err.error?.mensaje || 'No se pudo confirmar. Intenta nuevamente.';
        this.errorConfirmacion.set(msg);
      }
    });
  }

  reiniciar() {
    this.limpiarCountdown();
    this.slotSeleccionado.set(null);
    this.bloqueo.set(null);
    this.pasoActual.set(2);
    this.cargarSlots();
  }

  volver() {
    this.limpiarCountdown();
    this.router.navigate(['/']);
  }

  private iniciarCountdown(expiresAt: string) {
    this.limpiarCountdown();
    const expires = new Date(expiresAt).getTime();
    const tick = () => {
      const remaining = Math.max(0, Math.floor((expires - Date.now()) / 1000));
      this.tiempoRestante.set(remaining);
    };
    tick();
    this.countdown = setInterval(tick, 1000);
  }

  private limpiarCountdown() {
    if (this.countdown) { clearInterval(this.countdown); this.countdown = null; }
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

  formatTiempo(segundos: number): string {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  getClaseSlot(slot: DisponibilidadSlot): string {
    if (slot === this.slotSeleccionado()) return 'slot-seleccionado';
    switch (slot.estado) {
      case 'DISPONIBLE': return 'slot-disponible';
      case 'OCUPADO': return 'slot-ocupado';
      case 'BLOQUEADO': return 'slot-bloqueado';
      default: return 'slot-inactivo';
    }
  }

  getTextoSlot(slot: DisponibilidadSlot): string {
    switch (slot.estado) {
      case 'DISPONIBLE': return `$${(slot.precioPorHora / 1000).toFixed(0)}K`;
      case 'OCUPADO': return 'Ocupado';
      case 'BLOQUEADO': return 'En proceso';
      default: return 'Pasado';
    }
  }
}
