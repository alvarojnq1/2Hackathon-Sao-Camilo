// components/Header.js
import React, { useEffect } from 'react';
import { gsap } from 'gsap';

const Header = () => {
  useEffect(() => {
    // Animação de entrada do DNA
    const tl = gsap.timeline();
    tl.fromTo('.dna-strand', 
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 1, ease: "back.out(1.7)" }
    );
  }, []);

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-section">
          <div className="dna-animation">
            <div className="dna-strand">
              <div className="dna-base"></div>
              <div className="dna-connector"></div>
              <div className="dna-base"></div>
              <div className="dna-connector"></div>
              <div className="dna-base"></div>
            </div>
          </div>
          <h1>GenoFamily</h1>
        </div>
        <p className="tagline">Conectando gerações através da genética</p>
      </div>
    </header>
  );
};

export default Header;