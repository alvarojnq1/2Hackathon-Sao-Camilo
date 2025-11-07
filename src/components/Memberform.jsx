// components/MemberForm.js
import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';

const MemberForm = ({ member, onSave, onCancel, isEditing }) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    data_nascimento: '',
    sexo: '',
    diagnostico_previo: '' // Agora é string: 'sim' ou 'nao'
  });

  useEffect(() => {
    if (isEditing && member) {
      setFormData({
        nome: member.nome || '',
        email: member.email || '',
        data_nascimento: member.data_nascimento || '',
        sexo: member.sexo || '',
        diagnostico_previo: member.diagnostico_previo ? 'sim' : 'nao'
      });
    }

    const tl = gsap.timeline();
    tl.fromTo('.member-form',
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
    );
  }, [isEditing, member]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.nome && formData.data_nascimento && formData.sexo && formData.diagnostico_previo) {
      // Converter para o formato do backend
      const dataToSave = {
        ...formData,
        diagnostico_previo: formData.diagnostico_previo === 'sim'
      };
      onSave(dataToSave);
    }
  };

  return (
    <div className="member-form">
      <h3>{isEditing ? 'Editar Membro' : 'Adicionar Novo Membro'}</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nome">Nome Completo *</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Opcional"
            />
            <small>O email é opcional. Se informado, será usado para recuperação de senha.</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="data_nascimento">Data de Nascimento *</label>
            <input
              type="date"
              id="data_nascimento"
              name="data_nascimento"
              value={formData.data_nascimento}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="sexo">Sexo *</label>
            <select
              id="sexo"
              name="sexo"
              value={formData.sexo}
              onChange={handleChange}
              required
            >
              <option value="">Selecione</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="O">Outro</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="diagnostico_previo">Diagnóstico Prévio *</label>
            <select
              id="diagnostico_previo"
              name="diagnostico_previo"
              value={formData.diagnostico_previo}
              onChange={handleChange}
              required
            >
              <option value="">Selecione</option>
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {isEditing ? 'Atualizar Membro' : 'Adicionar Membro'}
          </button>
          <button type="button" className="btn-outline" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default MemberForm;