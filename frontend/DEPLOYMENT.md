# Vercel Deployment — MultaCheck Frontend

Cliente React/Vite en monorepo (`frontend/`). Sin cambios de UI; solo build y env.

## Automatic deploy

1. Push a `main` (rama conectada al proyecto Vercel).
2. Vercel detecta el push y ejecuta build en `frontend/` (Root Directory).
3. **Preview URL** en cada PR; **Production** al merge a `main`.

Config fijada en `frontend/vercel.json`:

- Build: `@vercel/static-build` → `npm run build` → output `dist`
- SPA rewrite: todas las rutas → `index.html`

## Manual deploy

```bash
cd frontend
npm install -g vercel
vercel          # preview
vercel --prod   # production
```

## Environment variables

Configurar en **Vercel → Project → Settings → Environment Variables** (Production + Preview si aplica).

Solo variables `VITE_*` se embeben en el bundle en **build time**. Tras cambiarlas: **Redeploy** obligatorio.

| Variable | Obligatoria | Ejemplo | Notas |
|----------|-------------|---------|--------|
| `VITE_API_URL` | **Sí** | `https://multacheck-api.onrender.com/api` | URL pública del backend **incluyendo** `/api`, **sin** `/` final. Usada en `src/services/api.js`. |
| `VITE_STRIPE_PUBLIC_KEY` | Opcional | `pk_test_…` / `pk_live_…` | Solo si el frontend muestra Stripe.js directamente. |

### Secrets en `vercel.json` (recomendado)

El repo referencia secrets de Vercel:

```json
"VITE_API_URL": "@vite-api-url",
"VITE_STRIPE_PUBLIC_KEY": "@vite-stripe-public-key"
```

Crear en CLI o dashboard:

```bash
vercel secrets add vite-api-url "https://<tu-api>.onrender.com/api"
vercel secrets add vite-stripe-public-key "pk_test_..."
```

**Evitar** dejar placeholders en `frontend/.env.production` commiteado; deben ganar los secrets del dashboard.

### Backend CORS (pareja obligatoria)

En Render, el API debe tener:

```env
FRONTEND_URL=https://<tu-proyecto>.vercel.app
```

Sin barra final. Debe coincidir con la URL real de Production en Vercel.

---

## Build local (sanity check)

```powershell
cd frontend
$env:VITE_API_URL="https://<tu-api>.onrender.com/api"
npm run build
npm run preview
```

Bundle objetivo: JS gzip **< 400 KB** (referencia: ~100 KB en build actual).

---

## Troubleshooting

### Build falla: `VITE_API_URL is not defined`

- Setear `VITE_API_URL` en Vercel (Production).
- Redeploy completo (no solo cache invalidation).

### API calls van a URL vacía o `/api` relativo roto

- Misma causa: build sin `VITE_API_URL`.
- Verificar en DevTools → Network el host de las requests.

### CORS error en producción

1. `FRONTEND_URL` en Render = origen exacto del sitio Vercel (https + dominio).
2. Redeploy backend tras cambiar CORS.
3. Hard refresh / limpiar cache del browser.

### Frontend carga pero "Failed to fetch"

1. API caída: `curl https://<api>/api/health`
2. `VITE_API_URL` incorrecta (falta `/api` o barra extra).
3. Render free tier cold start (reintentar).

### 404 en dominio Vercel

- Confirmar que el proyecto apunta al repo correcto y **Root Directory = `frontend`**.
- `multacheck.vercel.app` u otros dominios pueden ser de otro proyecto; usar la URL del deploy de este repo.

### Stripe checkout redirige mal

- Return URLs las arma el **backend** con `FRONTEND_URL` → `/?resume=<multaId>&payment=success`.
- No depende de rutas `/plans` en el frontend v1.

---

## Related docs

- Backend ops: `backend/PRODUCTION.md`
- Detalle Vercel: `frontend/DEPLOY-VERCEL.md`
- Monorepo README: raíz `README.md`
