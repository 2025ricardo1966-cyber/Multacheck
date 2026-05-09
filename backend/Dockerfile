FROM node:20-alpine

WORKDIR /app

# OpenSSL / compat para Prisma en Alpine
RUN apk add --no-cache openssl libc6-compat

# Dependencias (postinstall → prisma generate necesita carpeta prisma)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Código y compilación pipeline IA (TypeScript)
COPY . .
RUN npm run build:ai
RUN npx prisma generate

ENV NODE_ENV=production

EXPOSE 3000

# Migraciones y arranque (mantén prisma en node_modules: npm ci sin prune)
CMD ["sh", "-c", "npx prisma migrate deploy && exec npm start"]
