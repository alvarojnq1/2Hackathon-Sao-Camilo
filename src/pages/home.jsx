import React, { useState, useEffect } from 'react';
import { profileService, logout } from '../services/api';

function Home() {
  const [user, setUser] = useState(null);
  const [familia, setFamilia] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [etapa, setEtapa] = useState(1); // 1: Sem família, 2: Com família
  const [mostrarFormMembro, setMostrarFormMembro] = useState(false);

  useEffect(() => {
    carregarDadosUsuario();
    carregarFamilia();
  }, []);

  const carregarDadosUsuario = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const carregarFamilia = async () => {
    try {
      setCarregando(true);
      const resultado = await profileService.obterMinhaFamilia();
      
      if (resultado.familia) {
        setFamilia(resultado.familia);
        setEtapa(2); // Já tem família
      } else {
        setEtapa(1); // Precisa criar família
      }
    } catch (error) {
      console.error('Erro ao carregar família:', error);
    } finally {
      setCarregando(false);
    }
  };

  const handleCriarFamilia = async (nomeFamilia) => {
    try {
      const resultado = await profileService.criarFamilia(nomeFamilia);
      if (resultado.familia) {
        await carregarFamilia(); // Recarrega os dados
      }
    } catch (error) {
      console.error('Erro ao criar família:', error);
      alert(error.error || 'Erro ao criar família');
    }
  };

  const handleAdicionarMembro = async (dadosMembro) => {
    try {
      // Converter 'sim'/'nao' para 1/0 (TINYINT do MySQL) - CORRIGIDO
      const dadosFormatados = {
        ...dadosMembro,
        diagnostico_previo: dadosMembro.diagnostico_previo === 'sim' ? 1 : 0
      };

      console.log('📤 Enviando dados do membro:', dadosFormatados);

      const resultado = await profileService.adicionarMembro(dadosFormatados);
      if (resultado.membro) {
        await carregarFamilia(); // Recarrega para ver o novo membro
        setMostrarFormMembro(false);
        alert('Membro adicionado com sucesso!');
        return resultado;
      }
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      alert(error.error || 'Erro ao adicionar membro');
      throw error;
    }
  };

  const handleSairFamilia = async () => {
    if (confirm('Tem certeza que deseja sair da família?')) {
      try {
        await profileService.sairDaFamilia();
        setFamilia(null);
        setEtapa(1);
      } catch (error) {
        console.error('Erro ao sair da família:', error);
      }
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#9B7BFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-[#9B7BFF] rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-sm">🧬</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">GenoWeb</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-gray-700">
                  Olá, {user.nome}
                </span>
              )}
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {etapa === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <FamilyCreation onFamilyCreate={handleCriarFamilia} />
          </div>
        )}
        
        {etapa === 2 && familia && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  Família {familia.nome_familia}
                </h2>
                <p className="text-gray-600 mt-2">
                  Gerencie os membros da sua família
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setMostrarFormMembro(true)}
                  className="bg-[#9B7BFF] hover:bg-[#8B6BFF] text-white px-6 py-2 rounded-lg transition"
                >
                  + Adicionar Membro
                </button>
                <button
                  onClick={handleSairFamilia}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                >
                  Sair da Família
                </button>
              </div>
            </div>

            {mostrarFormMembro && (
              <div className="mb-8">
                <MemberForm 
                  onSave={handleAdicionarMembro}
                  onCancel={() => setMostrarFormMembro(false)}
                  isEditing={false}
                />
              </div>
            )}

            <MembersList 
              members={familia.membros || []}
              onEditMember={(membro) => {
                // Implementar edição se necessário
                console.log('Editar membro:', membro);
              }}
              onRemoveMember={(membroId) => {
                // Implementar remoção se necessário
                console.log('Remover membro:', membroId);
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}

// Componente FamilyCreation
const FamilyCreation = ({ onFamilyCreate }) => {
  const [familyName, setFamilyName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (familyName.trim()) {
      onFamilyCreate(familyName);
    }
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="text-6xl mb-4">🏠</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Criar Nova Família
        </h2>
        <p className="text-gray-600">
          Comece criando um nome para sua família. Este nome será usado para identificar 
          todos os membros do seu grupo familiar.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="mb-4">
          <label htmlFor="familyName" className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Família
          </label>
          <input
            type="text"
            id="familyName"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="Ex: Família Silva, Família Santos..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B7BFF] focus:border-transparent transition"
            required
          />
          <p className="text-sm text-gray-500 mt-2">
            Escolha um nome que represente seu grupo familiar
          </p>
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-[#9B7BFF] hover:bg-[#8B6BFF] text-white py-3 rounded-xl font-medium transition shadow-lg"
        >
          Criar Família
        </button>
      </form>
    </div>
  );
};

// Componente MemberForm (CORRIGIDO)
const MemberForm = ({ onSave, onCancel, isEditing, member }) => {
  const [formData, setFormData] = useState({
    nome: member?.nome || '',
    email: member?.email || '',
    data_nascimento: member?.data_nascimento || '',
    sexo: member?.sexo || '',
    diagnostico_previo: member?.diagnostico_previo !== undefined ? 
      (member.diagnostico_previo === 1 ? 'sim' : 'nao') : 'nao'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Campo alterado: ${name} = ${value}`);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('📝 Dados do formulário antes do envio:', formData);
    
    if (formData.nome && formData.data_nascimento && formData.sexo && formData.diagnostico_previo) {
      onSave(formData);
    } else {
      alert('Preencha todos os campos obrigatórios!');
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">
        {isEditing ? 'Editar Membro' : 'Adicionar Novo Membro'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome Completo *
          </label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9B7BFF]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Opcional"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9B7BFF]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Nascimento *
            </label>
            <input
              type="date"
              name="data_nascimento"
              value={formData.data_nascimento}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9B7BFF]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sexo *
            </label>
            <select
              name="sexo"
              value={formData.sexo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9B7BFF]"
              required
            >
              <option value="">Selecione</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="O">Outro</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Diagnóstico Prévio *
          </label>
          <select
            name="diagnostico_previo"
            value={formData.diagnostico_previo}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9B7BFF]"
            required
          >
            <option value="">Selecione</option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            className="bg-[#9B7BFF] hover:bg-[#8B6BFF] text-white px-6 py-2 rounded-lg transition"
          >
            {isEditing ? 'Atualizar' : 'Adicionar'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

// Componente MembersList
const MembersList = ({ members, onEditMember, onRemoveMember }) => {
  const formatarDiagnostico = (diagnostico) => {
    return diagnostico === 1 ? 'Sim' : 'Não';
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🧬</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Nenhum membro adicionado
        </h3>
        <p className="text-gray-500">
          Comece adicionando o primeiro membro da sua família
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">
        Membros da Família ({members.length})
      </h3>
      <div className="grid gap-4">
        {members.map((member) => (
          <div key={member.idPaciente} className="border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">
                {member.sexo === 'M' ? '👨' : member.sexo === 'F' ? '👩' : '👤'}
              </div>
              <div>
                <h4 className="font-semibold">{member.nome}</h4>
                {member.email && (
                  <p className="text-gray-600 text-sm">{member.email}</p>
                )}
                <div className="text-sm text-gray-500">
                  <span>Nascimento: {new Date(member.data_nascimento).toLocaleDateString('pt-BR')}</span>
                  {member.diagnostico_previo && (
                    <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                      Diagnóstico Prévio: {formatarDiagnostico(member.diagnostico_previo)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => onEditMember(member)}
                className="text-blue-600 hover:text-blue-800"
                title="Editar membro"
              >
                ✏️
              </button>
              <button 
                onClick={() => onRemoveMember(member.idPaciente)}
                className="text-red-600 hover:text-red-800"
                title="Remover membro"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;