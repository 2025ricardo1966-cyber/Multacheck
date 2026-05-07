import { MongoClient } from "mongodb";

// 🔧 URI directa (para test)
const uri = "mongodb+srv://multachekpage_db_user:rp55G5cQ5roGyaVZ@cluster0.zkjl0fg.mongodb.net/multacheck?retryWrites=true&w=majority";

const client = new MongoClient(uri);

let db;

export async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("multacheck");
    console.log("✅ MongoDB conectado");
  }
  return db;
}