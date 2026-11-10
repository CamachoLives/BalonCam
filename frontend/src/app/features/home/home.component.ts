import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { CampoVisualComponent } from '../campo/campo-visual/campo-visual.component';
import { Cancha } from '../../core/models/cancha.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CampoVisualComponent],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(30px)', opacity: 0 }),
        animate('500ms 100ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ],
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
          <div class="text-center mb-10" [@slideUp]>
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
            @for (stat of stats; track stat.label) {
              <div class="card text-center py-4" [@slideUp]>
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
                   (change)="cambiarFecha($event)" />
          </div>

          <!-- Mapa de canchas -->
          <div class="max-w-4xl mx-auto">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-white">Mapa de Canchas</h2>
              <span class="text-white/40 text-sm">{{ fechaSeleccionada() | date:'EEEE d MMM':'':'es' }}</span>
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
export class HomeComponent {
  private router = inject(Router);

  fechaSeleccionada = signal<string>(new Date().toISOString().split('T')[0]);
  hoy = new Date().toISOString().split('T')[0];

  stats = [
    { value: '4', label: 'Canchas' },
    { value: '17h', label: 'Horarios' },
    { value: '5min', label: 'Reserva' },
  ];

  features = [
    { icono: '🔒', titulo: 'Sin conflictos', desc: 'Sistema de bloqueo inteligente: solo el primero en reservar obtiene el slot.' },
    { icono: '📱', titulo: 'Sin llamadas', desc: 'Todo desde tu teléfono o computador. Rápido y sin esperas.' },
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

