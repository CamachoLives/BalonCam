import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'reservar',
    loadComponent: () => import('./features/reservas/booking-wizard/booking-wizard.component').then(m => m.BookingWizardComponent)
  },
  {
    path: 'reserva/:token',
    loadComponent: () => import('./features/reservas/confirmar-reserva/confirmar-reserva.component').then(m => m.ConfirmarReservaComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
