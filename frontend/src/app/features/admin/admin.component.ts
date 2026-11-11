import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, ResumenDia } from '../../core/services/admin.service';
import { ConfigService } from '../../core/services/config.service';
import { Cancha, TIPO_CANCHA_TEXTO } from '../../core/models/cancha.model';
import { MetodoPago, Reserva, METODOS_PAGO_INFO } from '../../core/models/reserva.model';
import { hoyColombia, sumarDias, formatHora, formatPesos, enlaceWhatsapp } from '../../core/utils/fecha';

type Pestana = 'reservas' | 'canchas' | 'ajustes';

interface Ajustes {
  negocio_nombre?: string;
  negocio_whatsapp?: string;
  hora_inicio?: number;
  hora_fin?: number;
  anticipo_porcentaje?: number;
  dias_anticipacion?: number;
  nequi_numero?: string;
  nequi_titular?: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen py-8 px-4">
      <div class="max-w-4xl mx-auto">

        @if (!admin.pin()) {
          <div class="card max-w-sm mx-auto mt-10">
            <h1 class="text-2xl font-black text-white">Panel del administrador</h1>
            <p class="text-white/50 text-sm mt-1 mb-5">Ingresa tu PIN para ver las reservas y cambiar la configuración.</p>
            <form (ngSubmit)="entrar()">
              <label for="pin" class="text-white/60 text-sm font-medium block mb-1.5">PIN</label>
              <input id="pin" name="pin" type="password" inputmode="numeric" autocomplete="current-password"
                     class="input-field text-center text-2xl tracking-[0.5em]" [(ngModel)]="pinIngresado" maxlength="12" />
              @if (errorPin()) { <p class="text-red-300 text-sm mt-2">{{ errorPin() }}</p> }
              <button type="submit" class="btn-primary w-full mt-4" [disabled]="!pinIngresado || entrando()">
                {{ entrando() ? 'Verificando...' : 'Entrar' }}
              </button>
            </form>
          </div>
        } @else {
          <div class="flex items-center justify-between gap-3 mb-6">
            <div>
              <h1 class="text-2xl sm:text-3xl font-black text-white">Panel del administrador</h1>
              <p class="text-white/50 text-sm">{{ configService.config()?.negocioNombre }}</p>
            </div>
            <button class="btn-secondary text-sm py-2 px-4" (click)="salir()">Salir</button>
          </div>

          <div class="flex gap-2 mb-6 overflow-x-auto" role="tablist">
            @for (t of pestanas; track t.id) {
              <button role="tab" [attr.aria-selected]="pestana() === t.id"
                      class="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
                      [class]="pestana() === t.id ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'"
                      (click)="cambiarPestana(t.id)">{{ t.label }}</button>
            }
          </div>

          @if (mensaje()) {
            <div class="mb-4 rounded-xl p-3 text-sm" [class]="mensajeError() ? 'bg-red-900/30 border border-red-500/30 text-red-200' : 'bg-emerald-900/30 border border-emerald-500/30 text-emerald-200'">
              {{ mensaje() }}
            </div>
          }

          <!-- RESERVAS -->
          @if (pestana() === 'reservas') {
            <div class="card mb-4 flex flex-wrap items-end gap-3">
              <div class="flex-1 min-w-[180px]">
                <label for="fecha-admin" class="text-white/60 text-sm font-medium block mb-1.5">Día</label>
                <input id="fecha-admin" type="date" class="input-field" [(ngModel)]="fecha" (ngModelChange)="cargarReservas()" />
              </div>
              <button class="btn-secondary py-3 px-4 text-sm" (click)="moverDia(-1)" aria-label="Día anterior">←</button>
              <button class="btn-secondary py-3 px-4 text-sm" (click)="irHoy()">Hoy</button>
              <button class="btn-secondary py-3 px-4 text-sm" (click)="moverDia(1)" aria-label="Día siguiente">→</button>
            </div>

            @if (dia(); as d) {
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div class="card py-4"><p class="text-white/50 text-xs">Reservas</p><p class="text-2xl font-black text-white">{{ d.resumen.reservas }}</p></div>
                <div class="card py-4"><p class="text-white/50 text-xs">Total del día</p><p class="text-2xl font-black text-white">{{ pesos(d.resumen.totalDia) }}</p></div>
                <div class="card py-4"><p class="text-white/50 text-xs">Recaudado</p><p class="text-2xl font-black text-emerald-400">{{ pesos(d.resumen.recaudado) }}</p></div>
                <div class="card py-4"><p class="text-white/50 text-xs">Por cobrar</p><p class="text-2xl font-black text-amber-300">{{ pesos(d.resumen.porCobrar) }}</p></div>
              </div>

              @if (!d.reservas.length) {
                <div class="card text-center text-white/50 py-10">No hay reservas para este día.</div>
              }
              <div class="space-y-3">
                @for (r of d.reservas; track r.id) {
                  <div class="card py-4" [class.opacity-50]="r.estado === 'CANCELADA'">
                    <div class="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p class="text-white font-bold">{{ hora(r.horaInicio) }} – {{ hora(r.horaFin) }} · {{ r.canchaNombre }}</p>
                        <p class="text-white/70 text-sm">{{ r.clienteNombre }} · {{ r.clienteTelefono }}</p>
                        <p class="text-white/40 text-xs mt-1">Código {{ r.token.slice(0, 8).toUpperCase() }} · {{ infoPago[r.metodoPago].titulo || r.metodoPago }}</p>
                      </div>
                      <div class="text-right">
                        <p class="text-white font-semibold">{{ pesos(r.valorTotal) }}</p>
                        @if (r.estado === 'CANCELADA') {
                          <span class="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">Cancelada</span>
                        } @else {
                          <span class="text-xs px-2 py-0.5 rounded-full"
                                [class]="r.estadoPago === 'PAGADO' ? 'bg-emerald-500/20 text-emerald-300' : r.estadoPago === 'ANTICIPO' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'">
                            {{ r.estadoPago === 'PAGADO' ? 'Pagado' : r.estadoPago === 'ANTICIPO' ? 'Anticipo ' + pesos(r.valorPagado) : 'Pago pendiente' }}
                          </span>
                        }
                      </div>
                    </div>
                    @if (r.estado !== 'CANCELADA') {
                      <div class="flex flex-wrap gap-2 mt-3">
                        @if (r.estadoPago !== 'PAGADO') {
                          <button class="btn-primary text-xs py-2 px-3" [disabled]="ocupado() === r.id" (click)="accion(r, 'MARCAR_PAGADA')">Marcar pagada</button>
                        }
                        <a class="btn-secondary text-xs py-2 px-3" target="_blank" rel="noopener" [href]="whatsCliente(r)">WhatsApp al cliente</a>
                        <button class="btn-secondary text-xs py-2 px-3 text-red-300" [disabled]="ocupado() === r.id" (click)="accion(r, 'CANCELAR')">Cancelar</button>
                      </div>
                    }
                  </div>
                }
              </div>
            } @else {
              <div class="text-center text-white/40 py-10">Cargando...</div>
            }
          }

          <!-- CANCHAS -->
          @if (pestana() === 'canchas') {
            <p class="text-white/50 text-sm mb-4">Cambia nombres, precios o pon una cancha en mantenimiento. Los cambios se ven de inmediato en la página de reservas.</p>
            <div class="space-y-3">
              @for (c of canchas(); track c.id) {
                <div class="card py-4">
                  <div class="flex items-center justify-between gap-3 mb-3">
                    <p class="text-white font-bold">{{ tipoTexto[c.tipo] }}@if (c.canchaPadre) { · dentro de {{ c.canchaPadre.nombre }} }</p>
                  </div>
                  <div class="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label class="text-white/60 text-xs block mb-1" [for]="'n'+c.id">Nombre</label>
                      <input class="input-field py-2" [id]="'n'+c.id" [(ngModel)]="c.nombre" />
                    </div>
                    <div>
                      <label class="text-white/60 text-xs block mb-1" [for]="'p'+c.id">Precio por hora</label>
                      <input class="input-field py-2" [id]="'p'+c.id" type="number" min="0" step="1000" [(ngModel)]="c.precioPorHora" />
                    </div>
                    <div>
                      <label class="text-white/60 text-xs block mb-1" [for]="'e'+c.id">Estado</label>
                      <select class="input-field py-2" [id]="'e'+c.id" [(ngModel)]="c.estado">
                        <option value="ACTIVA" class="text-gray-900">Activa</option>
                        <option value="MANTENIMIENTO" class="text-gray-900">En mantenimiento</option>
                        <option value="INACTIVA" class="text-gray-900">Oculta</option>
                      </select>
                    </div>
                  </div>
                  <div class="mt-3">
                    <label class="text-white/60 text-xs block mb-1" [for]="'d'+c.id">Descripción</label>
                    <input class="input-field py-2" [id]="'d'+c.id" [(ngModel)]="c.descripcion" />
                  </div>
                  <button class="btn-primary text-sm py-2 px-4 mt-3" [disabled]="ocupado() === c.id" (click)="guardarCancha(c)">Guardar</button>
                </div>
              }
            </div>
          }

          <!-- AJUSTES -->
          @if (pestana() === 'ajustes') {
            <div class="card space-y-4">
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label for="cfg-nombre" class="text-white/60 text-sm block mb-1.5">Nombre del negocio</label>
                  <input id="cfg-nombre" class="input-field" [(ngModel)]="ajustes.negocio_nombre" />
                </div>
                <div>
                  <label for="cfg-wa" class="text-white/60 text-sm block mb-1.5">WhatsApp del encargado (con 57)</label>
                  <input id="cfg-wa" class="input-field" inputmode="tel" [(ngModel)]="ajustes.negocio_whatsapp" />
                </div>
                <div>
                  <label for="cfg-hi" class="text-white/60 text-sm block mb-1.5">Abre a las (0-23)</label>
                  <input id="cfg-hi" class="input-field" type="number" min="0" max="23" [(ngModel)]="ajustes.hora_inicio" />
                </div>
                <div>
                  <label for="cfg-hf" class="text-white/60 text-sm block mb-1.5">Cierra a las (1-24)</label>
                  <input id="cfg-hf" class="input-field" type="number" min="1" max="24" [(ngModel)]="ajustes.hora_fin" />
                </div>
                <div>
                  <label for="cfg-ant" class="text-white/60 text-sm block mb-1.5">Anticipo al pagar en línea (%)</label>
                  <input id="cfg-ant" class="input-field" type="number" min="0" max="100" [(ngModel)]="ajustes.anticipo_porcentaje" />
                </div>
                <div>
                  <label for="cfg-dias" class="text-white/60 text-sm block mb-1.5">Se puede reservar con (días de anticipación)</label>
                  <input id="cfg-dias" class="input-field" type="number" min="1" max="365" [(ngModel)]="ajustes.dias_anticipacion" />
                </div>
                <div>
                  <label for="cfg-nq" class="text-white/60 text-sm block mb-1.5">Número Nequi</label>
                  <input id="cfg-nq" class="input-field" inputmode="tel" [(ngModel)]="ajustes.nequi_numero" />
                </div>
                <div>
                  <label for="cfg-nqt" class="text-white/60 text-sm block mb-1.5">Titular de Nequi</label>
                  <input id="cfg-nqt" class="input-field" [(ngModel)]="ajustes.nequi_titular" />
                </div>
              </div>
              <fieldset>
                <legend class="text-white/60 text-sm mb-2">Medios de pago que aceptas</legend>
                <div class="flex flex-wrap gap-3">
                  @for (m of todosMetodos; track m) {
                    <label class="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white cursor-pointer">
                      <input type="checkbox" [checked]="metodosSel().includes(m)" (change)="toggleMetodo(m)" />
                      {{ infoPago[m].icono }} {{ infoPago[m].titulo }}
                    </label>
                  }
                </div>
              </fieldset>
              <button class="btn-primary" [disabled]="guardando()" (click)="guardarAjustes()">{{ guardando() ? 'Guardando...' : 'Guardar ajustes' }}</button>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class AdminComponent implements OnInit {
  admin = inject(AdminService);
  configService = inject(ConfigService);

  readonly tipoTexto = TIPO_CANCHA_TEXTO;
  readonly infoPago = METODOS_PAGO_INFO;
  readonly todosMetodos: MetodoPago[] = ['EN_LINEA', 'NEQUI', 'EN_CANCHA'];
  readonly pestanas: { id: Pestana; label: string }[] = [
    { id: 'reservas', label: '📅 Reservas' },
    { id: 'canchas', label: '🏟️ Canchas y precios' },
    { id: 'ajustes', label: '⚙️ Ajustes' },
  ];

  pinIngresado = '';
  entrando = signal(false);
  errorPin = signal<string | null>(null);
  pestana = signal<Pestana>('reservas');
  fecha = hoyColombia();
  dia = signal<ResumenDia | null>(null);
  canchas = signal<Cancha[]>([]);
  ocupado = signal<number | null>(null);
  guardando = signal(false);
  mensaje = signal<string | null>(null);
  mensajeError = signal(false);
  metodosSel = signal<MetodoPago[]>([]);
  ajustes: Ajustes = {};

  ngOnInit() {
    this.configService.cargar().subscribe({ error: () => {} });
    if (this.admin.pin()) this.cargarReservas();
  }

  entrar() {
    this.entrando.set(true);
    this.errorPin.set(null);
    this.admin.entrar(this.pinIngresado).subscribe({
      next: () => { this.admin.guardarPin(this.pinIngresado); this.entrando.set(false); this.cargarReservas(); },
      error: (e) => { this.entrando.set(false); this.errorPin.set(e.status === 401 ? 'PIN incorrecto.' : 'No se pudo verificar. Intenta de nuevo.'); },
    });
  }

  salir() {
    this.admin.guardarPin(null);
    this.pinIngresado = '';
  }

  private manejarError(e: any) {
    if (e.status === 401) { this.salir(); return; }
    this.avisar(e.error?.mensaje || 'No se pudo completar la acción.', true);
  }

  private avisar(texto: string, error = false) {
    this.mensaje.set(texto);
    this.mensajeError.set(error);
    setTimeout(() => this.mensaje.set(null), 3500);
  }

  cambiarPestana(p: Pestana) {
    this.pestana.set(p);
    if (p === 'reservas') this.cargarReservas();
    if (p === 'canchas') this.admin.canchas().subscribe({ next: (c) => this.canchas.set(c), error: (e) => this.manejarError(e) });
    if (p === 'ajustes') this.admin.config().subscribe({
      next: (c) => {
        this.ajustes = {
          negocio_nombre: c.negocioNombre, negocio_whatsapp: c.negocioWhatsapp, hora_inicio: c.horaInicio, hora_fin: c.horaFin,
          anticipo_porcentaje: c.anticipoPorcentaje, dias_anticipacion: c.diasAnticipacion, nequi_numero: c.nequiNumero, nequi_titular: c.nequiTitular,
        };
        this.metodosSel.set([...c.metodosPago]);
      },
      error: (e) => this.manejarError(e),
    });
  }

  cargarReservas() {
    this.dia.set(null);
    this.admin.reservas(this.fecha).subscribe({ next: (d) => this.dia.set(d), error: (e) => this.manejarError(e) });
  }

  moverDia(n: number) { this.fecha = sumarDias(this.fecha, n); this.cargarReservas(); }
  irHoy() { this.fecha = hoyColombia(); this.cargarReservas(); }

  accion(r: Reserva, accion: 'MARCAR_PAGADA' | 'CANCELAR') {
    this.ocupado.set(r.id);
    this.admin.accionReserva(r.id, accion).subscribe({
      next: () => { this.ocupado.set(null); this.avisar(accion === 'CANCELAR' ? 'Reserva cancelada. El horario quedó libre.' : 'Pago registrado.'); this.cargarReservas(); },
      error: (e) => { this.ocupado.set(null); this.manejarError(e); },
    });
  }

  guardarCancha(c: Cancha) {
    this.ocupado.set(c.id);
    this.admin.guardarCancha(c.id, { nombre: c.nombre, descripcion: c.descripcion, precioPorHora: Number(c.precioPorHora), estado: c.estado }).subscribe({
      next: () => { this.ocupado.set(null); this.avisar(`"${c.nombre}" guardada.`); },
      error: (e) => { this.ocupado.set(null); this.manejarError(e); },
    });
  }

  toggleMetodo(m: MetodoPago) {
    const s = this.metodosSel();
    this.metodosSel.set(s.includes(m) ? s.filter((x) => x !== m) : [...s, m]);
  }

  guardarAjustes() {
    if (!this.metodosSel().length) { this.avisar('Deja al menos un medio de pago activo.', true); return; }
    this.guardando.set(true);
    const datos: Record<string, unknown> = { ...this.ajustes, metodos_pago: this.metodosSel() };
    for (const k of ['hora_inicio', 'hora_fin', 'anticipo_porcentaje', 'dias_anticipacion']) {
      if (datos[k] !== undefined && datos[k] !== null) datos[k] = String(datos[k]);
    }
    this.admin.guardarConfig(datos).subscribe({
      next: (c) => { this.guardando.set(false); this.configService.config.set(c); this.avisar('Ajustes guardados.'); },
      error: (e) => { this.guardando.set(false); this.manejarError(e); },
    });
  }

  whatsCliente(r: Reserva) {
    const tel = r.clienteTelefono.replace(/\D/g, '');
    const numero = tel.length === 10 ? '57' + tel : tel;
    return enlaceWhatsapp(numero, `Hola ${r.clienteNombre}, te escribimos por tu reserva de ${r.canchaNombre} el ${r.fecha} a las ${formatHora(r.horaInicio)}.`);
  }

  hora(h?: string | null) { return formatHora(h); }
  pesos(v?: number | null) { return formatPesos(v); }
}
