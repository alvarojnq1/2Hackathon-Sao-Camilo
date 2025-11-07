import { useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

export default function Login() {
  const [emailOrRA, setEmailOrRA] = useState("");
  const [senha, setSenha] = useState("");
  const [paginaAtual, setPaginaAtual] = useState("aluno"); // 'aluno' | 'professor'
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [alerta, setAlerta] = useState(null);

  // ---- refs para animações
  const scope = useRef(null);
  const leftRef = useRef(null);
  const cardRef = useRef(null);
  const fieldsRef = useRef(null);
  const enterBtnRef = useRef(null);

  const mostrarAlerta = (mensagem, sucesso) => {
    setAlerta({ mensagem, sucesso });
    setTimeout(() => setAlerta(null), 2000);
  };

  const login = async () => {
    const emailOuRA = emailOrRA.trim();
    const senhaValue = senha.trim();
    const rota = paginaAtual === "professor" ? "professores" : "alunos";
    const url = `http://localhost:5000/api/${rota}/login`;
    const body =
      paginaAtual === "professor"
        ? { email: emailOuRA, senha: senhaValue }
        : { ra: emailOuRA, senha: senhaValue };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("tipoUsuario", paginaAtual);
        window.location.href = "/aluno_protected";
      } else {
        mostrarAlerta("Erro no login. Verifique suas credenciais.", false);
      }
    } catch {
      mostrarAlerta("Erro na requisição. Tente novamente mais tarde.", false);
    }
  };

  // ---- animações GSAP
  useGSAP(
    () => {
      // entrada do painel azul
      gsap.from(leftRef.current, {
        x: "-8%",
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });

      // entrada do card
      gsap.from(cardRef.current, {
        y: 28,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.1,
      });

      // campos em stagger
      const items = fieldsRef.current
        ? Array.from(fieldsRef.current.querySelectorAll("[data-field]"))
        : [];
      gsap.from(items, {
        y: 16,
        opacity: 0,
        stagger: 0.07,
        duration: 0.5,
        ease: "power2.out",
        delay: 0.2,
      });

      // micro-interação do botão
      const onEnter = () =>
        gsap.to(enterBtnRef.current, { scale: 1.02, duration: 0.15, ease: "power2.out" });
      const onLeave = () =>
        gsap.to(enterBtnRef.current, { scale: 1, duration: 0.15, ease: "power2.out" });

      enterBtnRef.current?.addEventListener("mouseenter", onEnter);
      enterBtnRef.current?.addEventListener("mouseleave", onLeave);

      // cleanup
      return () => {
        enterBtnRef.current?.removeEventListener("mouseenter", onEnter);
        enterBtnRef.current?.removeEventListener("mouseleave", onLeave);
      };
    },
    { scope } // limita seletores ao componente
  );

  const TipoUsuarioBotao = ({ tipo }) => {
    const selecionado = paginaAtual.toLowerCase() === tipo.toLowerCase();
    return (
      <button
        type="button"
        onClick={() => setPaginaAtual(tipo.toLowerCase())}
        className={`w-1/2 py-2 rounded-full font-ubuntu text-sm md:text-base transition ${
          selecionado ? "bg-[#14b8a6] text-white shadow" : "text-gray-600"
        }`}
        data-field
      >
        {tipo}
      </button>
    );
  };

  return (
    <div ref={scope} className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* ALERTA */}
      {alerta && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div
            className={`px-6 py-4 rounded-lg shadow-lg ${
              alerta.sucesso ? "bg-green-500" : "bg-red-500"
            } text-white font-ubuntu`}
          >
            {alerta.mensagem}
          </div>
        </div>
      )}

      {/* ESQUERDA (painel azul) */}
      <aside
        ref={leftRef}
        className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-[#654AA9] via-[#14b8a6] to-[#654AA9] relative"
      >
        <div className="absolute right-0 top-0 h-full w-[2px] bg-white/70" />
        <div className="flex flex-col items-center gap-6 px-6 text-white">
          <div className="w-36 h-36 rounded-2xl bg-white/90 flex items-center justify-center shadow-lg">
            <span className="text-5xl font-bold text-[#0ea5e9]">P</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-ubuntu font-bold leading-none">Poliedro</h1>
          <h2 className="text-4xl lg:text-5xl font-ubuntu font-bold leading-none">Educação</h2>
          <p className="mt-2 text-white/90 font-ubuntu">Sistema de Gestão Educacional</p>
        </div>
      </aside>

      {/* DIREITA (card) */}
      <main className="flex items-center justify-center bg-white p-6">
        <div ref={cardRef} className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] px-6 py-6 md:px-8 md:py-8">
            <div className="text-center mb-4" data-field>
              <h3 className="text-2xl md:text-3xl font-bold font-ubuntu text-black">Bem-vindo!</h3>
              <p className="text-sm text-gray-500">Entre com suas credenciais</p>
            </div>

            {/* tabs pílula */}
            <div className="bg-gray-100 rounded-full p-1 flex items-center justify-between mb-6" ref={fieldsRef}>
              <TipoUsuarioBotao tipo="Professor" />
              <TipoUsuarioBotao tipo="Aluno" />
            </div>

            {/* Email/RA */}
            <div className="mb-4" data-field>
              <label className="block text-sm font-ubuntu text-black mb-2">
                {paginaAtual === "professor" ? "Email" : "RA"}
              </label>
              <input
                type="text"
                value={emailOrRA}
                onChange={(e) => setEmailOrRA(e.target.value)}
                placeholder={paginaAtual === "professor" ? "Digite seu email" : "Digite seu RA"}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b8a6] font-ubuntu caret-[#14b8a6] bg-gray-50"
              />
            </div>

            {/* Senha */}
            <div className="mb-4" data-field>
              <label className="block text-sm font-ubuntu text-black mb-2">Senha</label>
              <div className="relative">
                <input
                  type={senhaVisivel ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14b8a6] font-ubuntu caret-[#14b8a6] pr-10 bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => setSenhaVisivel(!senhaVisivel)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#14b8a6] focus:outline-none"
                >
                  {senhaVisivel ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* esqueci */}
            <div className="mb-6" data-field>
              <button
                onClick={() => (window.location.href = "/recuperar-senha")}
                className="text-sm font-ubuntu text-[#14b8a6] hover:underline focus:outline-none"
              >
                Esqueci minha senha
              </button>
            </div>

            {/* entrar */}
            <button
              ref={enterBtnRef}
              onClick={login}
              className="w-full bg-[#14b8a6] text-white font-ubuntu text-base md:text-lg py-3 rounded-2xl shadow hover:brightness-95 transition will-change-transform"
              data-field
            >
              Entrar
            </button>
          </div>
        </div>
      </main>

      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;700&display=swap");
        .font-ubuntu { font-family: "Ubuntu", sans-serif; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
