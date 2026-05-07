import 'dotenv/config'
import express from 'express'
import { createClient } from '@supabase/supabase-js'

const app = express()
app.use(express.json())

// 🔍 Verificación de variables (podés borrarlo después)
console.log("URL:", process.env.SUPABASE_URL)
console.log("KEY:", process.env.SUPABASE_KEY ? "OK" : "NO KEY")

// 🔌 Conexión a Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// 🌐 Ruta base
app.get("/", (req, res) => {
  res.send("🔥 MultaCheck backend funcionando")
})

// 🧪 Endpoint de prueba DB
app.get("/api/test-db", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("test") // ⚠️ cambiamos luego por tu tabla real
      .select("*")

    if (error) throw error

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 🧾 Ejemplo POST (para que ya tengas estructura real)
app.post("/api/test-db", async (req, res) => {
  try {
    const { nombre } = req.body

    const { data, error } = await supabase
      .from("test")
      .insert([{ nombre }])
      .select()

    if (error) throw error

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 🚀 Levantar servidor
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log("========================================")
  console.log(`🔥 MULTACHECK: MOTOR ENCENDIDO EN PUERTO ${PORT}`)
  console.log("========================================")
})