# BalonCam - Backend

API REST desarrollada con **Spring Boot 3** + **PostgreSQL**.

## Stack

- Java 17
- Spring Boot 3.2
- Spring Data JPA / Hibernate
- PostgreSQL 15
- Lombok
- Maven

## Configuración

Ajusta `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/baloncam
    username: baloncam_user
    password: baloncam123
```

## Correr el backend

```bash
mvn spring-boot:run
```

La API estará disponible en `http://localhost:8080`.

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/canchas` | Todas las canchas configuradas |
| GET | `/api/disponibilidad` | Slots del día con estados |
| POST | `/api/reservas/bloquear` | Bloquear slot (devuelve token 5min) |
| POST | `/api/reservas/confirmar` | Confirmar con token + datos cliente |
| GET | `/api/reservas/{token}` | Detalle de reserva |
| DELETE | `/api/reservas/{token}` | Cancelar reserva |

## Parámetros configurables

Desde `application.yml`:

```yaml
baloncam:
  horario:
    hora-inicio: 7       # hora de apertura
    hora-fin: 24         # hora de cierre (24 = medianoche)
    duracion-slot-minutos: 60
  bloqueo:
    duracion-minutos: 5  # tiempo para confirmar antes que expire el lock
```
