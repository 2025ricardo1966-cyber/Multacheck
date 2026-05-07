-- AlterTable
ALTER TABLE "Multa" ADD COLUMN "rawInput" TEXT;
ALTER TABLE "Multa" ADD COLUMN "label" TEXT;

UPDATE "Multa" SET "rawInput" = COALESCE("description", '') WHERE "rawInput" IS NULL;
UPDATE "Multa" SET "label" = CASE "trafficLight"
  WHEN 'GREEN' THEN 'Strong grounds for challenge'
  WHEN 'RED' THEN 'Payment likely required based on enforcement standards'
  ELSE 'Case-dependent legal outcome'
END WHERE "label" IS NULL AND "trafficLight" IS NOT NULL;
