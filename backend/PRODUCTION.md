# Production Runbook — MultaCheck API

Guía operativa para el backend en **Render** + PostgreSQL. Alineada al código actual del repo (no asumir contratos del README genérico).

## Deployment

### Render (API)

1. Push a `main` (o la rama conectada al servicio).
2. Render auto-deploys — verificar en [Render Dashboard](https://dashboard.render.com).
3. **Migraciones:** `render.yaml` ejecuta `npm ci && npm run build && npm run db:migrate` en cada build.
4. Health check del servicio: path `/api/health`.

**Variables obligatorias en Render** (ver `render.yaml`):

| Variable | Notas |
|----------|--------|
| `DATABASE_URL` | Desde Postgres `multacheck-db` |
| `JWT_SECRET` | Estable entre deploys |
| `FRONTEND_URL` | URL exacta del frontend (CORS + Stripe return URLs), sin `/` final |
| `STRIPE_SECRET_KEY` | Modo test: `sk_test_…`; live: `sk_live_…` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_…` / `pk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` del endpoint en Stripe Dashboard |
| `SENTRY_DSN` | Opcional; alertas de crashes |
| `APP_MODE` | `production` (habilita checkout + informe post-pago) |
| `NODE_ENV` | `production` |

**Stripe webhook (Dashboard):**

- URL: `https://<tu-api>.onrender.com/api/billing/webhook`
- Evento mínimo: `checkout.session.completed`

### Vercel (frontend)

Ver `frontend/DEPLOYMENT.md`. El API no se despliega en Vercel.

---

## Monitoring

### Health check

```bash
curl -s https://<tu-api>.onrender.com/api/health | jq .
```

Respuesta esperada (HTTP **200**):

```json
{
  "ok": true,
  "status": "healthy",
  "checks": {
    "server": "ok",
    "database": "ok",
    "stripe": "configured",
    "ai": "javascript"
  },
  "stripeWebhook": {
    "path": "/api/billing/webhook",
    "readiness": "ready"
  }
}
```

- HTTP **503** + `"status": "unhealthy"` → DB caída o inaccesible.
- `"stripe": "missing"` → falta `STRIPE_SECRET_KEY`.
- `"readiness": "misconfigured"` → falta `STRIPE_WEBHOOK_SECRET`.

Smoke rápido local/staging:

```bash
cd backend
./scripts/smoke-go-live.ps1 -ApiBase "https://<tu-api>.onrender.com/api" -FrontendUrl "https://<tu-app>.vercel.app"
```

### Logs

| Fuente | Dónde |
|--------|--------|
| **Render** | Dashboard → servicio `multacheck-api` → **Logs** (stdout via pino) |
| **Sentry** | [sentry.io](https://sentry.io) → proyecto Node.js (si `SENTRY_DSN` está seteado) |
| **Stripe webhooks** | [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks) → endpoint → **Event deliveries** |
| **Load tests** | `artillery run backend/load-test-health.yml -e production` |

No hay logs en disco en Render (`logs/app-*.log` no aplica en producción).

### Alertas recomendadas

1. **Sentry:** regla *An issue is first seen* → email.
2. **Stripe:** revisar entregas `failed` en el endpoint de webhook.
3. **Render:** health check en `/api/health`; alertas de deploy fallido.

### Webhook — líneas útiles en logs

- Éxito: `Webhook processed` (`stripeEventId`, `type`, `multaId`)
- Fallo: `Webhook failed` o `signature verification failed`
- Evento procesado: `checkout.session.completed` (no `charge.succeeded`)

---

## Database

### Backup (local o CI con `pg_dump`)

Desde `backend/`:

```bash
npm run backup
# Genera backend/backups/multacheck-YYYYMMDD-HHmmss.sql
```

Manual:

```bash
pg_dump -d "$DATABASE_URL" -F p --no-owner --no-acl -f backup-$(date +%Y%m%d).sql
```

En Render: usar **Backups** del Postgres managed o conectar con la connection string externa.

### Restore

```bash
psql -d "$DATABASE_URL" -f backup-YYYYMMDD.sql
```

### Consultas útiles

```sql
-- Usuario (password es bcrypt hash, columna "password")
SELECT id, email, "tenantId" FROM "User" LIMIT 5;

-- Cuota diaria (dateKey = YYYY-MM-DD UTC)
SELECT * FROM "UsageDaily" WHERE "dateKey" = to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');

-- Multas recientes
SELECT id, "caseState", "tenantId", "createdAt" FROM "Multa" ORDER BY "createdAt" DESC LIMIT 10;

-- Webhook inbox pendiente
SELECT "stripeEventId", status, "receivedAt" FROM "StripeWebhookInbox" WHERE status != 'processed' ORDER BY "receivedAt" DESC LIMIT 20;
```

---

## Common Issues

### 502 Bad Gateway (Render)

1. Logs de Render: crash en boot (`DATABASE_URL`, `JWT_SECRET` faltantes abortan el proceso).
2. Postgres sleeping (free tier): primer request puede tardar; reintentar health.
3. **Manual Restart:** Dashboard → servicio → **Restart**.

### Webhook no procesa pagos

1. `STRIPE_WEBHOOK_SECRET` en Render = el del endpoint en Stripe (no el de `stripe listen` local salvo que sea el mismo).
2. Endpoint activo apuntando a `/api/billing/webhook`.
3. `APP_MODE=production` y `FEATURE_ENABLE_REPORT_GENERATION=true`.
4. Logs: `Webhook failed`, `FINALIZE_NOOP`, cola `stripeWebhook.queue.pending`.
5. Tras reinicio, el boot re-encola inbox `pending`/`failed`.

### Checkout URL null / 503 en discharge

1. `APP_MODE=production` (no `soft_launch`).
2. `STRIPE_SECRET_KEY` configurada.
3. Flujo correcto: `POST /api/multa/analyze` → `POST /api/multa/:id/discharge-checkout` (no hay `checkoutUrl` en analyze).

### Usuarios no pueden login

1. `JWT_SECRET` seteado y **estable** (cambiarlo invalida tokens existentes).
2. Login requiere **`tenantSlug`** además de email/password.
3. Verificar tenant: `SELECT slug FROM "Tenant" WHERE id = '<tenantId>';`

### Cuota no se aplica

1. Middleware: `enforceAuthenticatedAnalyzeQuota` en `src/routes/index.js` (ruta `POST /multa/analyze` autenticada).
2. Tabla `UsageDaily` con `dateKey` UTC.
3. Límites en `src/plans/plan.config.js` (`dailyAnalyzeLimit` del plan free = 5).

### CORS en browser

1. `FRONTEND_URL` en Render = origen exacto del sitio Vercel (scheme + host, sin path).
2. Redeploy backend tras cambiar `FRONTEND_URL`.

### Rate limit 429 en smoke tests

- `authLimiter`: 5 req / 15 min / IP en login y register.
- `analyzeLimiter`: 10 / hora / usuario o IP.

---

## Incident Response

### API caída

1. Render Dashboard → estado del servicio y último deploy.
2. Postgres → conectividad y disco.
3. Manual Restart.
4. Si deploy reciente rompió: rollback (abajo).
5. Sentry / logs para stack trace.

### Pagos fallando

1. [Stripe Dashboard](https://dashboard.stripe.com) → errores API y webhook deliveries.
2. Render env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `APP_MODE`.
3. Health: `stripeWebhook.readiness` debe ser `ready`.
4. Comunicar a usuarios si el incidente es prolongado.

### Rollback

```bash
git revert HEAD
git push origin main
# Render y Vercel redeployan la versión anterior automáticamente
```

Rollback manual en Render: **Deploys** → deploy anterior → **Redeploy**.

---

## Pre-launch checklist

```bash
cd backend
npm run prelaunch          # env + migraciones + tests críticos
npm run test:stripe-e2e    # hasta URL checkout (keys Stripe test)
artillery run load-test-health.yml -e production
```

Ver también: `docs/STRIPE-E2E-LOCAL.md`, `docs/PROD-MIGRATE.md`, `load-test.yml`.
