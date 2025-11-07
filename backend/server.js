import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Configurar caminhos para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env da pasta raiz
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('🔧 Iniciando servidor...');

const app = express();
app.use(express.json());

// CORS
app.use(cors({ 
  origin: "http://localhost:5173", 
  credentials: true 
}));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.originalUrl}`);
  next();
});

// Importar rotas
console.log('🔄 Importando rotas...');
import authRoutes from "./auth.js";
import profileRoutes from "./profile.js";

console.log('✅ Rotas importadas com sucesso');

// Registrar rotas
app.use("/auth", authRoutes);
app.use("/api", profileRoutes);

console.log('✅ Todas as rotas registradas');

// Rota de saúde
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Backend rodando normalmente" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`👨‍⚕️ Rota profissional: http://localhost:${PORT}/api/profissional/familias`);
});