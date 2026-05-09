/**
 * Registro de escenarios de caos (solo harness HTTP). Sin Prisma ni escrituras de negocio obligatorias.
 */
import { chaosLog } from "./lib/jsonLog.mjs";
import { hashHttpBody } from "./lib/responseHash.mjs";
import { faultFetch, sleep, fetchWithDeadline } from "./lib/faultFetch.mjs";
import { classifyFetchError } from "./lib/assertions.mjs";

const SAMPLE_ANALYZE_BODY = Object.freeze({
  country: "AR",
  type: "estacionamiento",
  description: "Chaos replay determinístico — mismo texto siempre",
});

/**
 * @param {string} apiBase URL base con /api (ej. http://127.0.0.1:3000/api)
 */
export function createDefaultContext(apiBase) {
  const base = apiBase.replace(/\/$/, "");
  return {
    apiBase: base,
    log: chaosLog,
    faultFetch,
    hashBody: hashHttpBody,
  };
}

/** @type {Record<string, { description: string, run: (ctx: ReturnType<typeof createDefaultContext>) => Promise<{ passed: boolean, detail?: string }> }>} */
export const CHAOS_SCENARIOS = {
  SCENARIO_CORRUPT_INPUT_STREAM: {
    description:
      "Entrada malformada en POST /multa/analyze — debe fallar de forma explícita (no 200 con éxito silencioso).",
    async run(ctx) {
      const url = `${ctx.apiBase}/multa/analyze`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ esto no es json válido",
      });
      const text = await res.text();
      const silentSuccess = res.ok && text.includes('"success":true');
      if (silentSuccess) {
        return {
          passed: false,
          detail: "Respuesta exitosa con JSON corrupto enviado — fallo silencioso",
        };
      }
      ctx.log("scenario_step", {
        scenario: "SCENARIO_CORRUPT_INPUT_STREAM",
        status: res.status,
        bodySnippet: text.slice(0, 200),
      });
      return { passed: true, detail: `status=${res.status}` };
    },
  },

  SCENARIO_HIGH_LATENCY_SPIKE: {
    description:
      "Latencia inyectada en el cliente antes de N solicitudes (simula congestión percibida); mide tiempos.",
    async run(ctx) {
      const url = `${ctx.apiBase}/multa/analyze`;
      const injectMs = Number(process.env.CHAOS_CLIENT_LATENCY_MS ?? 120);
      const n = Number(process.env.CHAOS_BURST_COUNT ?? 4);
      const timings = [];
      for (let i = 0; i < n; i++) {
        const t0 = Date.now();
        await sleep(injectMs);
        const res = await fetchWithDeadline(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(SAMPLE_ANALYZE_BODY),
        });
        await res.text();
        timings.push(Date.now() - t0);
      }
      ctx.log("scenario_latency_spike", {
        scenario: "SCENARIO_HIGH_LATENCY_SPIKE",
        injectMsPerRequest: injectMs,
        samples: n,
        timingsMs: timings,
      });
      return { passed: true };
    },
  },

  SCENARIO_API_TIMEOUT: {
    description:
      "Timeout agresivo en el cliente — debe abortar sin respuesta del servidor (TIMEOUT_OR_ABORT).",
    async run(ctx) {
      const url = `${ctx.apiBase}/health`;
      try {
        const res = await faultFetch(url, { method: "GET" }, { timeoutMs: 0 });
        await res.text();
        return {
          passed: false,
          detail: "Se esperaba aborto por timeout y hubo respuesta",
        };
      } catch (err) {
        const c = classifyFetchError(err);
        ctx.log("scenario_api_timeout", {
          scenario: "SCENARIO_API_TIMEOUT",
          classification: c.code,
        });
        return { passed: c.code === "TIMEOUT_OR_ABORT", detail: c.detail };
      }
    },
  },

  SCENARIO_DB_PARTIAL_DOWN: {
    description:
      "Observa GET /health: si DB caída, checks.database===error y HTTP 503. Con DB sana solo valida esquema estable.",
    async run(ctx) {
      const url = `${ctx.apiBase}/health`;
      const res = await fetch(url);
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        return {
          passed: false,
          detail: "Health no devolvió JSON parseable",
        };
      }
      const hasChecks =
        json.checks &&
        typeof json.checks === "object" &&
        json.checks.server === "ok";
      if (!hasChecks) {
        return {
          passed: false,
          detail: "Esquema health incompleto (checks.server)",
        };
      }
      ctx.log("scenario_db_observation", {
        scenario: "SCENARIO_DB_PARTIAL_DOWN",
        httpStatus: res.status,
        databaseCheck: json.checks.database,
      });
      const expectDown = process.env.CHAOS_EXPECT_DB_DOWN === "1";
      if (expectDown) {
        const down = res.status === 503 || json.checks.database === "error";
        return {
          passed: down,
          detail: down ? "DB degradación observada" : "Se esperaba DB caída",
        };
      }
      return { passed: true, detail: `database=${json.checks.database}` };
    },
  },

  SCENARIO_RULE_ENGINE_DELAY: {
    description:
      "Dos analizaciones anónimas idénticas con pausa intermedia — hashes de respuesta deben coincidir (motor JS estable).",
    async run(ctx) {
      try {
        const h = await fetchWithDeadline(`${ctx.apiBase}/health`, {
          method: "GET",
        });
        const hj = await h.json();
        if (hj?.checks?.ai === "configured") {
          ctx.log("scenario_warning", {
            scenario: "SCENARIO_RULE_ENGINE_DELAY",
            msg:
              "OPENAI configurado en el servidor: el determinismo del scoring puede no mantenerse entre corridas.",
          });
        }
      } catch {
        /* ignore */
      }

      const url = `${ctx.apiBase}/multa/analyze`;
      const body = JSON.stringify(SAMPLE_ANALYZE_BODY);
      const gapMs = Number(process.env.CHAOS_RULE_GAP_MS ?? 250);

      const runOnce = async () => {
        try {
          const res = await fetchWithDeadline(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          });
          const text = await res.text();
          return { status: res.status, hash: ctx.hashBody(text), text };
        } catch (err) {
          const c = classifyFetchError(err);
          return { status: 0, hash: "", networkClass: c.code, detail: c.detail };
        }
      };

      const a = await runOnce();
      await sleep(gapMs);
      const b = await runOnce();

      if (a.status !== 200 || b.status !== 200) {
        return {
          passed: false,
          detail: `HTTP inesperado a=${a.status} b=${b.status} net=${a.networkClass ?? ""}/${b.networkClass ?? ""}`,
        };
      }

      const drift = a.hash !== b.hash;
      ctx.log("scenario_rule_engine_delay", {
        scenario: "SCENARIO_RULE_ENGINE_DELAY",
        hashA: a.hash,
        hashB: b.hash,
        drift,
        gapMs,
      });
      return {
        passed: !drift,
        detail: drift ? "Deriva entre corridas del mismo payload" : "Hashes coincidentes",
      };
    },
  },
};
