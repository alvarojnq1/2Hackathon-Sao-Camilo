import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { authService } from "./services/api";
import Login from "./pages/login";
import Cadastro from "./pages/cadastro";
import Home from "./pages/home";
import ProfissionalPage from "./pages/profissional"; // ADICIONE ESTA IMPORT
import "./global.css";

// Componente de rota protegida
const ProtectedRoute = ({ children }) => {
  const [verificando, setVerificando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    const verificarAutenticacao = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const resultado = await authService.verificarToken();
          if (resultado.valid) {
            setAutenticado(true);
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setVerificando(false);
      }
    };

    verificarAutenticacao();
  }, []);

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#9B7BFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return autenticado ? children : <Navigate to="/login" />;
};

// Componente de rota protegida com verificação de tipo de usuário
const ProtectedRouteComTipo = ({ children, tipoRequerido }) => {
  const [verificando, setVerificando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    const verificarAutorizacao = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          if (user.tipo === tipoRequerido) {
            setAutorizado(true);
          } else {
            // Redireciona para a página apropriada baseada no tipo do usuário
            if (user.tipo === 'paciente') {
              window.location.href = '/home';
            } else {
              window.location.href = '/profissional';
            }
            return;
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Erro ao verificar autorização:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setVerificando(false);
      }
    };

    verificarAutorizacao();
  }, [tipoRequerido]);

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#9B7BFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return autorizado ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        
        {/* Rota protegida para pacientes */}
        <Route 
          path="/home" 
          element={
            <ProtectedRouteComTipo tipoRequerido="paciente">
              <Home />
            </ProtectedRouteComTipo>
          } 
        />
        
        {/* Rota protegida para profissionais - NOVA ROTA */}
        <Route 
          path="/profissional" 
          element={
            <ProtectedRouteComTipo tipoRequerido="profissional">
              <ProfissionalPage />
            </ProtectedRouteComTipo>
          } 
        />
        
        {/* Rota padrão */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Rota fallback para 404 */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;