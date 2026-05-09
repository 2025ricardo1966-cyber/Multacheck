import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateScore } from "../src/scoring/scoringengine.js";
import { buildEngineDecisionTrace } from "../src/scoring/decisionTrace.js";
import { buildPipelineExplainability } from "../src/scoring/pipelineExplain.js";

describe("decisionTrace parity vs calculateScore", () => {
  const cases = [
    {
      multaData: { type: "velocidad", description: "exceso en autopista" },
      aiAnalysis: { gravedad: "media" },
    },
    {
      multaData: { type: "otros", description: "" },
      aiAnalysis: { gravedad: "baja" },
    },
    {
      multaData: {
        type: "estacionamiento",
        description: "prohibida zona escolar doble fila",
      },
      aiAnalysis: { gravedad: "alta" },
    },
  ];

  for (let i = 0; i < cases.length; i++) {
    it(`case ${i + 1} engine trace parity`, () => {
      const { multaData, aiAnalysis } = cases[i];
      const score = calculateScore(multaData, aiAnalysis);
      const trace = buildEngineDecisionTrace(multaData, aiAnalysis);
      assert.equal(trace.finalScore, score);
      assert.equal(trace.parityOk, true);
    });
  }
});

describe("pipelineExplainability deterministic shape", () => {
  it("misma entrada produce mismo manifestVersion y parity ok", () => {
    const multaData = { country: "AR", type: "velocidad", description: "test" };
    const aiAnalysis = { gravedad: "media" };
    const trusted = { gravity: "media", trustWeight: 1 };
    const baseScoreRaw = calculateScore(multaData, aiAnalysis);
    const baseScore = Math.round(baseScoreRaw * trusted.trustWeight);
    const finalScore = baseScore;

    const a = buildPipelineExplainability({
      multaData,
      aiAnalysis,
      trusted,
      baseScoreRaw,
      baseScore,
      finalScore,
      country: "AR",
    });
    const b = buildPipelineExplainability({
      multaData,
      aiAnalysis,
      trusted,
      baseScoreRaw,
      baseScore,
      finalScore,
      country: "AR",
    });

    assert.equal(a.manifestVersion, b.manifestVersion);
    assert.equal(a.parityEngineVsCanonical, true);
    assert.equal(JSON.stringify(a.engineTrace), JSON.stringify(b.engineTrace));
  });
});
