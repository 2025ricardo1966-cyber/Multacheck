import { analyzeWithAI } from "../src/ai/index.js";

const testInput = {
  raw: [
    "AR",
    "exceso_velocidad",
    "Multa por exceder 130 km/h en zona de 110 km/h",
  ]
    .filter(Boolean)
    .join(" ")
    .trim(),
};

console.log("🧪 Testing pipeline integration...\n");

const result = await analyzeWithAI(testInput);

console.log("Result:", JSON.stringify(result, null, 2));

if (result) {
  console.log("\n✅ Pipeline devolvió datos");
} else {
  console.log("\n⏭ Sin resultado (sin OPENAI_API_KEY o error en pipeline)");
}
