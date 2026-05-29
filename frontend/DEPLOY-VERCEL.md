# Deploy frontend en Vercel

Configuración mínima para publicar el cliente React/Vite **sin cambiar la UI**.

## 1. Importar el repositorio

1. [vercel.com](https://vercel.com) → **Add New Project** → conectar el repo de GitHub.
2. **Root Directory:** `frontend` (obligatorio en monorepo).
3. Vercel detecta Vite; `frontend/vercel.json` fija install/build/output y el rewrite SPA.

| Campo | Valor |
|-------|--------|
| Framework Preset | Vite |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

## 2. Variables de entorno (Production)

Configurar en **Project → Settings → Environment Variables**.  
Solo las que empiezan con `VITE_` se incluyen en el bundle en **build time** (redeploy obligatorio tras cambiarlas).

| Variable | Obligatoria | Ejemplo | Notas |
|----------|-------------|---------|--------|
| `VITE_API_URL` | **Sí** | `https://multacheck-api.onrender.com/api` | URL pública del backend **con** `/api`, sin `/` final. La usa `src/services/api.js`. |
| `VITE_STRIPE_PUBLIC_KEY` | No | `pk_live_…` | No la consume el código hoy (checkout = redirect URL del backend). Opcional / reservada. |

**No subir claves reales al repo.** Usar solo el panel de Vercel o `.env` local (gitignored).

### Desarrollo local (no van a Vercel)

| Variable | Uso |
|----------|-----|
| `VITE_BACKEND_PORT` | Solo proxy de Vite en `vite.config.js` (default `3000`). |

## 3. Alineación con el backend

En Render (o tu PaaS del API), el backend debe tener:

- `FRONTEND_URL` = URL exacta del sitio en Vercel (ej. `https://tu-app.vercel.app`, sin `/` final).
- CORS usa ese origin; si no coincide, el navegador bloqueará las requests.

## 4. Scripts npm

```bash
npm run build    # genera frontend/dist/ (Vercel lo publica)
npm run preview  # prueba local del build; requiere VITE_API_URL en .env o en la shell
```

Preview local contra backend remoto:

```bash
# PowerShell
$env:VITE_API_URL="https://multacheck-api.onrender.com/api"
npm run build
npm run preview
```

## 5. Routing SPA

`vercel.json` reescribe todas las rutas a `index.html` para que React Router funcione en:

- `/`, `/login`, `/register`, `/plans`, `/descargo/:id`, etc.

Los assets estáticos (`/assets/*`, `/escudos/*`) los sirve Vercel antes del rewrite.

## 6. Verificación post-deploy

1. Abrir la URL de Vercel → la portada carga sin 404.
2. Refrescar en `/login` o `/register` → no debe dar 404.
3. DevTools → Network: requests a `https://<backend>/api/...` (no a `localhost`).
4. Enviar el formulario de análisis → respuesta JSON del backend (si `FRONTEND_URL` está bien en el API).

## 7. Errores frecuentes

| Síntoma | Causa | Fix |
|---------|--------|-----|
| API calls a URL vacía o relativa incorrecta | Falta `VITE_API_URL` en el build | Setear en Vercel Production y **Redeploy** |
| CORS error | `FRONTEND_URL` del backend ≠ URL de Vercel | Corregir en Render y reiniciar API |
| 404 al refrescar una ruta | Falta rewrite SPA | Confirmar `frontend/vercel.json` y Root Directory = `frontend` |
| Build OK pero analyze falla | Backend caído o DB sin migrar | Revisar `/api/health` del backend |
