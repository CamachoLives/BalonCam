# BalonCam en Cloudflare (gratis)

Versión del backend para correr en **Cloudflare Workers + D1** sin servidor propio ni costo.
Expone los mismos endpoints `/api/...` que el backend Spring Boot, así que el frontend Angular
funciona igual con cualquiera de los dos.

## Qué incluye

- Reservas con bloqueo temporal (token) para evitar que dos personas tomen el mismo horario.
- **Cancha completa vs. fútbol 5**: si se reserva la cancha principal, las subcanchas quedan
  ocupadas a esa hora, y al revés.
- **Medios de pago**: pago en línea (simulado en modo `demo`), transferencia Nequi con envío del
  comprobante por WhatsApp, o pago en la cancha. Anticipo configurable (%).
- **Panel `/admin`** (con PIN): reservas del día, recaudado y por cobrar, marcar pagada, cancelar,
  escribir al cliente por WhatsApp, cambiar precios/estado de canchas y ajustes del negocio
  (nombre, horario, anticipo, medios de pago, Nequi, WhatsApp).
- Hora de Colombia (UTC-5) para "hoy" y horarios pasados.

## Correr en tu PC

```bash
# 1) Frontend
cd frontend && npm install && npx ng build

# 2) Backend local con base de datos local
cd ../cloudflare && npm install
echo "ADMIN_PIN=1234" > .dev.vars
npm run db:local
npm run dev            # http://localhost:8787
```

Para desarrollar el frontend con recarga en vivo: deja `npm run dev` corriendo y en otra terminal
`cd frontend && npx ng serve` (http://localhost:4200, el `/api` se envía a 8787 con `proxy.conf.json`).

## Publicar en Cloudflare

```bash
cd cloudflare
npx wrangler login
npx wrangler d1 create baloncam-db          # copia el database_id en wrangler.jsonc
npx wrangler d1 execute baloncam-db --remote --file=schema.sql
npx wrangler d1 execute baloncam-db --remote --file=seed.sql
npx wrangler secret put ADMIN_PIN
cd ../frontend && npx ng build && cd ../cloudflare
npx wrangler deploy
```

Queda en `https://baloncam.<tu-subdominio>.workers.dev`. Todo dentro del plan gratis:
si se superan los límites diarios, Cloudflare responde con error hasta el día siguiente, no cobra.

## Pago en línea real

Hoy `pago_modo = demo` (no cobra nada). Para cobrar de verdad hay que conectar una pasarela
(Wompi, Mercado Pago o ePayco) con las llaves del negocio y confirmar el pago por webhook antes
de marcar la reserva como pagada.
