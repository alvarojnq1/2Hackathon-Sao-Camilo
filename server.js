import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./backend/auth.js";
import profileRoutes from "./backend/profile.js";

dotenv.config();
const app = express();
app.use(express.json());

// CORS - permitindo o frontend na porta 5173 (Vite)
app.use(cors({ 
  origin: "http://localhost:5173", 
  credentials: true 
}));

// Rotas
app.use("/auth", authRoutes);
app.use("/api", profileRoutes);

// Rota de saúde
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Backend rodando normalmente" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Backend rodando na porta ${PORT}`));