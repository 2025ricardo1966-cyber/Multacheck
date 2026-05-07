const fetch = require('node-fetch');

// TU CLAVE DE API
const API_KEY = "AIzaSyCNJ8eekFyY-AxhQHZI d0DGR5lfonYsQgY";

async function checkModels() {
    console.log("🔍 Consultando modelos disponibles para tu cuenta...");
    
    // Probamos la URL de listado de modelos
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("✅ Modelos encontrados:");
            data.models.forEach(m => {
                console.log(`- ${m.name.replace('models/', '')}`);
            });
            console.log("\n👉 Copiá uno de esos nombres y usalo en tu Server.js");
        } else {
            console.error("❌ No se encontraron modelos o la clave es inválida:", data);
        }
    } catch (err) {
        console.error("❌ Error de conexión:", err.message);
    }
}

checkModels();