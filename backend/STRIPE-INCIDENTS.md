# Stripe Incident Response

**30 segundos — ¿qué mirar primero?**

| Síntoma | Acción inmediata |
|---------|------------------|
| Pago OK en Stripe, nada en la app | `SELECT "caseState", "dischargeBody" FROM "Multa" WHERE id = '…';` + logs `Webhook processed` / `Webhook failed` |
| Webhook 400 en Stripe Dashboard | Render → `STRIPE_WEBHOOK_SECRET` ≠ signing secret del endpoint → **Restart** |
| Checkout 503 | Health → `checks.stripe`; Render → `APP_MODE=production`, `STRIPE_SECRET_KEY` |
| Usuario “cargando” post-pago | `GET /api/multa/:id/state` — esperar `DISCHARGE_READY`; hard refresh |

Evento clave: **`checkout.session.completed`** (modo `payment`, descargo).  
Ruta webhook: **`POST /api/billing/webhook`**

Estados válidos (`Multa.caseState`):  
`CREATED → ANALYZED → PAYMENT_PENDING → PAID → DISCHARGE_READY → DISCHARGED`  
(No existe `descargo_pagado`.)

---

## Webhook signature verification failed

**Síntoma:** Stripe muestra entregas **400**; logs Render: `signature_verification`, `Webhook Error:` o `stripe_webhook_missing_signature`.

**Fix (≈2 min):**

1. [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks) → tu endpoint de prod/test.
2. Copiar **Signing secret** (`whsec_…`). Debe ser el del **mismo modo** (test vs live) que las keys del API.
3. Render → Environment → `STRIPE_WEBHOOK_SECRET` → pegar → **Save**.
4. **Manual Restart** del servicio.
5. Stripe → endpoint → **Send test webhook** → `checkout.session.completed`.
6. Logs: buscar `stripe_webhook_signature_ok` y `Webhook processed`.

**Errores frecuentes:**

- Secret del `stripe listen` local en prod.
- Endpoint apunta a URL vieja o sin `/api/billing/webhook`.
- Body parseado como JSON (en este repo el raw body va **antes** de `express.json()` — no cambiar orden en `app.js`).

---

## Payment succeeded but no report generated

**Síntoma:** Cobro OK en Stripe; usuario sin informe; `dischargeBody` vacío.

**Diagnóstico (SQL):**

```sql
SELECT id, "caseState", "stripeCheckoutSessionId", "stripePaymentIntentId",
       "tracePaidAt", "traceReportAt", length("dischargeBody") AS report_len
FROM "Multa"
WHERE id = '<MULTA_ID>';
```

**Inbox / cola:**

```sql
SELECT id, "eventType", status, attempts, "lastError", "receivedAt", "processedAt"
FROM "StripeWebhookInbox"
WHERE id = '<stripe_event_id>'
   OR payload::text LIKE '%<MULTA_ID>%'
ORDER BY "receivedAt" DESC
LIMIT 10;
```

**Fix:**

1. Render env:
   - `APP_MODE=production`
   - `FEATURE_ENABLE_REPORT_GENERATION=true`
   - `STRIPE_SECRET_KEY` set (worker async lo usa además del webhook secret)
2. Si `caseState` sigue en `PAYMENT_PENDING` o `PAID` sin `dischargeBody`:
   - Logs: `Webhook failed`, `FINALIZE_NOOP`, `FEATURE_REPORT_DISABLED`, `STRIPE_WEBHOOK_DEAD_LETTER`.
3. Informe v1 se genera con **`buildDischargeText`** (plantilla local). **No requiere OpenAI** salvo que hayas cambiado el pipeline.
4. **Reintentar:** Stripe Dashboard → evento → **Resend**; o **Restart** backend (re-encola inbox `pending`/`failed` al boot).
5. Health: `stripeWebhook.queue.pending` > 0 durante mucho tiempo → revisar logs del worker.

---

## User charged but can't see descargo

**Síntoma:** Stripe = paid; app en “loading” o sin botón de descarga.

**Fix (orden):**

1. API (con JWT del usuario):
   ```bash
   curl -s -H "Authorization: Bearer $TOKEN" \
     https://<api>/api/multa/<MULTA_ID>/state
   ```
   Esperado tras pago: `caseState` = `DISCHARGE_READY` o `DISCHARGED`, `dischargeAvailable: true`.

2. Contenido del informe:
   ```bash
   curl -s -H "Authorization: Bearer $TOKEN" \
     https://<api>/api/multa/<MULTA_ID>/discharge
   ```
   → campo `dischargeBody`.

3. Browser: hard refresh (`Ctrl+Shift+R`); volver con `/?resume=<MULTA_ID>&payment=success`.

4. SQL:
   ```sql
   SELECT id, "caseState", "tracePaidAt", "traceReportAt",
          left("dischargeBody", 80) AS preview
   FROM "Multa" WHERE id = '<MULTA_ID>';
   ```

5. Si `tracePaidAt` seteado pero `caseState` < `PAID`: webhook no finalizó → ver sección anterior + **Resend webhook** en Stripe.

---

## Stripe API key invalid / checkout fails

**Síntoma:** `POST /api/multa/:id/discharge-checkout` → **503** `"Stripe no configurado"` o `"No se pudo iniciar el pago"`; health `"stripe": "missing"`.

**Nota:** `/api/multa/analyze` **no** llama a Stripe. El error de keys aparece en **checkout**, no en analyze.

**Fix:**

1. Stripe Dashboard → [API keys](https://dashboard.stripe.com/apikeys) (mismo modo test/live que el frontend).
2. Render:
   - `STRIPE_SECRET_KEY` = `sk_test_…` o `sk_live_…`
   - `STRIPE_PUBLISHABLE_KEY` = `pk_…` (frontend/Vercel si aplica)
3. Restart servicio.
4. Verificar:
   ```bash
   curl -s https://<api>/api/health | jq '.checks.stripe'
   # "configured"
   ```

---

## Too many requests to Stripe (429)

**Síntoma:** Logs Stripe SDK rate limit; checkout intermitente.

**Fix:**

1. Normal: el SDK reintenta — esperar 1–2 min.
2. Persistente:
   - Buscar loops en `webhook.processor.js` / reintentos duplicados.
   - Revisar entregas webhook duplicadas en Stripe (idempotencia vía `StripeWebhookInbox` + `findProcessedWebhookEvent`).
   - No disparar load tests contra checkout en prod.

---

## Refund user manually

**Proceso:**

1. Stripe Dashboard → **Payments** → pago → **Refund**.
2. App (ajuste manual — no hay estado `REFUNDED` en v1):
   ```sql
   UPDATE "Multa"
   SET "caseState" = 'FAILED',
       "dischargeBody" = NULL,
       "stripePaymentIntentId" = NULL
   WHERE id = '<MULTA_ID>';
   ```
   Documentar en ticket; considerar borrar acceso al informe si ya se descargó.
3. Email al usuario con confirmación del reembolso.

---

## Webhook inbox stuck / backlog

**Síntoma:** Pagos viejos sin procesar; `StripeWebhookInbox.status` = `pending` o `failed`.

**Estado actual:** cola en memoria + tabla **`StripeWebhookInbox`** (idempotencia). No hay Redis queue externa.

**Fix:**

1. ```sql
   SELECT id, status, attempts, "lastError", "receivedAt"
   FROM "StripeWebhookInbox"
   WHERE status IN ('pending', 'failed', 'processing')
   ORDER BY "receivedAt" ASC
   LIMIT 20;
   ```
2. Corregir causa (`STRIPE_SECRET_KEY`, `FEATURE_ENABLE_REPORT_GENERATION`, error en `lastError`).
3. **Restart** servicio → `recoverPendingWebhooksFromDb()` re-encola al boot.
4. O Stripe → **Resend** el evento `checkout.session.completed` (seguro: idempotente por `event.id`).

Health útil: `GET /api/health` → `stripeWebhook.queue.pending`.

---

## Log grep cheat sheet (Render)

```
stripe_webhook_signature_ok
signature_verification
Webhook processed
Webhook failed
FINALIZE_DISCHARGE
STRIPE_WEBHOOK_DEAD_LETTER
Checkout no disponible
```

---

## Escalation

| Minutos | Acción |
|---------|--------|
| 0–2 | Health + SQL multa + Stripe webhook delivery log |
| 2–5 | Corregir env secret/key + restart |
| 5–15 | Resend webhook / revisar inbox |
| 15+ | Rollback deploy reciente (`git revert`) + refund manual si aplica |

Ver también: `PRODUCTION.md`, `docs/STRIPE-E2E-LOCAL.md`.
