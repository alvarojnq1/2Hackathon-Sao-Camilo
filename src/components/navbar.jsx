// components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Menu, X } from 'lucide-react';
import '../../Navbar.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    navigate('/perfil');
    setIsMenuOpen(false);
  };

  const handleHome = () => {
    navigate('/home');
    setIsMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-brand" onClick={handleHome}>
          <div className="navbar-logo">
            <span className="logo-icon">🧬</span>
            <span className="logo-text">GenoWeb</span>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="navbar-menu">
          <div className="navbar-links">
            <button 
              className={`nav-link ${isActive('/home') ? 'active' : ''}`}
              onClick={handleHome}
            >
              Início
            </button>
            <button 
              className={`nav-link ${isActive('/perfil') ? 'active' : ''}`}
              onClick={handleProfile}
            >
              Meu Perfil
            </button>
          </div>

          <div className="navbar-user">
            <div className="user-info">
              <span className="welcome-text">Bem-vindo,</span>
              <span className="user-name">{user?.nome || 'Usuário'}</span>
            </div>
            
            <div className="user-actions">
              <button 
                className="profile-btn"
                onClick={handleProfile}
                title="Meu Perfil"
              >
                <User size={18} />
              </button>
              
              <button 
                className="logout-btn"
                onClick={handleLogout}
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="mobile-menu">
            <div className="mobile-user-info">
              <div className="user-avatar">
                {user?.nome?.charAt(0) || 'U'}
              </div>
              <div className="mobile-user-details">
                <span className="user-name">{user?.nome || 'Usuário'}</span>
                <span className="user-email">{user?.email || ''}</span>
              </div>
            </div>

            <div className="mobile-links">
              <button 
                className={`mobile-link ${isActive('/home') ? 'active' : ''}`}
                onClick={handleHome}
              >
                <span>🏠</span>
                Início
              </button>
              
              <button 
                className={`mobile-link ${isActive('/perfil') ? 'active' : ''}`}
                onClick={handleProfile}
              >
                <span>👤</span>
                Meu Perfil
              </button>
            </div>

            <div className="mobile-actions">
              <button 
                className="mobile-logout-btn"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;