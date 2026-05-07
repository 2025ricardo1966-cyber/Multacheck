import axios from "axios";

const OLLAMA_URL = "http://localhost:11434/api/generate";

// timeout realista para local (60s es demasiado para requests simples mal diseñados)
const TIMEOUT = 20000;

export async function analyze({ prompt }) {
  try {
    const response = await axios.post(
      OLLAMA_URL,
      {
        model: "llama3",
        prompt,
        stream: false
      },
      {
        timeout: TIMEOUT,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    // Ollama devuelve data.response
    return response.data.response;

  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error("OLLAMA timeout: modelo tardó demasiado en responder");
    }

    throw new Error(error.message || "Error desconocido en Ollama");
  }
}

export default {
  analyze
};
