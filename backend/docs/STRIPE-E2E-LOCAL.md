# Stripe — prueba E2E local (pago por informe de descargo)

Flujo real del repo: **analyze** no devuelve `checkoutUrl`. El checkout es un paso aparte.

## Prerrequisitos

1. PostgreSQL + migraciones: `npm run db:migrate`
2. [Stripe CLI](https://stripe.com/docs/stripe-cli): `stripe login`
3. Terminal del forward (dejar abierta):

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

Copiá el `whsec_...` que imprime → `backend/.env`:

```env
APP_MODE=production
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

4. Backend:

```bash
cd backend
npm start
```

5. Health debe mostrar Stripe configurado:

```bash
curl -s http://localhost:3000/api/health | jq .checks.stripe
# "configured"
```

## Dónde se crea el Checkout (`grep`)

```text
src/billing/billing.controller.js     → suscripción Pro/Enterprise
src/multas/multa.service.js           → createMultaFlow (options.createCheckout, raro)
src/multas/multa.service.js           → createDischargeCheckoutFlow (flujo UI)
```

## Flujo API correcto (PowerShell)

Variables:

```powershell
$Base = "http://localhost:3000/api"
```

### 1. Register

```powershell
$reg = Invoke-RestMethod -Uri "$Base/auth/register" -Method Post -ContentType "application/json" -Body (@{
  email = "test-e2e@example.com"
  password = "Test123!"
  companyName = "Test Co"
  companySlug = "test-e2e"
} | ConvertTo-Json)
$TOKEN = $reg.token
$reg.user
```

### 2. Login

```powershell
$login = Invoke-RestMethod -Uri "$Base/auth/login" -Method Post -ContentType "application/json" -Body (@{
  email = "test-e2e@example.com"
  password = "Test123!"
  tenantSlug = "test-e2e"
} | ConvertTo-Json)
$TOKEN = $login.token
```

### 3. Analyze (no incluye URL de pago)

```powershell
$analyze = Invoke-RestMethod -Uri "$Base/multa/analyze" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $TOKEN" } -Body (@{
  country = "AR"
  type = "transito"
  description = "Me multaron por estacionar mal"
} | ConvertTo-Json)
$multaId = $analyze.data.multaId
$analyze.data.trafficLight
```

### 4. Crear sesión Stripe (descargo)

```powershell
$checkout = Invoke-RestMethod -Uri "$Base/multa/$multaId/discharge-checkout" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $TOKEN" } -Body "{}"
$checkout.url
```

Abrí `$checkout.url` en el navegador. Tarjeta de prueba: `4242 4242 4242 4242`, cualquier fecha futura, CVC `123`.

### 5. Webhook

En la terminal de `stripe listen` debe aparecer `checkout.session.completed`.

Requisitos en servidor:

- `APP_MODE=production` (o `FEATURE_ENABLE_REPORT_GENERATION=true`)
- `STRIPE_SECRET_KEY` definido (el worker async lo usa además del webhook secret)

### 6. Verificar estado e informe

```powershell
Invoke-RestMethod -Uri "$Base/multa/$multaId/state" -Headers @{ Authorization = "Bearer $TOKEN" }
# caseState: DISCHARGE_READY o DISCHARGED

Invoke-RestMethod -Uri "$Base/multa/$multaId/discharge" -Headers @{ Authorization = "Bearer $TOKEN" }
# dischargeBody: texto del informe
```

**No existe** `GET /api/multas` en este repo. Usá `/multa/:id/state` y `/multa/:id/discharge`.

## Script automatizado (hasta URL de checkout)

```bash
cd backend
npm run test:stripe-e2e
# Pagar en el browser cuando imprima la URL
npm run test:stripe-e2e -- --wait
```

## Errores frecuentes

| Síntoma | Causa |
|---------|--------|
| `Checkout no disponible en este entorno` | `APP_MODE=soft_launch` |
| `Stripe no configurado` | Falta `STRIPE_SECRET_KEY` |
| Webhook 400 signature | `STRIPE_WEBHOOK_SECRET` no coincide con `stripe listen` |
| Webhook OK pero sin informe | `FEATURE_ENABLE_REPORT_GENERATION` off o worker sin SDK |
| 429 en analyze | Cuota diaria free (5/día) — otro email/tenant o esperar UTC midnight |
| Pago OK, estado atascado | Reiniciar backend: `StripeWebhookInbox` re-encola `pending`/`failed` al boot |
