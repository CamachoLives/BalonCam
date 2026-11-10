# BalonCam - Frontend

Aplicación web desarrollada con **Angular 17** + **TailwindCSS**.

## Stack

- Angular 17 (Standalone Components)
- TailwindCSS 3
- RxJS 7
- TypeScript 5.2

## Desarrollo

```bash
npm install
ng serve
# Disponible en http://localhost:4200
```

## Build para producción

```bash
ng build
# Output en /dist/baloncam
```

## Estructura

```
src/app/
├── app.component.ts     # Componente raíz
├── app.config.ts        # Configuración Angular
├── app.routes.ts        # Rutas lazy-loaded
├── core/
│   ├── models/          # Interfaces TypeScript
│   └── services/        # Servicios HTTP
├── features/
│   ├── home/            # Landing page con mapa de canchas
│   ├── campo/           # Visualización dinámica del campo
│   └── reservas/        # Flujo de reserva (wizard)
└── shared/
    └── navbar/          # Barra de navegación
```

## Variables de entorno

Ajusta `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```
