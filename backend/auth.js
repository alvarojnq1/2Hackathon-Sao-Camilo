import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "./db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "seu_segredo_aqui";

// Middleware de autenticação
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Cadastro de paciente (SEM família inicialmente)
router.post("/cadastro", async (req, res) => {
  try {
    const { nome, data_nascimento, sexo, email, senha } = req.body;

    // Validações básicas
    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    // Verifica se email já existe
    const [existingUsers] = await pool.execute(
      'SELECT idPaciente FROM paciente WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Insere no banco (idFamilia começa como NULL)
    const [result] = await pool.execute(
      `INSERT INTO paciente (nome, data_nascimento, sexo, email, senha, idFamilia) 
       VALUES (?, ?, ?, ?, ?, NULL)`,
      [nome, data_nascimento, sexo, email, hashedPassword]
    );

    // Gera token JWT
    const token = jwt.sign(
      { id: result.insertId, email, tipo: 'paciente' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Paciente cadastrado com sucesso',
      token,
      user: {
        id: result.insertId,
        nome,
        email,
        tipo: 'paciente',
        idFamilia: null
      }
    });

  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Busca usuário
    const [users] = await pool.execute(
      `SELECT p.*, f.idFamilia, f.nome_familia 
       FROM paciente p 
       LEFT JOIN familia f ON p.idFamilia = f.idFamilia 
       WHERE p.email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = users[0];

    // Verifica senha
    const validPassword = await bcrypt.compare(senha, user.senha);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gera token
    const token = jwt.sign(
      { 
        id: user.idPaciente, 
        email: user.email, 
        tipo: 'paciente',
        idFamilia: user.idFamilia 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.idPaciente,
        nome: user.nome,
        email: user.email,
        tipo: 'paciente',
        idFamilia: user.idFamilia,
        nome_familia: user.nome_familia,
        data_nascimento: user.data_nascimento,
        sexo: user.sexo,
        diagnostico_previo: user.diagnostico_previo,
        painel_genetico: user.painel_genetico
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;