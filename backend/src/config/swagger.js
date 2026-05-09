import path from "node:path";
import { fileURLToPath } from "node:url";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { PORT } from "./env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, "..");

const prodServer =
  process.env.SWAGGER_PUBLIC_API_URL?.trim() ||
  "https://api.multacheck.com/api";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MultaCheck API",
      version: "1.0.0",
      description: "API para análisis de multas de tránsito",
    },
    servers: [
      { url: `http://localhost:${PORT}/api`, description: "Development" },
      {
        url: prodServer.replace(/\/+$/, ""),
        description: "Production",
      },
    ],
    tags: [
      { name: "Health", description: "Estado del servicio" },
      { name: "Auth", description: "Registro e inicio de sesión" },
      { name: "Multas", description: "Análisis y descargos" },
      { name: "Admin", description: "Operaciones internas (token debug)" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        adminDebugToken: {
          type: "apiKey",
          in: "header",
          name: "X-Admin-Debug-Token",
          description: "Mismo valor que ADMIN_DEBUG_SECRET en el servidor",
        },
      },
    },
  },
  apis: [
    path.join(srcDir, "routes", "index.js"),
    path.join(srcDir, "routes", "health.routes.js"),
    path.join(srcDir, "multas", "multa.routes.js"),
    path.join(srcDir, "auth", "auth.routes.js"),
    path.join(srcDir, "admin", "admin.routes.js"),
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app) {
  app.use("/api-docs", swaggerUi.serve);
  app.use(
    "/api-docs",
    swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      explorer: true,
    })
  );
  console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
}
