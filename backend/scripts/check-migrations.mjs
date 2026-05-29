import prisma from "../src/db/prisma.js";

const cols = await prisma.$queryRaw`
  SELECT column_name FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'Multa' AND column_name = 'caseState'
`;
const inbox = await prisma.$queryRaw`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'StripeWebhookInbox'
`;
const migrations = await prisma.$queryRaw`
  SELECT migration_name, finished_at, rolled_back_at, started_at
  FROM _prisma_migrations
  ORDER BY started_at DESC
  LIMIT 8
`;
console.log("caseState column:", cols);
console.log("StripeWebhookInbox table:", inbox);
console.log("recent migrations:", migrations);
await prisma.$disconnect();
