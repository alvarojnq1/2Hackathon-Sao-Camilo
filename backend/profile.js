import express from "express";
import { authenticateToken } from "./auth.js";
import pool from "./db.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Rota para profissional obter todas as famílias
router.get("/profissional/familias", authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Rota /profissional/familias acessada');
    
    // Verifica se o usuário é um profissional
    if (req.user.tipo !== 'profissional') {
      return res.status(403).json({ error: 'Acesso permitido apenas para profissionais' });
    }

    // Busca todas as famílias
    const [familias] = await pool.execute(
      `SELECT f.idFamilia, f.nome_familia, f.criador_idPaciente
       FROM familia f`
    );

    // Para cada família, busca os membros
    const familiasComMembros = await Promise.all(
      familias.map(async (familia) => {
        const [membros] = await pool.execute(
          `SELECT idPaciente, nome, data_nascimento, sexo, email, 
                  diagnostico_previo, painel_genetico
           FROM paciente 
           WHERE idFamilia = ?`,
          [familia.idFamilia]
        );

        return {
          id: familia.idFamilia,
          nome_familia: familia.nome_familia,
          criador_id: familia.criador_idPaciente,
          membros: membros
        };
      })
    );

    res.json({
      familias: familiasComMembros
    });

  } catch (error) {
    console.error('❌ Erro ao buscar famílias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
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
    console.log('✅ Email enviado para:', email);
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

// Adicionar membro à família (CORRIGIDO - diagnóstico funcionando)
router.post("/familia/membros", authenticateToken, async (req, res) => {
  try {
    const { nome, data_nascimento, sexo, email, diagnostico_previo } = req.body;

    console.log('📥 Dados recebidos para adicionar membro:', {
      nome, data_nascimento, sexo, email, diagnostico_previo
    });

    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    // Verifica se o usuário pertence a uma família
    const [userData] = await pool.execute(
      'SELECT idFamilia FROM paciente WHERE idPaciente = ?',
      [req.user.id]
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
      let pacienteExistente = false;

      // CORREÇÃO: Converter 'sim'/'nao' para 1/0 de forma confiável
      const diagnosticoValue = diagnostico_previo === 'sim' ? 1 : 0;
      console.log(`🔧 Diagnóstico convertido: "${diagnostico_previo}" -> ${diagnosticoValue}`);

      if (email && email.trim() !== '') {
        // Verifica se já existe um paciente com este email
        const [existingPatients] = await connection.execute(
          'SELECT idPaciente, idFamilia FROM paciente WHERE email = ?',
          [email]
        );

        if (existingPatients.length > 0) {
          const existingPatient = existingPatients[0];
          pacienteExistente = true;
          
          // Se já pertence a outra família, não pode adicionar
          if (existingPatient.idFamilia && existingPatient.idFamilia !== userFamiliaId) {
            await connection.rollback();
            return res.status(400).json({ error: 'Este usuário já pertence a outra família' });
          }
          
          pacienteId = existingPatient.idPaciente;
          
          // Atualiza para a família atual e diagnostico_previo
          await connection.execute(
            'UPDATE paciente SET idFamilia = ?, diagnostico_previo = ? WHERE idPaciente = ?',
            [userFamiliaId, diagnosticoValue, pacienteId]
          );
          
          console.log(`✅ Paciente existente atualizado: ${nome}, diagnóstico: ${diagnosticoValue}`);
        } else {
          // Gera senha aleatória
          senhaGerada = gerarSenhaAleatoria();
          const hashedPassword = await bcrypt.hash(senhaGerada, 10);
          
          // Cria novo paciente com email e diagnostico_previo
          const [pacienteResult] = await connection.execute(
            `INSERT INTO paciente (nome, data_nascimento, sexo, email, senha, diagnostico_previo, idFamilia) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nome, data_nascimento, sexo, email, hashedPassword, diagnosticoValue, userFamiliaId]
          );
          pacienteId = pacienteResult.insertId;

          console.log(`✅ Novo paciente criado: ${nome}, diagnóstico: ${diagnosticoValue}`);

          // Envia email com a senha
          if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
            emailEnviado = await enviarEmailSenha(email, nome, senhaGerada);
          }
        }
      } else {
        // Cria paciente sem email com diagnostico_previo
        const hashedPassword = await bcrypt.hash('', 10);
        const [pacienteResult] = await connection.execute(
          `INSERT INTO paciente (nome, data_nascimento, sexo, email, senha, diagnostico_previo, idFamilia) 
           VALUES (?, ?, ?, NULL, ?, ?, ?)`,
          [nome, data_nascimento, sexo, hashedPassword, diagnosticoValue, userFamiliaId]
        );
        pacienteId = pacienteResult.insertId;
        
        console.log(`✅ Paciente sem email criado: ${nome}, diagnóstico: ${diagnosticoValue}`);
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
          diagnostico_previo: diagnosticoValue,
          idFamilia: userFamiliaId
        },
        emailEnviado: emailEnviado,
        senhaGerada: email && !pacienteExistente ? senhaGerada : undefined
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