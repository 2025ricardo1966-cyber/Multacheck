/**
 * Replay determinístico: ejecuta el mismo lote dos veces y compara hashes por paso.
 */
import { chaosLog } from "./lib/jsonLog.mjs";
import { hashReplayResponse } from "./lib/responseHash.mjs";
import { fetchWithDeadline } from "./lib/faultFetch.mjs";
import fs from "node:fs";

/**
 * @param {string} apiBase
 * @param {Array<{ method: string, path: string, body?: unknown, headers?: Record<string, string> }>} steps
 */
export async function runReplayTwice(apiBase, steps) {
  const base = apiBase.replace(/\/$/, "");

  const executeBatch = async (label) => {
    /** @type {{ step: number, hash: string, status: number }[]} */
    const out = [];
    let i = 0;
    for (const s of steps) {
      i += 1;
      const pathRel = s.path.startsWith("/") ? s.path : `/${s.path}`;
      const url = `${base}${pathRel}`;
      chaosLog("replay_step_start", { label, step: i, method: s.method, url });
      const method = (s.method || "GET").toUpperCase();
      const headers = { ...s.headers };
      /** @type {RequestInit} */
      const init = { method, headers };
      if (s.body != null && method !== "GET") {
        if (!headers["Content-Type"] && !headers["content-type"]) {
          headers["Content-Type"] = "application/json";
        }
        init.body =
          typeof s.body === "string" ? s.body : JSON.stringify(s.body);
      }
      const res = await fetchWithDeadline(url, init);
      const text = await res.text();
      out.push({
        step: i,
        hash: hashReplayResponse(pathRel, text),
        status: res.status,
        label,
      });
    }
    return out;
  };

  const first = await executeBatch("run1");
  const second = await executeBatch("run2");

  let allMatch = true;
  for (let k = 0; k < first.length; k++) {
    const match = first[k].hash === second[k].hash && first[k].status === second[k].status;
    if (!match) allMatch = false;
    chaosLog("replay_step_compare", {
      step: first[k].step,
      hashMatch: match,
      statusRun1: first[k].status,
      statusRun2: second[k].status,
    });
  }

  chaosLog("replay_finished", { deterministic: allMatch, steps: first.length });
  return { passed: allMatch, first, second };
}

export function loadReplayFile(path) {
  const raw = fs.readFileSync(path, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data.steps)) {
    throw new Error("replay JSON debe tener campo array \"steps\"");
  }
  return data.steps;
}
