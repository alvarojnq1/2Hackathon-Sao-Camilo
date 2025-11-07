import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// ⚠️ DOTENV PRIMEIRO - antes de qualquer import que use process.env
dotenv.config();

console.log('🔧 Carregando variáveis de ambiente...');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Definido' : '✗ Indefinido');

const app = express();
app.use(express.json());

// CORS
app.use(cors({ 
  origin: "http://localhost:5173", 
  credentials: true 
}));

// ⚠️ Importações DEPOIS do dotenv.config() - agora com caminhos relativos corretos
import authRoutes from "./auth.js";
import profileRoutes from "./profile.js";

// Rotas
app.use("/auth", authRoutes);
app.use("/api", profileRoutes);

// Rota de saúde
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Backend rodando normalmente" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Backend rodando na porta ${PORT}`));