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

## Documentación OpenAPI (Swagger UI)

Con el servidor en marcha: [http://localhost:3000/api-docs](http://localhost:3000/api-docs) (puerto según `PORT`).

Producción: definí **`SWAGGER_PUBLIC_API_URL`** (ej. `https://tu-dominio.com/api`) para el servidor mostrado en el dropdown.

## Health / monitoreo

```bash
curl http://localhost:3000/api/health
```

Respuesta `200` + `status: healthy` si DB ok y Stripe definido (entre otros); `503` + `degraded` si falta algo crítico (p. ej. `STRIPE_SECRET_KEY` ausente).

Coste acumulado del pipeline OpenAI (requiere `ADMIN_DEBUG_SECRET` y cabecera `X-Admin-Debug-Token`):

```bash
curl -H "X-Admin-Debug-Token: TU_ADMIN_DEBUG_SECRET" http://localhost:3000/api/admin/ai-costs
```

Métricas de negocio (últimos 30 días por defecto; `?days=7` opcional):

```bash
curl -H "X-Admin-Debug-Token: TU_ADMIN_DEBUG_SECRET" "http://localhost:3000/api/admin/metrics?days=30"
```

Estado del cache Redis de análisis (`REDIS_URL` opcional):

```bash
curl -H "X-Admin-Debug-Token: TU_ADMIN_DEBUG_SECRET" http://localhost:3000/api/admin/cache-stats
```

## Variables críticas

- **DATABASE_URL**: conexión PostgreSQL (obligatoria).
- **JWT_SECRET**: obligatoria; usar valor largo y aleatorio en producción.
- **FRONTEND_URL**: origen del frontend para CORS en `app.js` (ej. `http://localhost:5173`). En algunos flujos se usa **CLIENT_ORIGIN** como alternativa.
- **STRIPE_SECRET_KEY** / **STRIPE_WEBHOOK_SECRET**: necesarias para checkout y webhooks de pago.
- **OPENAI_API_KEY**: si está definida y compilaste el pipeline (`npm run build:ai`), se intenta el pipeline TypeScript antes del motor JS.
- **AI_PROVIDER**: referencia en `.env.example`; el comportamiento efectivo del analizador depende de la versión del código (clave práctica: **OPENAI_API_KEY**).
- **SENTRY_DSN**: opcional; sin valor Sentry queda desactivado.
- **REDIS_URL**: opcional; si falta, no hay caché de resultados de análisis (menos ahorro en IA repetida).

## Deploy

Un comando (tests críticos → migraciones → reinicio si configuraste PM2 o `DEPLOY_RESTART_CMD`):

```bash
npm run deploy
```

Antes de deploy (checklist local + API arriba para tests):

```bash
npm run prelaunch
```

## Docker (PostgreSQL + API)

Desde esta carpeta (`backend`), con variables en `.env` (ver `.env.docker.example`):

```bash
docker compose --env-file .env up -d --build
docker compose logs -f backend
curl http://localhost:3000/api/health
```

La imagen ejecuta **`prisma migrate deploy`** antes de **`npm start`**. El servidor escucha en **`0.0.0.0`** dentro del contenedor (`LISTEN_HOST`). **Compose** levanta además **Postgres** y **Redis**; por defecto `REDIS_URL=redis://redis:6379` en el servicio `backend`.

Deploy **seguro**: mismo tipo de pasos previos (tests + IA opcional), reinicia el proceso y comprueba **`GET /api/health`** como **`healthy`**; si no, hace **`git reset --hard`** al commit guardado al inicio y vuelve a reiniciar.

```bash
npm run deploy:safe
```

Usá **`API_URL`** en `.env` si el health no es en `http://localhost:3000`. Si Stripe falta en el entorno, `/health` puede ir **`degraded`** (**503**) y disparará rollback aunque el servidor funcione.

`DEPLOY_RESTART_CMD` (opcional en `.env`): comando shell para reiniciar el servicio en tu hosting si no usás `pm2 restart multacheck`.

Pasos manuales equivalentes:

```bash
npm run test:critical   # Requiere API ya levantada y STRIPE en servidor si probás checkout
npm run build:ai       # Solo si AI_PROVIDER=openai en .env (el script deploy lo hace solo en ese caso)
npm run db:migrate
npm start
```
