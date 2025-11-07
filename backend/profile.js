import express from "express";
import { authenticateToken } from "./auth.js";
import pool from "./db.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";

const router = express.Router();

// Configuração do Nodemailer (Gmail)
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Seu email do Gmail
    pass: process.env.GMAIL_APP_PASSWORD // Senha de app do Gmail
  }
});

// Função para gerar senha aleatória
function gerarSenhaAleatoria(tamanho = 8) {
  return crypto.randomBytes(tamanho).toString('hex').slice(0, tamanho);
}

// Função para enviar email com senha
async function enviarEmailSenha(email, nome, senha) {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Bem-vindo à Família - Sua Senha de Acesso',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Bem-vindo à Plataforma Genética!</h2>
          <p>Olá <strong>${nome}</strong>,</p>
          <p>Você foi adicionado a uma família na nossa plataforma de análise genética.</p>
          <p>Sua conta foi criada com sucesso! Aqui estão seus dados de acesso:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Senha temporária:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${senha}</code></p>
          </div>
          <p><strong>Importante:</strong> Recomendamos que você altere esta senha no primeiro acesso.</p>
          <p>Para acessar a plataforma, visite: <a href="http://localhost:5173">http://localhost:5173</a></p>
          <br>
          <p>Atenciosamente,<br>Equipe Genética App</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado para:', email, 'ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return false;
  }
}

// Atualizar perfil (diagnóstico e painel genético)
router.put("/perfil", authenticateToken, async (req, res) => {
  try {
    const { diagnostico_previo, painel_genetico } = req.body;
    const userId = req.user.id;

    const [result] = await pool.execute(
      `UPDATE paciente 
       SET diagnostico_previo = ?, painel_genetico = ? 
       WHERE idPaciente = ?`,
      [diagnostico_previo, painel_genetico, userId]
    );

    res.json({ message: 'Perfil atualizado com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar família (e automaticamente adiciona o criador)
router.post("/familia", authenticateToken, async (req, res) => {
  try {
    const { nome_familia } = req.body;
    const userId = req.user.id;

    if (!nome_familia) {
      return res.status(400).json({ error: 'Nome da família é obrigatório' });
    }

    // Verifica se usuário já pertence a uma família
    const [userData] = await pool.execute(
      'SELECT idFamilia FROM paciente WHERE idPaciente = ?',
      [userId]
    );

    if (userData[0].idFamilia) {
      return res.status(400).json({ error: 'Você já pertence a uma família' });
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Cria a família
      const [familiaResult] = await connection.execute(
        'INSERT INTO familia (nome_familia, criador_idPaciente) VALUES (?, ?)',
        [nome_familia, userId]
      );

      const familiaId = familiaResult.insertId;

      // Atualiza o paciente para pertencer à família
      await connection.execute(
        'UPDATE paciente SET idFamilia = ? WHERE idPaciente = ?',
        [familiaId, userId]
      );

      await connection.commit();

      res.status(201).json({
        message: 'Família criada com sucesso',
        familia: {
          id: familiaId,
          nome_familia,
          criador_id: userId
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Erro ao criar família:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Já existe uma família com este nome' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Adicionar membro à família (com email opcional) - ATUALIZADA
router.post("/familia/membros", authenticateToken, async (req, res) => {
  try {
    const { nome, data_nascimento, sexo, email } = req.body;
    const userId = req.user.id;

    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    // Verifica se o usuário pertence a uma família
    const [userData] = await pool.execute(
      'SELECT idFamilia FROM paciente WHERE idPaciente = ?',
      [userId]
    );

    const userFamiliaId = userData[0].idFamilia;

    if (!userFamiliaId) {
      return res.status(400).json({ error: 'Você não pertence a nenhuma família' });
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      let pacienteId;
      let senhaGerada = null;
      let emailEnviado = false;

      if (email) {
        // Verifica se já existe um paciente com este email
        const [existingPatients] = await connection.execute(
          'SELECT idPaciente, idFamilia FROM paciente WHERE email = ?',
          [email]
        );

        if (existingPatients.length > 0) {
          const existingPatient = existingPatients[0];
          
          // Se já pertence a outra família, não pode adicionar
          if (existingPatient.idFamilia && existingPatient.idFamilia !== userFamiliaId) {
            await connection.rollback();
            return res.status(400).json({ error: 'Este usuário já pertence a outra família' });
          }
          
          // Se não pertence a família nenhuma ou já pertence à mesma família
          pacienteId = existingPatient.idPaciente;
          
          // Atualiza para a família atual
          await connection.execute(
            'UPDATE paciente SET idFamilia = ? WHERE idPaciente = ?',
            [userFamiliaId, pacienteId]
          );
        } else {
          // Gera senha aleatória
          senhaGerada = gerarSenhaAleatoria();
          const hashedPassword = await bcrypt.hash(senhaGerada, 10);
          
          // Cria novo paciente com email
          const [pacienteResult] = await connection.execute(
            `INSERT INTO paciente (nome, data_nascimento, sexo, email, senha, idFamilia) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nome, data_nascimento, sexo, email, hashedPassword, userFamiliaId]
          );
          pacienteId = pacienteResult.insertId;

          // Envia email com a senha
          if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
            emailEnviado = await enviarEmailSenha(email, nome, senhaGerada);
          } else {
            console.log('⚠️  Configuração de email não encontrada - pulando envio');
          }
        }
      } else {
        // Cria paciente sem email (membro falecido, etc.)
        const hashedPassword = await bcrypt.hash('', 10); // Senha vazia
        const [pacienteResult] = await connection.execute(
          `INSERT INTO paciente (nome, data_nascimento, sexo, email, senha, idFamilia) 
           VALUES (?, ?, ?, NULL, ?, ?)`,
          [nome, data_nascimento, sexo, hashedPassword, userFamiliaId]
        );
        pacienteId = pacienteResult.insertId;
      }

      await connection.commit();

      res.status(201).json({
        message: 'Membro adicionado com sucesso',
        membro: { 
          id: pacienteId, 
          nome, 
          data_nascimento, 
          sexo, 
          email,
          idFamilia: userFamiliaId
        },
        emailEnviado: emailEnviado,
        senhaGerada: email && !existingPatients?.length ? senhaGerada : undefined
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Erro ao adicionar membro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter dados da família do usuário
router.get("/minha-familia", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [userData] = await pool.execute(
      `SELECT p.idFamilia, f.nome_familia, f.criador_idPaciente
       FROM paciente p
       LEFT JOIN familia f ON p.idFamilia = f.idFamilia
       WHERE p.idPaciente = ?`,
      [userId]
    );

    if (!userData[0].idFamilia) {
      return res.json({ familia: null });
    }

    // Busca todos os membros da família
    const [membros] = await pool.execute(
      `SELECT idPaciente, nome, data_nascimento, sexo, email, 
              diagnostico_previo, painel_genetico
       FROM paciente 
       WHERE idFamilia = ?`,
      [userData[0].idFamilia]
    );

    res.json({
      familia: {
        id: userData[0].idFamilia,
        nome_familia: userData[0].nome_familia,
        criador_id: userData[0].criador_idPaciente,
        membros: membros
      }
    });

  } catch (error) {
    console.error('Erro ao buscar família:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Sair da família (remove o usuário da família)
router.delete("/familia/sair", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await pool.execute(
      'UPDATE paciente SET idFamilia = NULL WHERE idPaciente = ?',
      [userId]
    );

    res.json({ message: 'Você saiu da família com sucesso' });

  } catch (error) {
    console.error('Erro ao sair da família:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;