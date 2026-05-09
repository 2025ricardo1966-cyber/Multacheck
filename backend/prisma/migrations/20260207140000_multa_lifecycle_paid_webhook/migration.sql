-- Post-pago + informe: lifecycle unificado a `paid` (webhook real).
UPDATE "Multa"
SET "lifecycleState" = 'paid'
WHERE "paid" = true
  AND "paymentStatus" = 'paid'
  AND "lifecycleState" IN ('REPORT_READY', 'PAID_CONFIRMED');
