# MultaCheck Backend

## Setup rápido

```bash
npm install
cp .env.example .env
# Edita .env con tus credenciales
npm run db:push
npm run db:seed
npm start
```

Para desarrollo local también podés usar `npm run dev` (equivale a `npm start`).

## Health / monitoreo

```bash
curl http://localhost:3000/api/health
```

Respuesta `200` + `status: healthy` si DB ok y Stripe definido (entre otros); `503` + `degraded` si falta algo crítico (p. ej. `STRIPE_SECRET_KEY` ausente).

## Variables críticas

- **DATABASE_URL**: conexión PostgreSQL (obligatoria).
- **JWT_SECRET**: obligatoria; usar valor largo y aleatorio en producción.
- **FRONTEND_URL**: origen del frontend para CORS en `app.js` (ej. `http://localhost:5173`). En algunos flujos se usa **CLIENT_ORIGIN** como alternativa.
- **STRIPE_SECRET_KEY** / **STRIPE_WEBHOOK_SECRET**: necesarias para checkout y webhooks de pago.
- **OPENAI_API_KEY**: si está definida y compilaste el pipeline (`npm run build:ai`), se intenta el pipeline TypeScript antes del motor JS.
- **AI_PROVIDER**: referencia en `.env.example`; el comportamiento efectivo del analizador depende de la versión del código (clave práctica: **OPENAI_API_KEY**).
- **SENTRY_DSN**: opcional; sin valor Sentry queda desactivado.

## Deploy

Un comando (tests críticos → migraciones → reinicio si configuraste PM2 o `DEPLOY_RESTART_CMD`):

```bash
npm run deploy
```

`DEPLOY_RESTART_CMD` (opcional en `.env`): comando shell para reiniciar el servicio en tu hosting si no usás `pm2 restart multacheck`.

Pasos manuales equivalentes:

```bash
npm run test:critical   # Requiere API ya levantada y STRIPE en servidor si probás checkout
npm run build:ai       # Solo si AI_PROVIDER=openai en .env (el script deploy lo hace solo en ese caso)
npm run db:migrate
npm start
```
