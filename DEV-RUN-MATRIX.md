# MultaCheck — Matriz de ejecución en desarrollo (DEV-RUN-MATRIX)

Documento operativo: **qué levantar, desde dónde y en qué orden**.  
Actualizado tras **consolidación en un solo frontend** (`frontend/` Vite).

---

## 0. Frontend único oficial (single source of truth)

| Etiqueta | Carpeta | Estado |
|----------|---------|--------|
| **PRIMARY_FRONTEND** | **`frontend/`** | Único cliente web del producto: Vite, React Router, proxy `/api` → backend. **Único** referenciado en `npm run dev` / `dev:frontend` en la raíz. Puerto **5173**. |
| **REMOVED** | ~~`multacheck-dashboard/`~~ | CRA (`react-scripts`). **Eliminado del repositorio** (evitar segundo dev server y competencia de puertos con el backend). |
| **REMOVED** | ~~`app/`~~ (Next App Router) | App experimental (`page.tsx`, API route v1). **Eliminado del repositorio** para eliminar ambigüedad con el producto Vite. El motor sigue en **`core/`** (TypeScript); el cliente oficial es **`frontend/`**. |

**`core/`** no es un frontend: es biblioteca compartida usada por scripts de verificación y por la API Node/Express según el proyecto; **no** sirve archivos estáticos al usuario final.

---

## 1. Mapa de capas

| Capa | Carpeta | Comando típico | Puerto / salida |
|------|---------|----------------|-----------------|
| API | `backend/` | `npm run dev` | `http://localhost:3000` |
| SPA (único) | `frontend/` | `npm run dev` | `http://localhost:5173` |
| Orquestación (opcional) | raíz | `npm run dev` | levanta **backend + frontend** vía `concurrently` |

---

## 2. Tres modos de terminal

### A — BACKEND (solo backend)

```bash
cd backend
npm install   # primera vez
npm run dev
```

Solo variables y comandos de **`backend/`**.

### B — FRONTEND (solo PRIMARY_FRONTEND)

```bash
cd frontend
npm install   # primera vez
npm run dev
```

URL: **http://localhost:5173**. Las llamadas en dev usan **`/api`** → proxy a **3000**.

### C — CONTROL / ORQUESTACIÓN

Orden recomendado: DB (si aplica) → **A** → **B**.

Desde la raíz (una terminal, dos procesos):

```bash
npm install
npm run dev
```

Sigue siendo **dos servicios**; no hay tercer frontend alternativo.

---

## 3. Advertencias — NO mezclar contextos

1. Un terminal = un rol (**A** o **B**) si querés evitar confusiones de `cwd` y `package.json`.
2. **No** buscar `multacheck-dashboard` ni `app/` como apps arrancables: **ya no existen en el repo**.
3. El backend **`backend/src/core/`** (JS) es distinto de la raíz **`core/`** (TS motor): no los confundas al depurar.
4. Si el backend no está en **3000**, ajustá **`frontend/vite.config.js`** o el puerto del backend.

---

## 4. CI y calidad

- **GitHub Actions**: jobs `backend-ci` y `frontend-ci` (job **dashboard-ci** eliminado con CRA).
- Smoke engine: `npm run smoke:e2e:multacheck` (raíz) — valida el contrato v1 vía **`core/`**, sin Next.

---

## 5. Referencias

| Necesidad | Dónde |
|-----------|--------|
| Variables backend | `backend/.env` |
| Frontend producción | `frontend/dist/` + `VITE_API_URL` en build |
| Estructura narrada | `README.md` |

---

*Único frontend operativo: **`frontend/`**. Sin dashboards paralelos en el repositorio.*
