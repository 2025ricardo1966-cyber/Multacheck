import { runMultachekPipeline } from './orchestrator.js';

/**
 * Manual pipeline check (no Jest/Mocha).
 * Run from backend: npm run test:pipeline
 */

export async function testPipeline() {
  const input = {
    raw: "Speeding violation detected at 120km/h in a 60km/h zone in Buenos Aires. Fine issued: 30000 ARS."
  };

  try {
    const result = await runMultachekPipeline(input);

    console.log("=== MULTACHEK PIPELINE RESULT ===");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("PIPELINE ERROR:", error);
  }
}

/**
 * Auto-run when executed directly via tsx
 */
testPipeline();