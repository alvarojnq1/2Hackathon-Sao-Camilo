import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [emailOrRA, setEmailOrRA] = useState('');
  const [senha, setSenha] = useState('');
  const [paginaAtual, setPaginaAtual] = useState('aluno');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [alerta, setAlerta] = useState(null);

  const mostrarAlerta = (mensagem, sucesso) => {
    setAlerta({ mensagem, sucesso });
    setTimeout(() => {
      setAlerta(null);
    }, 2000);
  };

  const login = async () => {
    const emailOuRA = emailOrRA.trim();
    const senhaValue = senha.trim();
    const rota = paginaAtual === 'professor' ? 'professores' : 'alunos';
    const url = `http://localhost:5000/api/${rota}/login`;
    const body = paginaAtual === 'professor'
      ? { email: emailOuRA, senha: senhaValue }
      : { ra: emailOuRA, senha: senhaValue };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.token;

        // Salvar token e tipo de usuário no localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('tipoUsuario', paginaAtual);

        // Navegar para a página protegida
        window.location.href = '/aluno_protected';
      } else {
        mostrarAlerta('Erro no login. Verifique suas credenciais.', false);
      }
    } catch (e) {
      mostrarAlerta('Erro na requisição. Tente novamente mais tarde.', false);
    }
  };

  const TipoUsuarioBotao = ({ tipo }) => {
    const selecionado = paginaAtual.toLowerCase() === tipo.toLowerCase();
    const largura = tipo === 'Aluno' ? 'w-[50px]' : 'w-[70px]';

    return (
      <div className="flex flex-col items-center">
        <button
          onClick={() => setPaginaAtual(tipo.toLowerCase())}
          className="focus:outline-none"
        >
          <span
            className={`text-xl font-ubuntu ${
              selecionado
                ? 'font-bold text-[#4A90E2]'
                : 'font-normal text-black'
            }`}
          >
            {tipo}
          </span>
        </button>
        <div
          className={`h-[3px] ${largura} mt-1 ${
            selecionado ? 'bg-[#4A90E2]' : 'bg-transparent'
          }`}
        ></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      {/* Alerta */}
      {alerta && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div
            className={`px-6 py-4 rounded-lg shadow-lg ${
              alerta.sucesso ? 'bg-green-500' : 'bg-red-500'
            } text-white font-ubuntu`}
          >
            {alerta.mensagem}
          </div>
        </div>
      )}

      <div className="w-full max-w-md px-5">
        <div className="flex flex-col items-center mb-10">
          {/* Logo */}
          <div className="w-[139px] h-[200px] bg-gradient-to-b from-blue-400 to-blue-600 rounded-lg mb-4 flex items-center justify-center">
            <span className="text-white text-6xl font-bold">P</span>
          </div>
          
          {/* Título */}
          <h1 className="text-5xl font-bold font-ubuntu text-black">
            Poliedro
          </h1>
          <h2 className="text-5xl font-bold font-ubuntu text-[#4A90E2]">
            Educação
          </h2>
        </div>

        {/* Container do Formulário */}
        <div className="bg-white rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.26)] p-5">
          <h3 className="text-3xl font-bold font-ubuntu text-black mb-5">
            Login
          </h3>

          {/* Botões de Tipo de Usuário */}
          <div className="flex justify-center gap-5 mb-5">
            <TipoUsuarioBotao tipo="Professor" />
            <TipoUsuarioBotao tipo="Aluno" />
          </div>

          {/* Campo Email/RA */}
          <div className="mb-4">
            <label className="block text-base font-ubuntu text-black mb-2">
              {paginaAtual === 'professor' ? 'Email' : 'RA'}
            </label>
            <input
              type="text"
              value={emailOrRA}
              onChange={(e) => setEmailOrRA(e.target.value)}
              placeholder={
                paginaAtual === 'professor'
                  ? 'Digite seu email'
                  : 'Digite seu RA'
              }
              className="w-full px-3 py-2 border-2 border-[#4A90E2] rounded-lg focus:outline-none focus:border-[#4A90E2] font-ubuntu caret-[#4A90E2]"
            />
          </div>

          {/* Campo Senha */}
          <div className="mb-5">
            <label className="block text-base font-ubuntu text-black mb-2">
              Senha
            </label>
            <div className="relative">
              <input
                type={senhaVisivel ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full px-3 py-2 border-2 border-[#4A90E2] rounded-lg focus:outline-none focus:border-[#4A90E2] font-ubuntu caret-[#4A90E2] pr-10"
              />
              <button
                type="button"
                onClick={() => setSenhaVisivel(!senhaVisivel)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#4A90E2] focus:outline-none"
              >
                {senhaVisivel ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Esqueci minha senha */}
          <div className="mb-4">
            <button
              onClick={() => {
                window.location.href = '/recuperar-senha';
              }}
              className="text-base font-ubuntu text-[#4A90E2] hover:underline focus:outline-none"
            >
              Esqueci minha senha
            </button>
          </div>

          {/* Botão Entrar */}
          <button
            onClick={login}
            className="w-full bg-[#4A90E2] text-black font-ubuntu text-lg py-[18px] rounded-2xl border-2 border-black hover:bg-[#3a7bc8] transition-colors focus:outline-none"
          >
            Entrar
          </button>
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;700&display=swap');
        
        .font-ubuntu {
          font-family: 'Ubuntu', sans-serif;
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}