import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CanchaService } from '../../../core/services/cancha.service';
import { ReservaService } from '../../../core/services/reserva.service';
import { ConfigService } from '../../../core/services/config.service';
import { Cancha, TIPO_CANCHA_TEXTO } from '../../../core/models/cancha.model';
import { DisponibilidadSlot, BloqueoResponse, MetodoPago, METODOS_PAGO_INFO } from '../../../core/models/reserva.model';
import { hoyColombia, sumarDias, formatHora, formatPesos } from '../../../core/utils/fecha';

type Paso = 1 | 2 | 3;

@Component({
  selector: 'app-booking-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen py-8 px-4">
      <div class="max-w-2xl mx-auto">
        <!-- Header -->
        <div class="mb-8" data-anim="fadeIn">
          <button class="text-white/50 hover:text-white text-sm flex items-center gap-2 mb-4 transition-colors" (click)="volver()">
            ← Volver
          </button>
          <h1 class="text-3xl font-black text-white">Reservar Cancha</h1>
          <p class="text-white/50 mt-1">Proceso rápido en 3 pasos</p>
        </div>

        <!-- Stepper -->
        <div class="flex items-center gap-2 mb-8" data-anim="fadeIn">
          @for (paso of pasos; track paso.num) {
            <div class="flex items-center gap-2" [class.flex-1]="!$last">
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

        <!-- PASO 1: Cancha y fecha -->
        @if (pasoActual() === 1) {
          <div class="space-y-4" data-anim="slideIn">
            <div class="card">
              <h2 class="text-lg font-bold text-white mb-4">🏟️ Selecciona la Cancha y Fecha</h2>

              <div class="mb-4">
                <label for="fecha" class="text-white/60 text-sm font-medium block mb-2">Fecha</label>
                <input id="fecha" type="date" class="input-field" [(ngModel)]="fecha" [min]="hoy" [max]="fechaMax()"
                       (ngModelChange)="onFechaChange()" />
              </div>

              <div class="mb-4">
                <p class="text-white/60 text-sm font-medium mb-2">Cancha</p>
                @if (cargandoCanchas()) {
                  <div class="text-center py-6 text-white/40">Cargando canchas...</div>
                }
                @if (errorCanchas()) {
                  <div class="bg-red-900/30 border border-red-500/30 rounded-xl p-4 text-center">
                    <p class="text-red-300 text-sm">{{ errorCanchas() }}</p>
                    <button class="btn-secondary mt-3 text-sm" (click)="cargarCanchas()">Reintentar</button>
                  </div>
                }
                <div class="grid gap-3">
                  @for (cancha of canchas(); track cancha.id) {
                    <button type="button"
                         class="text-left border-2 rounded-xl p-4 transition-all duration-200 w-full"
                         [class]="cancha.estado !== 'ACTIVA'
                           ? 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
                           : canchaSeleccionada()?.id === cancha.id
                             ? 'border-emerald-400 bg-emerald-500/10'
                             : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'"
                         [disabled]="cancha.estado !== 'ACTIVA'"
                         (click)="seleccionarCancha(cancha)">
                      <div class="flex items-center justify-between gap-3">
                        <div>
                          <p class="text-white font-semibold">{{ cancha.nombre }}</p>
                          <p class="text-white/50 text-sm">{{ cancha.descripcion }}</p>
                          <span class="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
                                [class]="cancha.tipo === 'FUTBOL_5' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'">
                            {{ tipoTexto[cancha.tipo] }}
                          </span>
                          @if (cancha.estado === 'MANTENIMIENTO') {
                            <span class="inline-block mt-1 ml-1 text-xs px-2 py-0.5 rounded-full bg-gray-500/30 text-gray-300">En mantenimiento</span>
                          }
                        </div>
                        <div class="text-right shrink-0">
                          <p class="text-emerald-400 font-bold">{{ pesos(cancha.precioPorHora) }}</p>
                          <p class="text-white/40 text-xs">por hora</p>
                        </div>
                      </div>
                    </button>
                  }
                </div>
                @if (tieneCanchaCompartida()) {
                  <p class="text-white/40 text-xs mt-3">
                    ℹ️ La cancha completa ocupa el mismo espacio que las de fútbol 5: si una está reservada, la otra no está disponible a esa hora.
                  </p>
                }
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

        <!-- PASO 2: Horario -->
        @if (pasoActual() === 2) {
          <div class="space-y-4" data-anim="slideIn">
            <div class="card">
              <div class="flex items-center justify-between mb-4 gap-3">
                <h2 class="text-lg font-bold text-white">🕐 Selecciona el Horario</h2>
                <div class="text-right">
                  <p class="text-emerald-400 font-semibold text-sm">{{ canchaSeleccionada()?.nombre }}</p>
                  <p class="text-white/40 text-xs capitalize">{{ fecha | date:'EEEE d MMM':'':'es' }}</p>
                </div>
              </div>

              @if (cargandoSlots()) {
                <div class="text-center py-8">
                  <div class="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2"></div>
                  <p class="text-white/40 text-sm">Verificando disponibilidad...</p>
                </div>
              }

              @if (!cargandoSlots()) {
                <div class="flex flex-wrap gap-3 mb-4 text-xs text-white/70">
                  <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-emerald-500"></span> Disponible</span>
                  <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-amber-500"></span> Reservado</span>
                  <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-orange-500 animate-pulse"></span> En proceso</span>
                  <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-gray-600"></span> No disponible</span>
                </div>

                @if (slots().length && libres() === 0) {
                  <div class="bg-amber-900/20 border border-amber-500/30 rounded-xl p-3 mb-4 text-amber-200 text-sm">
                    No quedan horarios libres para este día. Prueba otra fecha u otra cancha.
                  </div>
                }

                <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  @for (slot of slots(); track slot.horaInicio) {
                    <button type="button"
                         class="rounded-xl p-2.5 text-center text-sm font-semibold border-2 transition-all duration-200"
                         [class]="getClaseSlot(slot)"
                         [disabled]="slot.estado !== 'DISPONIBLE'"
                         [attr.aria-pressed]="slot === slotSeleccionado()"
                         [attr.title]="slot.motivo || null"
                         (click)="seleccionarSlot(slot)">
                      <span class="block text-xs font-bold">{{ hora(slot.horaInicio) }}</span>
                      <span class="block text-xs opacity-70">{{ hora(slot.horaFin) }}</span>
                      <span class="block text-xs mt-1">{{ getTextoSlot(slot) }}</span>
                    </button>
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
                        [disabled]="!slotSeleccionado() || bloqueando()"
                        [class.opacity-50]="!slotSeleccionado()"
                        (click)="bloquearYAvanzar()">
                  @if (bloqueando()) {
                    <span class="flex items-center justify-center gap-2">
                      <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Apartando...
                    </span>
                  } @else {
                    Continuar →
                  }
                </button>
              </div>
            </div>
          </div>
        }

        <!-- PASO 3: Datos y pago -->
        @if (pasoActual() === 3) {
          <div class="space-y-4" data-anim="slideIn">
            <div class="card border border-emerald-500/30 bg-emerald-900/20">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-emerald-400 font-semibold">✅ Horario apartado para ti</p>
                  <p class="text-white/80 text-sm">{{ canchaSeleccionada()?.nombre }} · {{ hora(slotSeleccionado()?.horaInicio) }} – {{ hora(slotSeleccionado()?.horaFin) }}</p>
                  <p class="text-white/50 text-sm capitalize">{{ fecha | date:'EEEE d MMM yyyy':'':'es' }}</p>
                  <p class="text-white font-bold mt-1">Total: {{ pesos(precio()) }}</p>
                </div>
                <div class="text-center shrink-0">
                  <div class="w-16 h-16 rounded-full border-4 flex items-center justify-center"
                       [style.border-color]="tiempoRestante() > 60 ? '#10b981' : '#f59e0b'">
                    <span class="font-mono font-bold text-sm"
                          [class]="tiempoRestante() > 60 ? 'text-emerald-400' : 'text-amber-400'">
                      {{ formatTiempo(tiempoRestante()) }}
                    </span>
                  </div>
                  <p class="text-white/40 text-xs mt-1">para confirmar</p>
                </div>
              </div>
            </div>

            @if (tiempoRestante() <= 0) {
              <div class="card border border-red-500/30 bg-red-900/20">
                <p class="text-red-300 font-semibold">⏰ El tiempo expiró</p>
                <p class="text-white/50 text-sm mt-1">El horario se liberó. Elígelo de nuevo para continuar.</p>
                <button class="btn-secondary mt-3 w-full" (click)="reiniciar()">Elegir horario otra vez</button>
              </div>
            }

            <div class="card">
              <h2 class="text-lg font-bold text-white mb-4">👤 Tus Datos</h2>
              <div class="space-y-4">
                <div>
                  <label for="nombre" class="text-white/60 text-sm font-medium block mb-1.5">Nombre completo *</label>
                  <input id="nombre" type="text" class="input-field" [(ngModel)]="form.nombre" autocomplete="name"
                         placeholder="Ej: Juan Pérez" maxlength="100" />
                </div>
                <div>
                  <label for="telefono" class="text-white/60 text-sm font-medium block mb-1.5">Celular (WhatsApp) *</label>
                  <input id="telefono" type="tel" inputmode="tel" class="input-field" [(ngModel)]="form.telefono" autocomplete="tel"
                         placeholder="Ej: 300 123 4567" maxlength="20" />
                </div>
                <div>
                  <label for="email" class="text-white/60 text-sm font-medium block mb-1.5">
                    Correo <span class="text-white/30">(opcional)</span>
                  </label>
                  <input id="email" type="email" class="input-field" [(ngModel)]="form.email" autocomplete="email"
                         placeholder="para recibir la confirmación" />
                </div>
              </div>
            </div>

            <div class="card">
              <h2 class="text-lg font-bold text-white mb-1">💰 ¿Cómo quieres pagar?</h2>
              @if (anticipo() < 100 && metodos().includes('EN_LINEA')) {
                <p class="text-white/50 text-sm mb-4">En línea pagas un anticipo del {{ anticipo() }}% ({{ pesos(valorAnticipo()) }}) y el resto al llegar.</p>
              } @else {
                <p class="text-white/50 text-sm mb-4">Elige el medio que te quede más fácil.</p>
              }
              <div class="grid gap-3" role="radiogroup" aria-label="Medio de pago">
                @for (m of metodos(); track m) {
                  <button type="button" role="radio" [attr.aria-checked]="metodoPago() === m"
                       class="text-left border-2 rounded-xl p-4 transition-all duration-200 flex items-center gap-3 w-full"
                       [class]="metodoPago() === m ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/10 bg-white/5 hover:border-white/30'"
                       (click)="metodoPago.set(m)">
                    <span class="text-2xl">{{ infoPago[m].icono }}</span>
                    <span class="flex-1">
                      <span class="block text-white font-semibold">{{ infoPago[m].titulo }}</span>
                      <span class="block text-white/50 text-sm">{{ infoPago[m].detalle }}</span>
                    </span>
                    <span class="w-5 h-5 rounded-full border-2 shrink-0"
                          [class]="metodoPago() === m ? 'border-emerald-400 bg-emerald-400' : 'border-white/30'"></span>
                  </button>
                }
              </div>

              @if (errorConfirmacion()) {
                <div class="mt-4 bg-red-900/30 border border-red-500/30 rounded-xl p-3">
                  <p class="text-red-300 text-sm">{{ errorConfirmacion() }}</p>
                </div>
              }
              @if (!formularioValido() && intentoConfirmar()) {
                <p class="text-amber-300 text-sm mt-4">Escribe tu nombre y un celular válido para continuar.</p>
              }

              <div class="flex gap-3 mt-6">
                <button class="btn-secondary flex-1" (click)="volverAHorario()" [disabled]="confirmando()">← Atrás</button>
                <button class="btn-primary flex-1"
                        [disabled]="confirmando() || tiempoRestante() <= 0"
                        [class.opacity-50]="!formularioValido() || tiempoRestante() <= 0"
                        (click)="continuarPago()">
                  @if (confirmando()) {
                    <span class="flex items-center justify-center gap-2">
                      <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Confirmando...
                    </span>
                  } @else if (metodoPago() === 'EN_LINEA') {
                    Ir a pagar {{ pesos(valorAnticipo()) }} →
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

    <!-- Pasarela de pago (simulada en modo demo) -->
    @if (mostrarPasarela()) {
      <div class="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" data-anim="fadeIn"
           role="dialog" aria-modal="true" aria-labelledby="titulo-pasarela">
        <div class="bg-white text-gray-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
          <div class="bg-gray-900 text-white px-5 py-4 flex items-center justify-between">
            <p id="titulo-pasarela" class="font-bold">Pago seguro</p>
            <span class="text-xs bg-amber-400 text-gray-900 font-bold px-2 py-0.5 rounded">MODO DEMO</span>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <p class="text-gray-500 text-sm">{{ config()?.negocioNombre }} · {{ canchaSeleccionada()?.nombre }}</p>
              <p class="text-3xl font-black">{{ pesos(valorAnticipo()) }}</p>
              @if (valorAnticipo() < precio()) {
                <p class="text-gray-500 text-sm">Anticipo del {{ anticipo() }}%. Saldo al llegar: {{ pesos(precio() - valorAnticipo()) }}</p>
              }
            </div>
            <div class="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
              @for (op of opcionesPasarela; track op) {
                <button type="button" class="border-2 rounded-lg py-2"
                        [class]="opcionPasarela() === op ? 'border-gray-900 bg-gray-100' : 'border-gray-200'"
                        (click)="opcionPasarela.set(op)">{{ op }}</button>
              }
            </div>
            <p class="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              Esta es una demostración: no se hace ningún cobro real. Al conectar una pasarela (Wompi, Mercado Pago, ePayco) aquí se paga de verdad.
            </p>
            <div class="flex gap-2">
              <button type="button" class="flex-1 border-2 border-gray-200 rounded-xl py-3 font-semibold" [disabled]="pagando()" (click)="mostrarPasarela.set(false)">Cancelar</button>
              <button type="button" class="flex-1 bg-gray-900 text-white rounded-xl py-3 font-semibold" [disabled]="pagando()" (click)="pagarDemo()">
                @if (pagando()) { Procesando... } @else { Pagar }
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class BookingWizardComponent implements OnInit, OnDestroy {
  private canchaService = inject(CanchaService);
  private reservaService = inject(ReservaService);
  private configService = inject(ConfigService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly tipoTexto = TIPO_CANCHA_TEXTO;
  readonly infoPago = METODOS_PAGO_INFO;
  readonly opcionesPasarela = ['Tarjeta', 'PSE', 'Nequi'];

  config = this.configService.config;
  pasoActual = signal<Paso>(1);
  canchas = signal<Cancha[]>([]);
  canchaSeleccionada = signal<Cancha | null>(null);
  slots = signal<DisponibilidadSlot[]>([]);
  slotSeleccionado = signal<DisponibilidadSlot | null>(null);
  bloqueo = signal<BloqueoResponse | null>(null);
  cargandoCanchas = signal(false);
  errorCanchas = signal<string | null>(null);
  cargandoSlots = signal(false);
  bloqueando = signal(false);
  confirmando = signal(false);
  errorSlots = signal<string | null>(null);
  errorConfirmacion = signal<string | null>(null);
  tiempoRestante = signal(0);
  metodoPago = signal<MetodoPago>('EN_CANCHA');
  mostrarPasarela = signal(false);
  pagando = signal(false);
  opcionPasarela = signal('Tarjeta');
  intentoConfirmar = signal(false);

  hoy = hoyColombia();
  fecha: string = this.hoy;
  form = { nombre: '', telefono: '', email: '' };

  pasos = [
    { num: 1 as Paso, label: 'Cancha' },
    { num: 2 as Paso, label: 'Horario' },
    { num: 3 as Paso, label: 'Datos y pago' },
  ];

  metodos = computed<MetodoPago[]>(() => this.config()?.metodosPago ?? ['EN_CANCHA']);
  anticipo = computed(() => this.config()?.anticipoPorcentaje ?? 100);
  precio = computed(() => this.canchaSeleccionada()?.precioPorHora ?? 0);
  valorAnticipo = computed(() => Math.round(this.precio() * Math.min(100, this.anticipo()) / 100));
  libres = computed(() => this.slots().filter(s => s.estado === 'DISPONIBLE').length);
  fechaMax = computed(() => sumarDias(this.hoy, this.config()?.diasAnticipacion ?? 30));
  tieneCanchaCompartida = computed(() => this.canchas().some(c => !!c.canchaPadreId));

  private countdown: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.configService.cargar().subscribe({
      next: (c) => {
        if (c.hoy) this.hoy = c.hoy;
        const metodos = c.metodosPago ?? [];
        this.metodoPago.set(metodos.includes('EN_LINEA') ? 'EN_LINEA' : (metodos[0] ?? 'EN_CANCHA'));
      },
      error: () => {},
    });
    this.route.queryParams.subscribe(params => {
      if (params['fecha'] && params['fecha'] >= this.hoy) this.fecha = params['fecha'];
      this.cargarCanchas(params['canchaId'] ? +params['canchaId'] : null);
    });
  }

  ngOnDestroy() {
    this.limpiarCountdown();
  }

  /** Se evalúa en cada cambio del formulario (no es signal porque usa ngModel). */
  formularioValido(): boolean {
    return this.form.nombre.trim().length >= 2 &&
      this.form.telefono.replace(/\D/g, '').length >= 7 &&
      (!this.form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email.trim()));
  }

  cargarCanchas(preseleccionId: number | null = null) {
    this.cargandoCanchas.set(true);
    this.errorCanchas.set(null);
    this.canchaService.listarTodas().subscribe({
      next: (canchas) => {
        this.canchas.set(canchas);
        this.cargandoCanchas.set(false);
        if (preseleccionId) {
          const c = canchas.find(c => c.id === preseleccionId && c.estado === 'ACTIVA');
          if (c) { this.seleccionarCancha(c); this.irAPaso2(); }
        }
      },
      error: () => {
        this.cargandoCanchas.set(false);
        this.errorCanchas.set('No se pudieron cargar las canchas. Revisa tu conexión.');
      }
    });
  }

  seleccionarCancha(cancha: Cancha) {
    if (cancha.estado !== 'ACTIVA') return;
    this.canchaSeleccionada.set(cancha);
  }

  onFechaChange() {
    this.slotSeleccionado.set(null);
    if (this.pasoActual() === 2) this.cargarSlots();
  }

  irAPaso2() {
    if (!this.canchaSeleccionada()) return;
    this.slotSeleccionado.set(null);
    this.errorSlots.set(null);
    this.pasoActual.set(2);
    this.cargarSlots();
  }

  cargarSlots() {
    const cancha = this.canchaSeleccionada();
    if (!cancha) return;
    this.cargandoSlots.set(true);
    this.canchaService.obtenerDisponibilidad(cancha.id, this.fecha).subscribe({
      next: (slots) => {
        this.slots.set(slots);
        this.cargandoSlots.set(false);
      },
      error: () => {
        this.errorSlots.set('No se pudo cargar la disponibilidad.');
        this.cargandoSlots.set(false);
      }
    });
  }

  seleccionarSlot(slot: DisponibilidadSlot) {
    if (slot.estado !== 'DISPONIBLE') return;
    this.errorSlots.set(null);
    this.slotSeleccionado.set(slot);
  }

  bloquearYAvanzar() {
    const slot = this.slotSeleccionado();
    const cancha = this.canchaSeleccionada();
    if (!slot || !cancha) return;

    this.bloqueando.set(true);
    this.reservaService.bloquearSlot({ canchaId: cancha.id, fecha: this.fecha, horaInicio: slot.horaInicio }).subscribe({
      next: (resp) => {
        this.bloqueo.set(resp);
        this.bloqueando.set(false);
        this.errorConfirmacion.set(null);
        this.pasoActual.set(3);
        this.iniciarCountdown(resp.expiresAt);
      },
      error: (err) => {
        this.bloqueando.set(false);
        this.errorSlots.set(err.error?.mensaje || 'Este horario ya no está disponible.');
        this.slotSeleccionado.set(null);
        this.cargarSlots();
      }
    });
  }

  continuarPago() {
    this.intentoConfirmar.set(true);
    if (!this.formularioValido() || this.tiempoRestante() <= 0) return;
    if (this.metodoPago() === 'EN_LINEA') {
      this.mostrarPasarela.set(true);
      return;
    }
    this.confirmar();
  }

  pagarDemo() {
    this.pagando.set(true);
    setTimeout(() => {
      this.pagando.set(false);
      this.mostrarPasarela.set(false);
      this.confirmar();
    }, 1200);
  }

  confirmar() {
    const bloqueo = this.bloqueo();
    if (!bloqueo) return;

    this.confirmando.set(true);
    this.errorConfirmacion.set(null);
    this.reservaService.confirmarReserva({
      token: bloqueo.token,
      nombre: this.form.nombre.trim(),
      telefono: this.form.telefono.trim(),
      email: this.form.email.trim() || undefined,
      metodoPago: this.metodoPago(),
    }).subscribe({
      next: (reserva) => {
        this.confirmando.set(false);
        this.limpiarCountdown();
        this.router.navigate(['/reserva', reserva.token]);
      },
      error: (err) => {
        this.confirmando.set(false);
        this.errorConfirmacion.set(err.error?.mensaje || 'No se pudo confirmar. Intenta nuevamente.');
      }
    });
  }

  volverAHorario() {
    this.limpiarCountdown();
    this.bloqueo.set(null);
    this.slotSeleccionado.set(null);
    this.pasoActual.set(2);
    this.cargarSlots();
  }

  reiniciar() {
    this.volverAHorario();
  }

  volver() {
    this.limpiarCountdown();
    this.router.navigate(['/']);
  }

  private iniciarCountdown(expiresAt: string) {
    this.limpiarCountdown();
    const expires = new Date(expiresAt).getTime();
    const tick = () => this.tiempoRestante.set(Math.max(0, Math.floor((expires - Date.now()) / 1000)));
    tick();
    this.countdown = setInterval(tick, 1000);
  }

  private limpiarCountdown() {
    if (this.countdown) { clearInterval(this.countdown); this.countdown = null; }
  }

  hora(h?: string | null) { return formatHora(h); }
  pesos(v?: number | null) { return formatPesos(v); }

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
      case 'OCUPADO': return slot.motivo ? 'No disp.' : 'Ocupado';
      case 'BLOQUEADO': return 'En proceso';
      case 'NO_DISPONIBLE': return 'Cerrada';
      default: return 'Pasado';
    }
  }
}
