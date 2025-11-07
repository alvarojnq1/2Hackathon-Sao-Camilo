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

// Função para validar senha forte
function validarSenha(senha) {
  const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(senha);
}

// Função para validar email
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Função para validar sexo
function validarSexo(sexo) {
  return ['M', 'F'].includes(sexo);
}

// CADASTRO DE PACIENTE
router.post("/paciente/cadastro", async (req, res) => {
  try {
    const { nome, email, senha, sexo } = req.body;

    // Validações básicas
    if (!nome || !email || !senha || !sexo) {
      return res.status(400).json({ 
        error: 'Nome, email, senha e sexo são obrigatórios' 
      });
    }

    // Validação de email
    if (!validarEmail(email)) {
      return res.status(400).json({ 
        error: 'Formato de email inválido' 
      });
    }

    // Validação de sexo
    if (!validarSexo(sexo)) {
      return res.status(400).json({ 
        error: 'Sexo deve ser "M" (masculino) ou "F" (feminino)' 
      });
    }

    // Validação de senha forte
    if (!validarSenha(senha)) {
      return res.status(400).json({ 
        error: 'Senha deve conter pelo menos 8 caracteres, 1 letra maiúscula, 1 número e 1 símbolo (@$!%*?&)' 
      });
    }

    // Verifica se email já existe na tabela paciente
    const [existingPacientes] = await pool.execute(
      'SELECT idPaciente FROM paciente WHERE email = ?',
      [email]
    );

    if (existingPacientes.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado como paciente' });
    }

    // Verifica se email já existe na tabela profissional_saude
    const [existingProfissionais] = await pool.execute(
      'SELECT idProfissional FROM profissional_saude WHERE email = ?',
      [email]
    );

    if (existingProfissionais.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado como profissional' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Insere no banco (campos restantes como NULL)
    const [result] = await pool.execute(
      `INSERT INTO paciente (nome, email, senha, sexo, data_nascimento, diagnostico_previo, painel_genetico, idFamilia) 
       VALUES (?, ?, ?, ?, NULL, NULL, NULL, NULL)`,
      [nome, email, hashedPassword, sexo]
    );

    // Gera token JWT
    const token = jwt.sign(
      { 
        id: result.insertId, 
        email, 
        tipo: 'paciente',
        nome: nome
      },
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
        sexo,
        tipo: 'paciente',
        data_nascimento: null,
        diagnostico_previo: null,
        painel_genetico: null,
        idFamilia: null
      }
    });

  } catch (error) {
    console.error('Erro no cadastro do paciente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// CADASTRO DE PROFISSIONAL DE SAÚDE
router.post("/profissional/cadastro", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    // Validações básicas
    if (!nome || !email || !senha) {
      return res.status(400).json({ 
        error: 'Nome, email e senha são obrigatórios' 
      });
    }

    // Validação de email
    if (!validarEmail(email)) {
      return res.status(400).json({ 
        error: 'Formato de email inválido' 
      });
    }

    // Validação de senha forte
    if (!validarSenha(senha)) {
      return res.status(400).json({ 
        error: 'Senha deve conter pelo menos 8 caracteres, 1 letra maiúscula, 1 número e 1 símbolo (@$!%*?&)' 
      });
    }

    // Verifica se email já existe na tabela profissional_saude
    const [existingProfissionais] = await pool.execute(
      'SELECT idProfissional FROM profissional_saude WHERE email = ?',
      [email]
    );

    if (existingProfissionais.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado como profissional' });
    }

    // Verifica se email já existe na tabela paciente
    const [existingPacientes] = await pool.execute(
      'SELECT idPaciente FROM paciente WHERE email = ?',
      [email]
    );

    if (existingPacientes.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado como paciente' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Insere no banco
    const [result] = await pool.execute(
      `INSERT INTO profissional_saude (nome, email, senha) 
       VALUES (?, ?, ?)`,
      [nome, email, hashedPassword]
    );

    // Gera token JWT
    const token = jwt.sign(
      { 
        id: result.insertId, 
        email, 
        tipo: 'profissional',
        nome: nome
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Profissional de saúde cadastrado com sucesso',
      token,
      user: {
        id: result.insertId,
        nome,
        email,
        tipo: 'profissional'
      }
    });

  } catch (error) {
    console.error('Erro no cadastro do profissional:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// LOGIN GERAL (para pacientes e profissionais)
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    let user = null;
    let tipo = null;

    // Primeiro tenta encontrar como paciente
    const [pacientes] = await pool.execute(
      `SELECT p.*, f.idFamilia, f.nome_familia 
       FROM paciente p 
       LEFT JOIN familia f ON p.idFamilia = f.idFamilia 
       WHERE p.email = ?`,
      [email]
    );

    if (pacientes.length > 0) {
      user = pacientes[0];
      tipo = 'paciente';
    } else {
      // Se não encontrou como paciente, tenta como profissional
      const [profissionais] = await pool.execute(
        'SELECT * FROM profissional_saude WHERE email = ?',
        [email]
      );

      if (profissionais.length > 0) {
        user = profissionais[0];
        tipo = 'profissional';
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verifica senha
    const validPassword = await bcrypt.compare(senha, user.senha);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Prepara dados do usuário para o token e resposta
    let userData = {
      id: tipo === 'paciente' ? user.idPaciente : user.idProfissional,
      nome: user.nome,
      email: user.email,
      tipo: tipo
    };

    // Adiciona dados específicos do paciente
    if (tipo === 'paciente') {
      userData = {
        ...userData,
        sexo: user.sexo,
        data_nascimento: user.data_nascimento,
        diagnostico_previo: user.diagnostico_previo,
        painel_genetico: user.painel_genetico,
        idFamilia: user.idFamilia,
        nome_familia: user.nome_familia
      };
    }

    // Gera token
    const token = jwt.sign(
      userData,
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ROTA PARA VERIFICAR TOKEN (útil para o frontend)
router.get("/verificar", authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
});

export default router;