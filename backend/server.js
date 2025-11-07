import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Configurar caminhos para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⚠️ Carregar .env da pasta raiz (subir um nível)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('🔧 Carregando variáveis de ambiente...');
console.log('📁 Caminho do .env:', path.join(__dirname, '..', '.env'));
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '✓ Definida' : '✗ Indefinida');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Definido' : '✗ Indefinido');
console.log('GMAIL_USER:', process.env.GMAIL_USER ? '✓ Definido' : '✗ Indefinido');

const app = express();
app.use(express.json());

// CORS
app.use(cors({ 
  origin: "http://localhost:5173", 
  credentials: true 
}));

// Importações DEPOIS do dotenv.config()
import authRoutes from "./auth.js";
import profileRoutes from "./profile.js";

// Rotas
app.use("/auth", authRoutes);
app.use("/api", profileRoutes);

// Rota de saúde
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Backend rodando normalmente" });
});

// Rota de teste do banco
app.get("/test-db", async (req, res) => {
  try {
    const pool = await import("./db.js");
    const connection = await pool.default.getConnection();
    console.log('✅ Conexão com MySQL estabelecida!');
    connection.release();
    res.json({ status: "OK", message: "Conexão com banco estabelecida" });
  } catch (error) {
    console.error('❌ Erro na conexão com MySQL:', error.message);
    res.status(500).json({ error: "Erro na conexão com o banco: " + error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🗄️  Teste DB: http://localhost:${PORT}/test-db`);
});