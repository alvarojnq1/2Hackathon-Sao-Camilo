// pages/paciente.js
import React, { useState } from 'react';
import '../App.css';
import Header from '../components/Header';
import FamilyCreation from '../components/FamilyCreation';
import FamilyMembers from '../components/FamilyMembers';

function PacientesPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [familyData, setFamilyData] = useState({
    nome_familia: '',
    members: []
  });

  const handleFamilyCreation = (familyName) => {
    setFamilyData(prev => ({ ...prev, nome_familia: familyName }));
    setCurrentStep(2);
  };

  const handleAddMember = (member) => {
    setFamilyData(prev => ({
      ...prev,
      members: [...prev.members, { ...member, id: Date.now() }]
    }));
  };

  const handleUpdateMember = (memberId, updatedData) => {
    setFamilyData(prev => ({
      ...prev,
      members: prev.members.map(member => 
        member.id === memberId ? { ...member, ...updatedData } : member
      )
    }));
  };

  const handleRemoveMember = (memberId) => {
    setFamilyData(prev => ({
      ...prev,
      members: prev.members.filter(member => member.id !== memberId)
    }));
  };

  return (
    <div className="App">
      <Header />
      <div className="container">
        {currentStep === 1 && (
          <FamilyCreation onFamilyCreate={handleFamilyCreation} />
        )}
        {currentStep === 2 && (
          <FamilyMembers
            familyName={familyData.nome_familia}
            members={familyData.members}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onRemoveMember={handleRemoveMember}
          />
        )}
      </div>
    </div>
  );
}

export default PacientesPage;