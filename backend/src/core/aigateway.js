import ollamaClient from "../services/ollamaclient.js";

/**
 * AI Gateway de MULTACHEK
 * Punto único de acceso a la IA
 */
export async function processWithAI(type, payload) {
  switch (type) {
    case "multa_analysis":
      return await ollamaClient.analyze({ prompt: payload.text });

    default:
      throw new Error(`Unknown AI task type: ${type}`);
  }
}
