import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NavbarComponent],
  template: `
    <app-navbar />
    <main class="min-h-screen">
      <router-outlet />
    </main>
    <footer class="border-t border-white/10 py-6 px-4 text-center text-white/40 text-xs">
      <p>Reservas en línea · Hecho por Cristian Camacho</p>
      <a routerLink="/admin" class="inline-block mt-2 text-white/50 hover:text-white underline">Panel del administrador</a>
    </footer>
  `,
})
export class AppComponent {}
