import { analyzeAndPersist } from "../backend/src/multas/multa.persistence.js";
import { pathToFileURL } from "url";

const TOTAL = 500;

const tenantId = "c721331b-3225-4219-857e-0e1c63a854d1";
const userId = "535f2102-5a46-49ad-b60f-f416e90791f4";

function rand() {
  return Math.random().toString(36).slice(2, 8);
}

async function run() {
  console.log("=== CHAOS TEST START ===");

  let ok = 0;
  let fail = 0;
  let chaos = 0;

  const tasks = [];

  for (let i = 0; i < TOTAL; i++) {
    const req = {
      body: {
        country: "AR",
        type: "transito",
        description: "chaos-" + rand(),
      },
      auth: {
        tenantId,
        userId,
      },
      options: {
        idempotencyKey: "key-" + (i % 5),
      },
    };

    tasks.push(
      analyzeAndPersist(req.auth, req.body, req.options)
        .then((res) => {
          if (res?.data?.id) ok++;
          else fail++;
        })
        .catch((e) => {
          if (e.message === "CHAOS_DB_SIMULATED_FAILURE") chaos++;
          else fail++;
        })
    );
  }

  await Promise.all(tasks);

  console.log("=== CHAOS REPORT ===");
  console.log("Total:", TOTAL);
  console.log("Success:", ok);
  console.log("Fail:", fail);
  console.log("Chaos:", chaos);

  console.log("STATUS:", ok > 0 ? "RUNNING STABLE" : "BROKEN");
}

let isRunning = false;

async function runOnce() {
  if (isRunning) return;
  isRunning = true;

  try {
    await run();
    console.log("=== CHAOS TEST DONE ===");
  } catch (err) {
    console.error("=== CHAOS TEST FAILED ===", err);
  } finally {
    isRunning = false;
  }
}

const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";

if (import.meta.url === entryUrl) {
  void runOnce();
}