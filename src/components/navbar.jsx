import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Menu, X, Home } from 'lucide-react';
import logo from '../assets/logo.png'; 
import Perfil from '../pages/Perfil'; 

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleProfile = () => {
    setIsProfileOpen(true);
    setIsMenuOpen(false);
  };

  const handleHome = () => {
    navigate('/home');
    setIsMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ active, label, onClick, icon }) => {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium ${
          active 
            ? 'bg-white text-[#00817d] shadow-md' 
            : 'text-white hover:bg-white/10'
        }`}
      >
        {icon && <span>{icon}</span>}
        {label}
      </button>
    );
  };

  return (
    <>
      <nav className="bg-[#00817d] text-white shadow-lg sticky top-0 z-50 font-ubuntu">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition" 
              onClick={handleHome}
            >
              <div className="bg-white p-1.5 rounded-full shadow-sm">
                <img src={logo} alt="GenoWeb Logo" className="w-8 h-8 object-contain" />
              </div>
              <span className="text-2xl font-bold tracking-tight">GenoWeb</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex space-x-2 bg-[#006e6a] p-1 rounded-2xl">
                <NavLink 
                  active={isActive('/home')} 
                  label="Início" 
                  onClick={handleHome} 
                  icon={<Home size={18} />}
                />
                <NavLink 
                  active={isProfileOpen} 
                  label="Meu Perfil" 
                  onClick={handleProfile} 
                  icon={<User size={18} />}
                />
              </div>

              <div className="h-8 w-px bg-white/20 mx-2"></div>

              <div className="flex items-center gap-4 pl-2">
                <div className="text-right hidden lg:block">
                  <p className="text-xs text-blue-100 font-light">Bem-vindo,</p>
                  <p className="text-sm font-semibold leading-tight">{user?.nome || 'Usuário'}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleLogout} // Chama a função que redireciona
                    className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 transition text-white shadow-sm"
                    title="Sair"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg text-white hover:bg-white/10 transition focus:outline-none"
              >
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-white text-gray-800 border-t border-gray-100 shadow-xl absolute w-full left-0 animate-fade-in z-40">
            <div className="px-4 pt-6 pb-4 space-y-4">
              
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-[#00817d] text-white flex items-center justify-center text-xl font-bold border-2 border-[#00817d]">
                  {user?.nome?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-lg">{user?.nome || 'Usuário'}</p>
                  <p className="text-sm text-gray-500">{user?.email || ''}</p>
                </div>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={handleHome}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
                    isActive('/home') 
                      ? 'bg-[#00817d] text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Home size={20} /> Início
                </button>

              </div>

              <div className="pt-2 border-t border-gray-50 mt-2">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 font-medium transition"
                >
                  <LogOut size={20} />
                  Sair da Conta
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap');
          .font-ubuntu { font-family: 'Ubuntu', sans-serif; }
          
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in { animation: fade-in 0.2s ease-out; }
        `}</style>
      </nav>

      <Perfil 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </>
  );
};

export default Navbar;