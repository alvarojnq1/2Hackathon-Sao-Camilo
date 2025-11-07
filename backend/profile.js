import express from "express";
import { authenticateToken } from "./auth.js";
import pool from "./db.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";

const router = express.Router();

/* ========= E-mail (Gmail) ========= */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

/* ========= Util: senha aleatória ========= */
function gerarSenhaAleatoria(tamanho = 8) {
  return crypto.randomBytes(tamanho).toString('hex').slice(0, tamanho);
}

/* ========= Util: e-mail com senha ========= */
async function enviarEmailSenha(email, nome, senha) {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Bem-vindo à Família - Sua Senha de Acesso',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7755CC;">Bem-vindo à Plataforma Genética!</h2>
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

/* ========= Rotas ========= */



/** Criar família e adicionar o criador */
router.post("/familia", authenticateToken, async (req, res) => {
  try {
    const { nome_familia } = req.body;
    const userId = req.user.id;

    if (!nome_familia) {
      return res.status(400).json({ error: 'Nome da família é obrigatório' });
    }

    const [userData] = await pool.execute(
      'SELECT idFamilia FROM paciente WHERE idPaciente = ?',
      [userId]
    );

    if (userData[0]?.idFamilia) {
      return res.status(400).json({ error: 'Você já pertence a uma família' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [familiaResult] = await connection.execute(
        'INSERT INTO familia (nome_familia, criador_idPaciente) VALUES (?, ?)',
        [nome_familia, userId]
      );
      const familiaId = familiaResult.insertId;

      await connection.execute(
        'UPDATE paciente SET idFamilia = ? WHERE idPaciente = ?',
        [familiaId, userId]
      );

      await connection.commit();

      res.status(201).json({
        message: 'Família criada com sucesso',
        familia: { id: familiaId, nome_familia, criador_id: userId }
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

/** Adicionar membro à família (com e sem e-mail) */
router.post("/familia/membros", authenticateToken, async (req, res) => {
  try {
    const { nome, data_nascimento, sexo, email } = req.body;
    const userId = req.user.id;

    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const [userData] = await pool.execute(
      'SELECT idFamilia FROM paciente WHERE idPaciente = ?',
      [userId]
    );
    const userFamiliaId = userData[0]?.idFamilia;

    if (!userFamiliaId) {
      return res.status(400).json({ error: 'Você não pertence a nenhuma família' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      let pacienteId;
      let senhaGerada = null;
      let emailEnviado = false;
      let existingPatients;

      if (email) {
        [existingPatients] = await connection.execute(
          'SELECT idPaciente, idFamilia FROM paciente WHERE email = ?',
          [email]
        );

        if (existingPatients.length > 0) {
          const existingPatient = existingPatients[0];
          if (existingPatient.idFamilia && existingPatient.idFamilia !== userFamiliaId) {
            await connection.rollback();
            return res.status(400).json({ error: 'Este usuário já pertence a outra família' });
          }

          pacienteId = existingPatient.idPaciente;
          await connection.execute(
            'UPDATE paciente SET idFamilia = ? WHERE idPaciente = ?',
            [userFamiliaId, pacienteId]
          );
        } else {
          senhaGerada = gerarSenhaAleatoria();
          const hashedPassword = await bcrypt.hash(senhaGerada, 10);

          const [pacienteResult] = await connection.execute(
            `INSERT INTO paciente (nome, data_nascimento, sexo, email, senha, idFamilia) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nome, data_nascimento ?? null, sexo ?? null, email, hashedPassword, userFamiliaId]
          );
          pacienteId = pacienteResult.insertId;

          if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
            emailEnviado = await enviarEmailSenha(email, nome, senhaGerada);
          } else {
            console.log('⚠️  Configuração de email não encontrada - pulando envio');
          }
        }
      } else {
        const hashedPassword = await bcrypt.hash('', 10); // senha vazia
        const [pacienteResult] = await connection.execute(
          `INSERT INTO paciente (nome, data_nascimento, sexo, email, senha, idFamilia) 
           VALUES (?, ?, ?, NULL, ?, ?)`,
          [nome, data_nascimento ?? null, sexo ?? null, hashedPassword, userFamiliaId]
        );
        pacienteId = pacienteResult.insertId;
      }

      await connection.commit();

      res.status(201).json({
        message: 'Membro adicionado com sucesso',
        membro: { 
          id: pacienteId, 
          nome, 
          data_nascimento: data_nascimento ?? null, 
          sexo: sexo ?? null, 
          email: email ?? null,
          idFamilia: userFamiliaId
        },
        emailEnviado,
        senhaGerada: email && (!existingPatients || existingPatients.length === 0) ? senhaGerada : undefined
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

/** Obter dados da família do usuário */
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

    if (!userData[0]?.idFamilia) {
      return res.json({ familia: null });
    }

    const familiaId = userData[0].idFamilia;

    const [membros] = await pool.execute(
      `SELECT idPaciente, nome, data_nascimento, sexo, email, 
              diagnostico_previo, painel_genetico
         FROM paciente
        WHERE idFamilia = ?`,
       [familiaId]
    );

    res.json({
      familia: {
        id: familiaId,
        nome_familia: userData[0].nome_familia,
        criador_id: userData[0].criador_idPaciente,
        membros
      }
    });

  } catch (error) {
    console.error('Erro ao buscar família:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/** Sair da família */
router.delete("/familia/sair", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.execute(
      'UPDATE paciente SET idFamilia = NULL WHERE idPaciente = ?',
      [userId]
    );

    res.json({ message: 'Você saiu da família com sucesso' });

  } catch (error) {
    console.error('Erro ao sair da família:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/** Buscar perfil do usuário */
router.get("/perfil", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [userData] = await pool.execute(
      `SELECT 
          idPaciente,
          nome,
          email,
          DATE_FORMAT(data_nascimento, '%Y-%m-%d') AS data_nascimento,
          sexo,
          diagnostico_previo,
          painel_genetico
       FROM paciente 
       WHERE idPaciente = ?`,
      [userId]
    );

    if (userData.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const u = userData[0];

    res.json({
      id: u.idPaciente,
      nome: u.nome,
      email: u.email,
      data_nascimento: u.data_nascimento || '',
      sexo: u.sexo || '',
      diagnostico_previo: Boolean(u.diagnostico_previo),
      painel_genetico: u.painel_genetico ?? null
    });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/** Atualizar perfil completo */
router.put("/perfil", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let { diagnostico_previo, painel_genetico, data_nascimento, sexo } = req.body;

    console.log('Dados recebidos para atualização:', req.body);

    // Normalizações
    diagnostico_previo = diagnostico_previo ? 1 : 0;
    painel_genetico = painel_genetico ?? null;
    data_nascimento = data_nascimento || null;
    sexo = (sexo === 'M' || sexo === 'F' || sexo === 'O') ? sexo : null;

    const [result] = await pool.execute(
      `UPDATE paciente 
         SET diagnostico_previo = ?, 
             painel_genetico = ?, 
             data_nascimento = ?, 
             sexo = ?
       WHERE idPaciente = ?`,
      [diagnostico_previo, painel_genetico, data_nascimento, sexo, userId]
    );

    console.log('Perfil atualizado com sucesso, linhas afetadas:', result.affectedRows);

    res.json({ 
      message: 'Perfil atualizado com sucesso',
      updated: true 
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});




export default router;
