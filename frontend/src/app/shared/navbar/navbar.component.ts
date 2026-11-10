import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <a routerLink="/" class="flex items-center gap-3 group">
            <div class="w-9 h-9 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span class="text-lg">⚽</span>
            </div>
            <span class="font-bold text-xl text-white tracking-tight">
              Balon<span class="text-emerald-400">Cam</span>
            </span>
          </a>

          <!-- Nav links -->
          <div class="hidden md:flex items-center gap-6">
            <a routerLink="/" routerLinkActive="text-emerald-400 font-semibold"
               [routerLinkActiveOptions]="{exact: true}"
               class="text-white/70 hover:text-white transition-colors text-sm font-medium">
              Inicio
            </a>
            <a routerLink="/reservar" routerLinkActive="text-emerald-400 font-semibold"
               class="text-white/70 hover:text-white transition-colors text-sm font-medium">
              Reservar
            </a>
          </div>

          <!-- CTA button -->
          <a routerLink="/reservar"
             class="btn-primary text-sm py-2 px-4 shadow-emerald-500/20">
            ¡Reserva Ahora!
          </a>
        </div>
      </div>
    </nav>
    <!-- Spacer for fixed navbar -->
    <div class="h-16"></div>
  `,
})
export class NavbarComponent {}
