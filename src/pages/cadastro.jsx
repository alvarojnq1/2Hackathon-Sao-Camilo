import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/api';
import logo from '../assets/logo.png';

export default function Cadastro() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    sexo: '',
    data_nascimento: '',
    tipo: 'paciente', // 'paciente' | 'profissional'
  });

  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const mostrarAlerta = (mensagem, sucesso) => {
    setAlerta({ mensagem, sucesso });
    setTimeout(() => setAlerta(null), 3000);
  };

  const validarSenha = (senha) => /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(senha);
  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validarDataNascimento = (data) => {
    if (!data) return false;
    const dataNasc = new Date(data);
    const hoje = new Date();
    const idade = hoje.getFullYear() - dataNasc.getFullYear();
    return dataNasc instanceof Date && !isNaN(dataNasc) && idade >= 1 && idade <= 120;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { nome, email, senha, confirmarSenha, sexo, data_nascimento, tipo } = formData;

    if (!nome || !email || !senha || !confirmarSenha) {
      mostrarAlerta('Preencha todos os campos obrigatórios!', false);
      return;
    }
    if (tipo === 'paciente' && (!sexo || !data_nascimento)) {
      mostrarAlerta('Selecione o sexo e preencha a data de nascimento!', false);
      return;
    }
    if (!validarEmail(email)) {
      mostrarAlerta('Insira um email válido!', false);
      return;
    }
    if (senha !== confirmarSenha) {
      mostrarAlerta('As senhas não coincidem!', false);
      return;
    }

    if (!validarSenha(senha)) {
      mostrarAlerta('A senha deve ter pelo menos 8 caracteres, 1 letra maiúscula, 1 número e 1 símbolo!', false);
      return;
    }
    if (tipo === 'paciente' && !validarDataNascimento(data_nascimento)) {
      mostrarAlerta('Data de nascimento inválida (entre 1 e 120 anos).', false);
      return;
    }

    setCarregando(true);
    try {
      let resultado;
      
      if (tipo === 'paciente') {
        resultado = await authService.cadastrarPaciente({
          nome,
          email,
          senha,
          sexo,
          data_nascimento,
        });
      } else {
        resultado = await authService.cadastrarProfissional({
          nome,
          email,
          senha,
        });
      }

      if (resultado.token && resultado.user) {
        localStorage.setItem('token', resultado.token);
        localStorage.setItem('user', JSON.stringify(resultado.user));
        mostrarAlerta('Cadastro realizado com sucesso!', true);

        setTimeout(() => {
          window.location.href = tipo === 'paciente' ? '/home' : '/profissional';
        }, 1200);
      } else {
        mostrarAlerta(resultado.error || 'Erro no cadastro', false);
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      mostrarAlerta('Erro de conexão. Tente novamente.', false);
    } finally {
      setCarregando(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const TipoUsuarioBotao = ({ tipo, label }) => {
    const selecionado = formData.tipo === tipo;
    return (
      <button
        type="button"
        onClick={() => handleChange('tipo', tipo)}
        className={`flex-1 py-3 rounded-full font-medium transition-all ${
          selecionado 
            ? "bg-[#9B7BFF] text-white shadow-lg" 
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        {label}
      </button>
    );
  };

  // Calcular idade máxima e mínima para o date picker
  const hoje = new Date();
  const dataMinima = new Date(hoje.getFullYear() - 120, hoje.getMonth(), hoje.getDate());
  const dataMaxima = new Date(hoje.getFullYear() - 1, hoje.getMonth(), hoje.getDate());

  const TipoUsuarioBotao = ({ tipo, label }) => {
    const selecionado = formData.tipo === tipo;
    return (
      <button
        type="button"
        onClick={() => handleChange('tipo', tipo)}
        className={`w-1/2 py-3 rounded-full font-medium transition-all ${
          selecionado
            ? 'bg-[#00817d] text-white shadow-lg'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
      {/* Alerta */}
      {alerta && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div
            className={`px-6 py-3 rounded-lg shadow-lg ${
              alerta.sucesso ? "bg-green-500" : "bg-red-500"
            } text-white font-medium flex items-center gap-2`}
          >
            {alerta.sucesso ? '✅' : '❌'} {alerta.mensagem}
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#9B7BFF] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🧬</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Criar Conta</h1>
            <p className="text-gray-600">Junte-se à nossa plataforma</p>
          </div>

          {/* Seletor de Tipo */}
          <div className="bg-gray-100 rounded-full p-1 flex gap-1 mb-6">
            <TipoUsuarioBotao tipo="paciente" label="Paciente" />
            <TipoUsuarioBotao tipo="profissional" label="Profissional" />
          </div>

      {/* Lado Direito - Formulário */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Criar Conta</h2>
              <p className="text-gray-600">Junte-se à nossa plataforma</p>
            </div>

            {/* Seletor de Tipo */}
            <div className="bg-gray-100 rounded-full p-1 flex mb-6">
              <TipoUsuarioBotao tipo="paciente" label="Paciente" />
              <TipoUsuarioBotao tipo="profissional" label="Profissional" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B7BFF] focus:border-transparent transition"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B7BFF] focus:border-transparent transition"
                  required
                />
              </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Senha *
              </label>
              <input
                type={senhaVisivel ? "text" : "password"}
                value={formData.confirmarSenha}
                onChange={(e) => handleChange('confirmarSenha', e.target.value)}
                placeholder="Repita sua senha"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9B7BFF] focus:border-transparent transition"
                required
              />
            </div>

            {/* Botão de Cadastro */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-[#9B7BFF] text-white py-3 rounded-xl font-medium hover:bg-[#8B6BFF] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl mt-6"
            >
              {carregando ? "Cadastrando..." : "Criar Conta"}
            </button>

            {/* Link para login */}
            <div className="text-center">
              <p className="text-gray-600">
                Já tem uma conta?{" "}
                <a href="/login" className="text-[#9B7BFF] hover:underline font-medium">
                  Fazer login
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
