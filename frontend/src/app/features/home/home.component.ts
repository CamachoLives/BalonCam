import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CampoVisualComponent } from '../campo/campo-visual/campo-visual.component';
import { Cancha } from '../../core/models/cancha.model';
import { ConfigService } from '../../core/services/config.service';
import { hoyColombia, sumarDias } from '../../core/utils/fecha';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CampoVisualComponent],
  template: `
    <div class="min-h-screen">
      <!-- Hero Section -->
      <section class="relative pt-8 pb-12 px-4 sm:px-6 overflow-hidden">
        <!-- Fondo decorativo -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        <div class="max-w-7xl mx-auto relative">
          <!-- Título hero -->
          <div class="text-center mb-10" data-anim="slideUp">
            <span class="inline-block bg-emerald-500/20 text-emerald-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-emerald-500/30">
              ⚡ Reserva en segundos, sin llamadas
            </span>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
              Tu Cancha,
              <span class="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                Tu Momento
              </span>
            </h1>
            <p class="text-white/60 text-lg mt-4 max-w-xl mx-auto">
              Escoge tu horario, reserva tu espacio y llega a jugar.
              Disponibilidad en tiempo real, sin complicaciones.
            </p>
            <div class="flex flex-wrap gap-3 justify-center mt-6">
              <button class="btn-primary text-base" (click)="irAReservar()">
                Reservar Ahora →
              </button>
              <button class="btn-secondary text-base" (click)="scrollAlMapa()">
                Ver Disponibilidad
              </button>
            </div>
          </div>

          <!-- Stats rápidas -->
          <div class="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-10">
            @for (stat of stats(); track stat.label) {
              <div class="card text-center py-4" data-anim="slideUp">
                <p class="text-2xl font-black text-emerald-400">{{ stat.value }}</p>
                <p class="text-white/50 text-xs mt-0.5">{{ stat.label }}</p>
              </div>
            }
          </div>

          <!-- Selector de fecha -->
          <div class="card max-w-sm mx-auto mb-6" id="mapa">
            <label class="text-white/60 text-sm font-medium block mb-2">
              📅 Selecciona la fecha
            </label>
            <input type="date"
                   class="input-field"
                   [value]="fechaSeleccionada()"
                   [min]="hoy"
                   [max]="fechaMax()"
                   aria-label="Fecha de la reserva"
                   (change)="cambiarFecha($event)" />
          </div>

          <!-- Mapa de canchas -->
          <div class="max-w-4xl mx-auto">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-white">Mapa de Canchas</h2>
              <span class="text-white/40 text-sm capitalize">{{ fechaSeleccionada() | date:'EEEE d MMM':'':'es' }}</span>
            </div>

            <app-campo-visual
              [fecha]="fechaSeleccionada()"
              (canchaSeleccionada)="onCanchaSeleccionada($event)" />
          </div>

          <!-- Features -->
          <div class="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-12">
            @for (f of features; track f.titulo) {
              <div class="card hover:border-emerald-500/30 transition-all duration-300 hover:scale-105">
                <span class="text-3xl">{{ f.icono }}</span>
                <h3 class="text-white font-semibold mt-3 mb-1">{{ f.titulo }}</h3>
                <p class="text-white/50 text-sm">{{ f.desc }}</p>
              </div>
            }
          </div>
        </div>
      </section>
    </div>
  `,
})
export class HomeComponent implements OnInit {
  private router = inject(Router);
  private configService = inject(ConfigService);

  hoy = hoyColombia();
  fechaSeleccionada = signal<string>(this.hoy);
  config = this.configService.config;

  fechaMax = computed(() => sumarDias(this.hoy, this.config()?.diasAnticipacion ?? 30));
  stats = computed(() => {
    const c = this.config();
    const horas = c ? c.horaFin - c.horaInicio : 17;
    return [
      { value: '24/7', label: 'Reservas en línea' },
      { value: horas + 'h', label: 'Horario al día' },
      { value: '3', label: 'Pasos para reservar' },
    ];
  });

  ngOnInit() {
    this.configService.cargar().subscribe({ error: () => {} });
  }

  features = [
    { icono: '🔒', titulo: 'Sin cruces', desc: 'Cuando eliges un horario queda apartado para ti mientras confirmas. Nadie más lo puede tomar.' },
    { icono: '💳', titulo: 'Paga como quieras', desc: 'En línea, por Nequi o al llegar a la cancha. Sin llamadas ni esperas.' },
    { icono: '✅', titulo: 'Confirmación inmediata', desc: 'Recibe tu código de reserva al instante para presentar en cancha.' },
  ];

  cambiarFecha(event: Event) {
    const input = event.target as HTMLInputElement;
    this.fechaSeleccionada.set(input.value);
  }

  onCanchaSeleccionada(evt: { cancha: Cancha; fecha: string }) {
    this.router.navigate(['/reservar'], {
      queryParams: { canchaId: evt.cancha.id, fecha: evt.fecha }
    });
  }

  irAReservar() {
    this.router.navigate(['/reservar']);
  }

  scrollAlMapa() {
    document.getElementById('mapa')?.scrollIntoView({ behavior: 'smooth' });
  }
}

