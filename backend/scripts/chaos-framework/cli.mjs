#!/usr/bin/env node
/**
 * Runner CLI — caos aislado por HTTP. No usa Prisma.
 *
 * Uso:
 *   node scripts/chaos-framework/cli.mjs --list
 *   node scripts/chaos-framework/cli.mjs --scenario SCENARIO_CORRUPT_INPUT_STREAM
 *   node scripts/chaos-framework/cli.mjs --replay scripts/chaos-framework/samples/replay-anonymous-analyze.json
 *
 * Env:
 *   CHAOS_API_BASE=http://127.0.0.1:3000/api  (default)
 */
import { CHAOS_SCENARIOS, createDefaultContext } from "./registry.mjs";
import { chaosLog } from "./lib/jsonLog.mjs";
import { loadReplayFile, runReplayTwice } from "./replay.mjs";

function parseArgs(argv) {
  const out = { list: false, scenario: null, replay: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--list") out.list = true;
    else if (a === "--scenario" && argv[i + 1]) {
      out.scenario = argv[++i];
    } else if (a === "--replay" && argv[i + 1]) {
      out.replay = argv[++i];
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  const apiBase =
    process.env.CHAOS_API_BASE?.trim() || "http://127.0.0.1:3000/api";

  if (args.list) {
    for (const [id, def] of Object.entries(CHAOS_SCENARIOS)) {
      chaosLog("scenario_list", { id, description: def.description });
    }
    process.exit(0);
  }

  if (args.replay) {
    chaosLog("run_start", { mode: "replay", apiBase, file: args.replay });
    const steps = loadReplayFile(args.replay);
    const { passed } = await runReplayTwice(apiBase, steps);
    chaosLog("run_end", { mode: "replay", passed });
    process.exit(passed ? 0 : 1);
  }

  const scenarioId = args.scenario;
  if (!scenarioId || !CHAOS_SCENARIOS[scenarioId]) {
    console.error(
      "Definí --scenario <ID> o --replay <file>. --list para IDs válidos."
    );
    process.exit(2);
  }

  const ctx = createDefaultContext(apiBase);
  chaosLog("run_start", { mode: "scenario", scenario: scenarioId, apiBase });

  const result = await CHAOS_SCENARIOS[scenarioId].run(ctx);

  chaosLog("run_end", {
    mode: "scenario",
    scenario: scenarioId,
    passed: result.passed,
    detail: result.detail ?? null,
  });

  process.exit(result.passed ? 0 : 1);
}

main().catch((err) => {
  chaosLog("run_fatal", {
    message: err?.message ?? String(err),
    stack: err?.stack,
  });
  process.exit(1);
});
