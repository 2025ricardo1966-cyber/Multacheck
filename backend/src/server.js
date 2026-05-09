import { PORT } from "./config/env.js";
import app from "./app.js";

function assertEnv() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL es obligatoria (PostgreSQL).");
    process.exit(1);
  }

  if (!process.env.JWT_SECRET?.trim()) {
    console.error("JWT_SECRET es obligatoria.");
    process.exit(1);
  }
}

assertEnv();

/**
 * Validación estricta de app Express
 */
if (typeof app?.listen !== "function") {
  console.error(
    "[MultaCheck] `app` no es una instancia Express válida (app.listen ausente)."
  );
  process.exit(1);
}

/**
 * Bind explícito IPv4 estable (evita problemas Windows dual-stack)
 */
const LISTEN_HOST = process.env.LISTEN_HOST?.trim() || "127.0.0.1";

const server = app.listen(PORT, LISTEN_HOST);

server.once("listening", () => {
  /* Arranque mínimo — reactivá logs extendidos al volver features (helmet, swagger, etc.). */
  console.log(`Server running on port ${PORT}`);
  // import { OFFICIAL_API_PORT } from "./config/env.js" y restaurá logs extendidos aquí.
});

server.once("error", (err) => {
  console.error("Error al iniciar servidor:", err.message);
  process.exit(1);
});