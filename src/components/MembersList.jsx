// components/MembersList.js
import React, { useEffect } from 'react';
import { gsap } from 'gsap';

const MembersList = ({ members, onEditMember, onRemoveMember }) => {
  useEffect(() => {
    if (members.length > 0) {
      gsap.fromTo('.member-card',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 }
      );
    }
  }, [members]);

  if (members.length === 0) {
    return (
      <div className="empty-state">
        <div className="dna-icon">🧬</div>
        <h3>Nenhum membro adicionado</h3>
        <p>Comece adicionando o primeiro membro da sua família</p>
      </div>
    );
  }

  return (
    <div className="members-list">
      <h3>Membros da Família ({members.length})</h3>
      <div className="members-grid">
        {members.map((member) => (
          <div key={member.id} className="member-card">
            <div className="member-avatar">
              {member.sexo === 'M' ? '👨' : member.sexo === 'F' ? '👩' : '👤'}
            </div>
            <div className="member-info">
              <h4>{member.nome}</h4>
              {member.email && <p>{member.email}</p>}
              <div className="member-details">
                <span>Nascimento: {new Date(member.data_nascimento).toLocaleDateString('pt-BR')}</span>
                {member.diagnostico_previo && (
                  <span className="diagnosis-badge">Diagnóstico Prévio</span>
                )}
              </div>
            </div>
            <div className="member-actions">
              <button 
                className="edit-btn"
                onClick={() => onEditMember(member)}
                aria-label="Editar membro"
                title="Editar membro"
              >
                ✏️
              </button>
              <button 
                className="remove-btn"
                onClick={() => onRemoveMember(member.id)}
                aria-label="Remover membro"
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

export default MembersList;