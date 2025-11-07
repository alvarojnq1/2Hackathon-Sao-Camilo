// components/FamilyCreation.js
import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';

const FamilyCreation = ({ onFamilyCreate }) => {
  const [familyName, setFamilyName] = useState('');

  useEffect(() => {
    // Animação de entrada do formulário
    const tl = gsap.timeline();
    tl.fromTo('.family-creation-form',
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    );
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (familyName.trim()) {
      // Animação de saída antes de mudar de etapa
      const tl = gsap.timeline();
      tl.to('.family-creation-form', {
        y: -50,
        opacity: 0,
        duration: 0.5,
        ease: "power3.in",
        onComplete: () => onFamilyCreate(familyName)
      });
    }
  };

  return (
    <div className="family-creation">
      <div className="step-indicator">
        <div className="step active">1</div>
        <div className="step-line"></div>
        <div className="step">2</div>
        <div className="step-line"></div>
        <div className="step">3</div>
      </div>
      
      <div className="family-creation-form">
        <h2>Criar Nova Família</h2>
        <p className="description">
          Comece criando um nome para sua família. Este nome será usado para identificar 
          todos os membros do seu grupo familiar.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="familyName">Nome da Família</label>
            <input
              type="text"
              id="familyName"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="Ex: Família Silva, Família Santos..."
              required
            />
            <small>Escolha um nome que represente seu grupo familiar</small>
          </div>
          
          <button type="submit" className="btn-primary">
            Criar Família
          </button>
        </form>
      </div>
    </div>
  );
};

export default FamilyCreation;