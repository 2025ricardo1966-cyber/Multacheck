import prisma from "../src/db/prisma.js";

const tenants = await prisma.tenant.count();
const users = await prisma.user.count();
const sampleTenant = await prisma.tenant.findFirst({ select: { id: true, slug: true, subscriptionTier: true } });
const sampleUser = await prisma.user.findFirst({ select: { id: true, email: true, tenantId: true } });

console.log(JSON.stringify({ tenants, users, sampleTenant, sampleUser }, null, 2));
await prisma.$disconnect();
