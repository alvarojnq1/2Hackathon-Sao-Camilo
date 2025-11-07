// components/FamilyMembers.js
import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import MemberForm from './MemberForm';
import MembersList from './MembersList';

const FamilyMembers = ({ familyName, members, onAddMember, onUpdateMember, onRemoveMember }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo('.family-members-container',
      { x: 50, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    );
  }, []);

  const handleAddNewMember = (memberData) => {
    onAddMember(memberData);
    setShowForm(false);
    showSuccessMessage('Membro adicionado com sucesso!');
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setShowForm(true);
  };

  const handleUpdateMember = (memberData) => {
    onUpdateMember(editingMember.id, memberData);
    setShowForm(false);
    setEditingMember(null);
    showSuccessMessage('Membro atualizado com sucesso!');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingMember(null);
  };

  const showSuccessMessage = (message) => {
    const confirmation = document.querySelector('.member-added-confirmation');
    if (confirmation) {
      confirmation.textContent = message;
      gsap.fromTo(confirmation,
        { scale: 0, opacity: 0 },
        { 
          scale: 1, 
          opacity: 1, 
          duration: 0.5, 
          ease: "back.out(1.7)",
          onComplete: () => {
            setTimeout(() => {
              gsap.to(confirmation, {
                scale: 0,
                opacity: 0,
                duration: 0.3
              });
            }, 2000);
          }
        }
      );
    }
  };

  return (
    <div className="family-members-container">
      <div className="family-header">
        <h2>Família {familyName}</h2>
        <p>Gerencie os membros da sua família</p>
      </div>

      {!showForm ? (
        <div className="members-section">
          <MembersList 
            members={members} 
            onEditMember={handleEditMember}
            onRemoveMember={onRemoveMember}
          />
          
          <div className="actions">
            <button 
              className="btn-primary"
              onClick={() => setShowForm(true)}
            >
              + Adicionar Novo Membro
            </button>
          </div>
        </div>
      ) : (
        <MemberForm 
          member={editingMember}
          onSave={editingMember ? handleUpdateMember : handleAddNewMember}
          onCancel={handleCancel}
          isEditing={!!editingMember}
        />
      )}

      <div className="member-added-confirmation">
        Membro adicionado com sucesso!
      </div>
    </div>
  );
};

export default FamilyMembers;