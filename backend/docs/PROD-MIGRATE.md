# Migraciones en producción

## Deploy normal

```bash
npm run db:migrate   # prisma migrate deploy
```

Render lo ejecuta en `buildCommand` vía `render.yaml`.

## Migración fallida (P3009)

Si `migrate deploy` falla con una migración ya aplicada parcialmente (ej. `caseState` ya existe):

```bash
# Verificar que el cambio ya está en la DB
npx prisma migrate status

# Marcar como aplicada (solo si el schema ya coincide)
npx prisma migrate resolve --applied 20260208120000_multa_case_state

# Continuar
npm run db:migrate
```

**No usar `migrate resolve` a ciegas en prod** — confirmar columnas/tablas antes.

## Inbox webhook (obligatorio v1)

Migración `20260529120000_stripe_webhook_inbox` crea `StripeWebhookInbox`.
Sin ella, el webhook ACK falla al persistir.
