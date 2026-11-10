import { Component, OnInit, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Cancha } from '../../../core/models/cancha.model';
import { DisponibilidadSlot } from '../../../core/models/reserva.model';
import { CanchaService } from '../../../core/services/cancha.service';

export interface CanchaConEstado {
  cancha: Cancha;
  slots: DisponibilidadSlot[];
  estadoGeneral: 'disponible' | 'parcial' | 'ocupada' | 'inactiva';
  slotSeleccionado?: DisponibilidadSlot;
}

@Component({
  selector: 'app-campo-visual',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('pulseGlow', [
      state('disponible', style({ boxShadow: '0 0 20px rgba(52, 211, 153, 0.4)' })),
      state('ocupada', style({ boxShadow: '0 0 15px rgba(251, 146, 60, 0.3)' })),
      state('inactiva', style({ boxShadow: 'none' })),
      transition('* => *', animate('500ms ease'))
    ])
  ],
  template: `
    <div class="relative w-full" [@fadeIn]>
      <!-- Leyenda -->
      <div class="flex flex-wrap gap-4 mb-6 justify-center">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
          <span class="text-sm text-white/70">Disponible</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded bg-amber-500 shadow-lg shadow-amber-500/50"></div>
          <span class="text-sm text-white/70">Reservada</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded bg-orange-500 animate-pulse"></div>
          <span class="text-sm text-white/70">En proceso</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded bg-gray-600"></div>
          <span class="text-sm text-white/70">No disponible</span>
        </div>
      </div>

      <!-- Campo principal: Fútbol 11 -->
      @if (canchaPrincipal()) {
        <div class="relative w-full rounded-2xl overflow-hidden shadow-2xl"
             style="aspect-ratio: 1.9/1; min-height: 240px;">

          <!-- Grass background con líneas del campo -->
          <div class="campo-grass absolute inset-0 flex items-center justify-center">
            <!-- Líneas del campo de fútbol -->
            <div class="absolute inset-0 opacity-20">
              <!-- Círculo central -->
              <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                          w-28 h-28 rounded-full border-2 border-white"></div>
              <!-- Punto central -->
              <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                          w-2 h-2 bg-white rounded-full"></div>
              <!-- Línea central vertical -->
              <div class="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white"></div>
              <!-- Área izquierda -->
              <div class="absolute top-1/4 left-0 h-1/2 w-1/4 border-r-2 border-white"></div>
              <!-- Área derecha -->
              <div class="absolute top-1/4 right-0 h-1/2 w-1/4 border-l-2 border-white"></div>
            </div>

            <!-- Label del campo grande -->
            <div class="absolute top-3 left-3 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 z-20">
              <p class="text-white/90 text-xs font-semibold uppercase tracking-wider">
                {{ canchaPrincipal()!.nombre }}
              </p>
              <p class="text-emerald-400 text-xs">Fútbol 11 · {{ canchaPrincipal()!.precioPorHora | currency:'COP':'symbol':'1.0-0' }}/hr</p>
            </div>

            <!-- Overlay de estado del campo grande si no hay subcanchas -->
            @if (!tieneSubcanchas()) {
              <div class="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
                   [class]="getOverlayClaseCampoGrande()"
                   (click)="seleccionarCanchaGrande()">
                <div class="text-center">
                  <span class="text-4xl">{{ getIconoCampoGrande() }}</span>
                  <p class="text-white font-bold text-lg mt-1">{{ canchaPrincipal()!.nombre }}</p>
                  <p class="text-white/80 text-sm">{{ getTextoEstadoCampoGrande() }}</p>
                </div>
              </div>
            }

            <!-- Subcanchas de fútbol 5 (divididas horizontalmente) -->
            @if (tieneSubcanchas()) {
              <div class="absolute inset-0 flex flex-col sm:flex-row gap-1 p-2 z-10">
                @for (item of subcanchasConEstado(); track item.cancha.id) {
                  <div class="flex-1 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden group border-2"
                       [@pulseGlow]="item.estadoGeneral"
                       [class]="getClaseSubcancha(item)"
                       (click)="seleccionarSubcancha(item)"
                       (mouseenter)="hoveredCancha = item.cancha.id"
                       (mouseleave)="hoveredCancha = null">

                    <!-- Grass interior sutil -->
                    <div class="absolute inset-0 opacity-30"
                         style="background: repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.05) 20px, rgba(0,0,0,0.05) 40px)">
                    </div>

                    <!-- Contenido del slot -->
                    <div class="absolute inset-0 flex flex-col items-center justify-center p-2">
                      <span class="text-2xl mb-1">{{ getIconoSubcancha(item) }}</span>
                      <p class="text-white font-bold text-sm text-center leading-tight">
                        {{ item.cancha.nombre }}
                      </p>
                      <p class="text-white/70 text-xs text-center mt-0.5">Fútbol 5</p>
                      <div class="mt-2 px-2 py-0.5 rounded-full text-xs font-semibold"
                           [class]="getBadgeClaseSubcancha(item)">
                        {{ getTextoEstadoSubcancha(item) }}
                      </div>
                      <p class="text-white/60 text-xs mt-1">
                        {{ item.cancha.precioPorHora | currency:'COP':'symbol':'1.0-0' }}/hr
                      </p>
                    </div>

                    <!-- Hover effect -->
                    @if (hoveredCancha === item.cancha.id && item.estadoGeneral !== 'inactiva') {
                      <div class="absolute inset-0 bg-white/10 flex items-end justify-center pb-3" [@fadeIn]>
                        <span class="text-white text-xs font-medium bg-black/40 px-3 py-1 rounded-full">
                          Ver horarios →
                        </span>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Loading state -->
      @if (!canchaPrincipal() && !error()) {
        <div class="w-full rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"
             style="aspect-ratio: 1.9/1; min-height: 240px;">
          <div class="text-center">
            <div class="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3"></div>
            <p class="text-white/50">Cargando canchas...</p>
          </div>
        </div>
      }

      @if (error()) {
        <div class="w-full rounded-2xl bg-red-900/20 border border-red-500/30 flex items-center justify-center p-8"
             style="min-height: 200px;">
          <div class="text-center">
            <span class="text-4xl">⚠️</span>
            <p class="text-red-300 mt-2">{{ error() }}</p>
            <button class="btn-secondary mt-4 text-sm" (click)="cargar()">Reintentar</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class CampoVisualComponent implements OnInit {
  @Input() fecha: string = new Date().toISOString().split('T')[0];
  @Output() canchaSeleccionada = new EventEmitter<{ cancha: Cancha; fecha: string }>();

  private canchaService = inject(CanchaService);

  canchas = signal<Cancha[]>([]);
  disponibilidad = signal<Record<number, DisponibilidadSlot[]>>({});
  error = signal<string | null>(null);
  hoveredCancha: number | null = null;

  canchaPrincipal = computed(() => this.canchas().find(c => !c.canchaPadre) ?? null);
  subcanchas = computed(() => this.canchas().filter(c => !!c.canchaPadre));
  tieneSubcanchas = computed(() => this.subcanchas().length > 0);

  subcanchasConEstado = computed<CanchaConEstado[]>(() => {
    return this.subcanchas().map(cancha => {
      const slots = this.disponibilidad()[cancha.id] ?? [];
      return {
        cancha,
        slots,
        estadoGeneral: this.calcularEstadoGeneral(slots, cancha.estado)
      };
    });
  });

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.error.set(null);
    this.canchaService.listarTodas().subscribe({
      next: (canchas) => {
        this.canchas.set(canchas);
        this.cargarDisponibilidad();
      },
      error: (err) => {
        this.error.set('No se pudo conectar con el servidor. ¿Está el backend corriendo?');
        console.error(err);
      }
    });
  }

  cargarDisponibilidad() {
    this.canchaService.obtenerDisponibilidadTodas(this.fecha).subscribe({
      next: (disp) => this.disponibilidad.set(disp),
      error: () => {}
    });
  }

  private calcularEstadoGeneral(slots: DisponibilidadSlot[], estado: string): CanchaConEstado['estadoGeneral'] {
    if (estado !== 'ACTIVA') return 'inactiva';
    if (slots.length === 0) return 'disponible';
    const disponibles = slots.filter(s => s.estado === 'DISPONIBLE').length;
    const total = slots.length;
    if (disponibles === 0) return 'ocupada';
    if (disponibles < total) return 'parcial';
    return 'disponible';
  }

  getClaseSubcancha(item: CanchaConEstado): string {
    const base = 'shadow-xl';
    switch (item.estadoGeneral) {
      case 'disponible': return `${base} bg-emerald-900/60 border-emerald-400 hover:bg-emerald-800/70 hover:border-emerald-300 hover:scale-[1.02]`;
      case 'parcial': return `${base} bg-amber-900/60 border-amber-400 hover:bg-amber-800/70`;
      case 'ocupada': return `${base} bg-orange-900/50 border-orange-400/60`;
      case 'inactiva': return `${base} bg-gray-900/60 border-gray-600 cursor-not-allowed opacity-60`;
    }
  }

  getBadgeClaseSubcancha(item: CanchaConEstado): string {
    switch (item.estadoGeneral) {
      case 'disponible': return 'bg-emerald-500 text-white';
      case 'parcial': return 'bg-amber-500 text-white';
      case 'ocupada': return 'bg-orange-500 text-white';
      case 'inactiva': return 'bg-gray-600 text-gray-300';
    }
  }

  getTextoEstadoSubcancha(item: CanchaConEstado): string {
    const disp = item.slots.filter(s => s.estado === 'DISPONIBLE').length;
    switch (item.estadoGeneral) {
      case 'disponible': return `${disp} horarios libres`;
      case 'parcial': return `${disp} horarios libres`;
      case 'ocupada': return 'Sin horarios';
      case 'inactiva': return 'Cerrada';
    }
  }

  getIconoSubcancha(item: CanchaConEstado): string {
    switch (item.estadoGeneral) {
      case 'disponible': return '🟢';
      case 'parcial': return '🟡';
      case 'ocupada': return '🟠';
      case 'inactiva': return '⬜';
    }
  }

  getOverlayClaseCampoGrande(): string {
    return 'bg-emerald-900/50 hover:bg-emerald-800/60 border-2 border-emerald-400 transition-all duration-300';
  }

  getIconoCampoGrande(): string { return '⚽'; }

  getTextoEstadoCampoGrande(): string {
    const principal = this.canchaPrincipal();
    if (!principal) return '';
    const slots = this.disponibilidad()[principal.id] ?? [];
    const disp = slots.filter(s => s.estado === 'DISPONIBLE').length;
    return disp > 0 ? `${disp} horarios disponibles` : 'Sin horarios disponibles';
  }

  seleccionarSubcancha(item: CanchaConEstado) {
    if (item.estadoGeneral === 'inactiva') return;
    this.canchaSeleccionada.emit({ cancha: item.cancha, fecha: this.fecha });
  }

  seleccionarCanchaGrande() {
    const principal = this.canchaPrincipal();
    if (principal) {
      this.canchaSeleccionada.emit({ cancha: principal, fecha: this.fecha });
    }
  }
}
