# ⚽ BalonCam - Sistema de Reservas de Canchas

Plataforma web moderna para reservar canchas de fútbol en línea. Sin llamadas, sin complicaciones — solo entra, escoge tu horario y juega.

## Características

- 🟢 **Disponibilidad en tiempo real** — verde disponible, amarillo apartada, gris sin servicio
- 🔒 **Reservas concurrentes protegidas** — sistema de bloqueo temporal con token
- 🏟️ **Vista interactiva del campo** — cancha grande (fútbol 11) dividible en 3 canchas pequeñas (fútbol 5)
- 📅 **Horarios 7 AM – 12 AM** con bloques configurables
- 📱 **Responsive y animado** — experiencia fluida en móvil y desktop

## Estructura del Proyecto

```
BalonCam/
├── backend/        # Spring Boot 3 + PostgreSQL
└── frontend/       # Angular 17 + TailwindCSS
```

## Requisitos

| Herramienta | Versión |
|-------------|---------|
| Java | 17+ |
| Maven | 3.8+ |
| Node.js | 18+ |
| npm | 9+ |
| PostgreSQL | 15+ |

## Inicio Rápido

### Base de datos
```sql
CREATE DATABASE baloncam;
CREATE USER baloncam_user WITH PASSWORD 'baloncam123';
GRANT ALL PRIVILEGES ON DATABASE baloncam TO baloncam_user;
```

### Backend
```bash
cd backend
mvn spring-boot:run
# API disponible en http://localhost:8080
```

### Frontend
```bash
cd frontend
npm install
ng serve
# App en http://localhost:4200
```

## Branches

| Branch | Propósito |
|--------|-----------|
| `main` | Producción estable |
| `develop` | Integración de features |
| `feature/backend` | Desarrollo del backend |
| `feature/frontend` | Desarrollo del frontend |

## API Principal

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/canchas` | Lista todas las canchas |
| GET | `/api/disponibilidad?fecha=YYYY-MM-DD` | Disponibilidad del día |
| POST | `/api/reservas/bloquear` | Bloquea un slot (devuelve token) |
| POST | `/api/reservas/confirmar` | Confirma reserva con token |
| GET | `/api/reservas/{token}` | Consulta reserva por token |
| DELETE | `/api/reservas/{token}` | Cancela reserva |

## Autor

**Christian Alexander Camacho** — BalonCam © 2026
