// Adicione esta rota ao seu backend (familia.js)

// Buscar perfil do usuário
router.get("/perfil", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [userData] = await pool.execute(
      `SELECT idPaciente, nome, email, data_nascimento, sexo, 
              diagnostico_previo, painel_genetico, porcentagem
       FROM paciente 
       WHERE idPaciente = ?`,
      [userId]
    );

    if (userData.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = userData[0];
    
    res.json({
      id: user.idPaciente,
      nome: user.nome,
      email: user.email,
      data_nascimento: user.data_nascimento,
      sexo: user.sexo,
      diagnostico_previo: Boolean(user.diagnostico_previo),
      painel_genetico: user.painel_genetico,
      porcentagem: parseFloat(user.porcentagem) || 0
    });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});