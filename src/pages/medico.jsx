import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { profissionalService, logout } from '../services/api';
import Navbar from "../components/navbar";

function Medico() {
  const [familias, setFamilias] = useState([]);
  const [familiaSelecionada, setFamiliaSelecionada] = useState(null);
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    carregarDadosUsuario();
    carregarFamilias();
  }, []);

  const carregarDadosUsuario = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const carregarFamilias = async () => {
    try {
      setCarregando(true);
      const resultado = await profissionalService.obterTodasFamilias();
      
      console.log('📊 Dados recebidos do backend:', resultado);
      
      // Debug: verifique os diagnósticos
      if (resultado.familias) {
        resultado.familias.forEach(familia => {
          familia.membros.forEach(membro => {
            console.log(`Membro: ${membro.nome}, Diagnóstico: ${membro.diagnostico_previo} (${typeof membro.diagnostico_previo})`);
          });
        });
        setFamilias(resultado.familias);
      }
    } catch (error) {
      console.error('Erro ao carregar famílias:', error);
      alert('Erro ao carregar famílias');
    } finally {
      setCarregando(false);
    }
  };

  const filtrarFamilias = () => {
    if (!termoPesquisa.trim()) {
      return familias;
    }
    
    return familias.filter(familia => 
      familia.nome_familia.toLowerCase().includes(termoPesquisa.toLowerCase())
    );
  };

  const calcularEstatisticas = (membros) => {
    const totalMembros = membros.length;
    
    const diagnosticos = {
      sim: membros.filter(m => m.diagnostico_previo === 1).length,
      nao: membros.filter(m => m.diagnostico_previo === 0).length
    };
    
    const paineis = {
      sim: membros.filter(m => m.painel_genetico && m.painel_genetico.trim() !== '').length,
      nao: membros.filter(m => !m.painel_genetico || m.painel_genetico.trim() === '').length
    };

    return {
      totalMembros,
      diagnosticoPercentual: totalMembros > 0 ? (diagnosticos.sim / totalMembros) * 100 : 0,
      painelPercentual: totalMembros > 0 ? (paineis.sim / totalMembros) * 100 : 0,
      diagnosticos,
      paineis
    };
  };

  const formatarDiagnostico = (diagnostico) => {
    return diagnostico === 1 ? 'Sim' : 'Não';
  };

  const formatarPainelGenetico = (painel) => {
    return painel && painel.trim() !== '' ? 'Sim' : 'Não';
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#9B7BFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando famílias...</p>
        </div>
      </div>
    );
  }

  const familiasFiltradas = filtrarFamilias();
  const estatisticas = familiaSelecionada ? 
    calcularEstatisticas(familiaSelecionada.membros) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
     <Navbar />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Famílias */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Famílias ({familias.length})
                </h2>
                
                {/* Campo de Pesquisa */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Pesquisar por nome da família..."
                    value={termoPesquisa}
                    onChange={(e) => setTermoPesquisa(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B7BFF] focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Lista de Famílias */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {familiasFiltradas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {termoPesquisa ? 'Nenhuma família encontrada' : 'Nenhuma família cadastrada'}
                  </div>
                ) : (
                  familiasFiltradas.map((familia) => (
                    <div
                      key={familia.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        familiaSelecionada?.id === familia.id
                          ? 'border-[#9B7BFF] bg-purple-50'
                          : 'border-gray-200 hover:border-[#9B7BFF]'
                      }`}
                      onClick={() => setFamiliaSelecionada(familia)}
                    >
                      <h3 className="font-semibold text-gray-800">{familia.nome_familia}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {familia.membros?.length || 0} membro(s)
                      </p>
                      <div className="text-xs text-gray-500 mt-1">
                        Diagnósticos: {familia.membros?.filter(m => m.diagnostico_previo === 1).length || 0} positivo(s)
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Detalhes da Família Selecionada */}
          <div className="lg:col-span-2">
            {familiaSelecionada ? (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Família {familiaSelecionada.nome_familia}
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Detalhes dos membros e análises genéticas
                  </p>
                </div>

                {/* Tabela de Membros */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Membros da Família ({familiaSelecionada.membros?.length || 0})
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200 rounded-lg">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                            Nome
                          </th>
                          <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                            Data Nasc.
                          </th>
                          <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                            Sexo
                          </th>
                          <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                            Diagnóstico Prévio
                          </th>
                          <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                            Painel Genético
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {familiaSelecionada.membros?.map((membro) => (
                          <tr key={membro.idPaciente} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-3 text-gray-700">
                              {membro.nome}
                            </td>
                            <td className="border border-gray-200 px-4 py-3 text-gray-600">
                              {membro.data_nascimento 
                                ? new Date(membro.data_nascimento).toLocaleDateString('pt-BR')
                                : 'Não informada'
                              }
                            </td>
                            <td className="border border-gray-200 px-4 py-3 text-gray-600">
                              {membro.sexo === 'M' ? 'Masculino' : membro.sexo === 'F' ? 'Feminino' : 'Outro'}
                            </td>
                            <td className="border border-gray-200 px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                formatarDiagnostico(membro.diagnostico_previo) === 'Sim'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {formatarDiagnostico(membro.diagnostico_previo)}
                              </span>
                            </td>
                            <td className="border border-gray-200 px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                formatarPainelGenetico(membro.painel_genetico) === 'Sim'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {formatarPainelGenetico(membro.painel_genetico)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Estatísticas */}
                {estatisticas && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Estatísticas da Família
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Diagnóstico Prévio */}
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">Diagnóstico Prévio</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Positivo:</span>
                            <span className="font-medium">{estatisticas.diagnosticos.sim} membros</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${estatisticas.diagnosticoPercentual}%` }}
                            ></div>
                          </div>
                          <div className="text-center text-sm font-medium text-gray-700">
                            {estatisticas.diagnosticoPercentual.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      {/* Painel Genético */}
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">Painel Genético</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Realizado:</span>
                            <span className="font-medium">{estatisticas.paineis.sim} membros</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${estatisticas.painelPercentual}%` }}
                            ></div>
                          </div>
                          <div className="text-center text-sm font-medium text-gray-700">
                            {estatisticas.painelPercentual.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-center text-sm text-gray-600">
                        Total de {estatisticas.totalMembros} membros na família
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Selecione uma família
                </h3>
                <p className="text-gray-500">
                  Clique em uma família da lista ao lado para ver os detalhes
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Medico;