# MultaCheck — Starter kit

Monorepo liviano: **Node.js (Express)** + **React (Vite)** + **PostgreSQL (Prisma)**. Modo **SaaS multiusuario**: registro, login, **JWT**, roles `admin` | `user`, y persistencia de análisis (`Multa`) ligada al usuario.

La API vive bajo `/api`. En **desarrollo**, el frontend usa `/api` vía proxy de Vite; en **producción**, el build usa `VITE_API_URL`.

### Rutas públicas vs protegidas

| Públicas | Protegidas (Bearer JWT) |
|----------|-------------------------|
| `GET /api/health`, `GET /api/version`, `GET /api/plans` | `GET /api/auth/me`, `POST /api/auth/logout` |
| `POST /api/auth/register`, `POST /api/auth/login` | `POST /api/billing/checkout-session`, `POST /api/billing/portal-session` |
|  | `POST /api/multa/analyze`¹, `GET /api/multas` |

¹ `POST /api/multa/analyze` valida **cuota diaria** según plan (`FREE` / `PRO` / `ENTERPRISE`); los usuarios **admin** bypassean límites.

**Stripe webhook** (servidor): `POST /api/billing/webhook` — firma `Stripe-Signature`, body raw JSON.

- **user**: ve solo sus multas en `GET /api/multas`.
- **admin**: ve todas las multas (incluye email del usuario).

Los endpoints de dominio **no** deben consumirse sin token salvo los públicos anteriores (salvo webhook Stripe).

### Planes y límites (config central)

Definidos en `backend/src/plans/plan.config.js` (montos Stripe solo por variables `STRIPE_PRICE_*`). Contadores diarios en tabla `UsageDaily`; auditoría en `AuditLog`.

## Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL 14+ (local con Docker recomendado: `docker compose up -d` en la raíz del repo)

## Estructura

```
MultaCheck proyecto/
├── backend/           # Express + Prisma + JWT (API /api)
│   ├── prisma/        # schema, migraciones, seed
│   └── src/           # (incluye src/core JS de dominio tenant — no confundir con /core TS en raíz)
├── frontend/          # ÚNICO cliente web: Vite + React (puerto 5173)
├── core/              # Motor de análisis TypeScript (no es servidor UI)
├── scripts/           # Chequeos de contrato, smoke E2E motor
├── docker-compose.yml
├── render.yaml
├── DEV-RUN-MATRIX.md  # Matriz de terminales y frontend único
└── package.json       # npm run dev → backend + frontend
```

## Variables de entorno

### Backend (`backend/.env`)

| Variable        | Descripción |
|-----------------|-------------|
| `DATABASE_URL` | Cadena PostgreSQL (Prisma). Ej. con Docker de este repo: `postgresql://multacheck:multacheck@localhost:5432/multacheck?schema=public` |
| `JWT_SECRET`   | Secreto para firmar JWT (obligatorio). |
| `JWT_EXPIRES_IN` | Opcional, ej. `7d` (por defecto `7d`). |
| `PORT`          | Puerto HTTP (Render/Railway suelen inyectar `PORT` automáticamente). |
| `FRONTEND_URL`  | Origen **exacto** del frontend en producción (sin `/` final). Ej.: `https://tu-app.vercel.app`. CORS solo permite este origin; **no** uses `*`. También usado para URLs de retorno de Stripe Checkout / Portal. |
| `STRIPE_SECRET_KEY` | Secret key Stripe (servidor). |
| `STRIPE_WEBHOOK_SECRET` | Signing secret del endpoint webhook en Stripe Dashboard. |
| `STRIPE_PRICE_PRO` | Price ID (modo subscription) del plan Pro. |
| `STRIPE_PRICE_ENTERPRISE` | Price ID subscription Enterprise. |

### Stripe — webhook en producción

1. En Stripe Dashboard → Developers → Webhooks → Add endpoint:  
   **`https://<tu-api>/api/billing/webhook`**
2. Eventos recomendados: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
3. Copiá el **Signing secret** a `STRIPE_WEBHOOK_SECRET`.

Desarrollo local:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

### Frontend — desarrollo

No hace falta definir URL del backend: el cliente usa siempre la base `/api` y `vite.config.js` redirige a `http://localhost:3000`.

### Frontend — producción (build)

Definí **`VITE_API_URL`** en el panel del hosting **al construir** (Vercel/Netlify/CI). Debe ser la URL pública del backend **incluyendo** el prefijo `/api`, sin barra final.

Ejemplo: si el API público es `https://multacheck-api.onrender.com/api`, entonces:

```bash
VITE_API_URL=https://multacheck-api.onrender.com/api
```

Los servicios llaman rutas relativas tipo `/multa/analyze`; Axios concatena: `{VITE_API_URL}/multa/analyze`.

## Configuración local

1. Base de datos:
   ```bash
   docker compose up -d
   ```
2. Raíz: `npm install`
3. Backend:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```
   Completá `DATABASE_URL`, `JWT_SECRET` y (opcional) `FRONTEND_URL`.
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```
   Seed por defecto: `admin@multacheck.local` / `changeme` (sobreescribible con `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).
4. Frontend: `cd frontend && npm install && cp .env.example .env`

## Desarrollo

```bash
npm run dev
```

- Frontend: `http://localhost:5173` → `/login` → dashboard + **`/plans`** (upgrade Stripe, estado de plan).
- Backend: `http://localhost:3000` — rutas bajo `/api/...`
- Rutas protegidas envían `Authorization: Bearer <jwt>` (Axios). En dev el proxy sigue siendo `/api` → backend.

## Producción — comandos

**Backend**

```bash
cd backend
npm install
npm start
```

Entry: `node src/server.js` (script `start` en `backend/package.json`). En PaaS, el comando de arranque típico es `npm start` con directorio raíz `backend`.

**Frontend**

```bash
cd frontend
npm install
npm run build
```

Salida: `frontend/dist/`. Servís esa carpeta como sitio estático o subís el proyecto a Vercel/Netlify.

Preview local del build (opcional):

```bash
cd frontend
VITE_API_URL=https://tu-backend-publico.com/api npm run build
npm run preview
```

---

## Deploy backend (ej. Render)

1. Creá un **Web Service**, conectá el repo.
2. **Root directory:** `backend`
3. **Build command:** `npm install && npx prisma migrate deploy`
4. **Start command:** `npm start`
5. **Variables de entorno:**
   - `DATABASE_URL` = PostgreSQL gestionado (Render Postgres u otro)
   - `JWT_SECRET` = secreto fuerte
   - `FRONTEND_URL` = URL final del frontend (ej. `https://multacheck.vercel.app`)
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE`
   - `PORT` lo suele asignar Render automáticamente; tu app ya usa `process.env.PORT`.

Opcional: desde la raíz del repo podés usar el blueprint `render.yaml` (“New Blueprint”) y completar `FRONTEND_URL` en el panel.

6. Anotá la URL pública del servicio, ej. `https://multacheck-api.onrender.com`. La API queda en `https://multacheck-api.onrender.com/api/...`.

---

## Deploy frontend (ej. Vercel)

1. Importá el repo y definí **Root Directory** = `frontend`.
2. **Build command:** `npm run build`
3. **Output directory:** `dist`
4. En **Environment Variables** (entorno **Production**):
   - `VITE_API_URL` = `https://<tu-backend>/api` (la URL real del paso anterior).

5. Redeploy tras cambiar `VITE_API_URL`.

Incluímos `frontend/vercel.json` con rewrite SPA (`index.html`) para rutas del cliente.

**Netlify:** mismo idea: base directory `frontend`, build `npm run build`, publish `dist`, y `VITE_API_URL` en “Build environment variables”.

---

## Verificación end-to-end

1. `GET https://<backend>/api/health` → JSON con estado OK.
2. Abrí el frontend en producción, enviá el formulario de análisis y confirmá respuesta (Network debe mostrar requests a `https://<backend>/api/multa/analyze` con `Origin` igual a `FRONTEND_URL`).
3. Si CORS falla, revisá que `FRONTEND_URL` en el backend coincida **exactamente** con la URL del sitio (protocolo + host, sin path).

## API (contrato)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/health` | No | Estado |
| GET | `/api/version` | No | Versión |
| POST | `/api/auth/register` | No | Alta usuario (`role`: `user`) |
| POST | `/api/auth/login` | No | Login → JWT |
| GET | `/api/auth/me` | Sí | Usuario actual + plan |
| POST | `/api/auth/logout` | Sí | Cierra sesión (auditoría) |
| GET | `/api/plans` | No | Catálogo público de planes y límites |
| POST | `/api/billing/checkout-session` | Sí | Body `{ "tier": "pro" \| "enterprise" }` → `{ url }` |
| POST | `/api/billing/portal-session` | Sí | Portal Stripe `{ url }` |
| POST | `/api/multa/analyze` | Sí | Valida cuota + análisis + guardado si `success` |
| GET | `/api/multas` | Sí | Lista (propia o todas si admin) |

## Capa frontend (`src/services/`)

- `api.js` — base URL (dev `/api`, prod `VITE_API_URL`) + interceptor JWT (`localStorage` `multacheck_token`).
- `auth.service.js` — login, registro, `GET /auth/me`.
- `billing.service.js` — planes públicos, checkout y portal Stripe.
- `multas.service.js` — análisis autenticado.

Rutas y guards: `contexts/AuthContext.jsx`, `components/ProtectedRoute.jsx`, `pages/Login.jsx`, `pages/Register.jsx`, `pages/Plans.jsx`, `components/MultaDashboard.jsx` (misma UI de análisis + plan / enlace **Planes** / **Salir**).

## Notas

- **Ollama** (IA local): `backend/src/services/ollamaClient.js` apunta a `http://localhost:11434`; en cloud necesitarías otro endpoint o desactivar esa parte según tu despliegue.
