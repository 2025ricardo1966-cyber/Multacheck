const fetch = require('node-fetch');

const API_KEY = "AIzaSyCNJ8eekFyY-AxhQHZI d0DGR5lfonYsQgY";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

async function validarConexion() {
    console.log("🚀 Probando la nueva clave en el proyecto nuevo...");
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hola, responde solo con la palabra EXITOSO" }] }]
            })
        });
        const data = await response.json();
        if (data.candidates) {
            console.log("✅ RESULTADO: ", data.candidates[0].content.parts[0].text);
        } else {
            console.log("❌ ERROR DE GOOGLE:", data.error ? data.error.message : "Respuesta vacía");
        }
    } catch (e) {
        console.log("❌ ERROR DE RED:", e.message);
    }
}
validarConexion();