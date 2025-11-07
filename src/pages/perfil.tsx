// pages/ProfilePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import '../ProfilePage.css';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState({
    nome: '',
    email: '',
    data_nascimento: '',
    sexo: '',
    diagnostico_previo: false,
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const navigate = useNavigate();
  const API_BASE = "http://localhost:3000/api"; 
  const PYTHON_API_BASE = "http://localhost:8000";

  // Refs para animações GSAP
  const profileContainerRef = useRef(null);
  const headerRef = useRef(null);
  const tabsRef = useRef(null);
  const formRef = useRef(null);
  const successRef = useRef(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      setProfileLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        console.log('Buscando perfil do usuário...');
        
        const response = await fetch(`${API_BASE}/perfil`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Resposta do servidor:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Erro na resposta:', errorText);
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const userProfile = await response.json();
        console.log('Perfil carregado:', userProfile);
        
        // Atualiza os dados do usuário
        setUserData({
          nome: userProfile.nome || '',
          email: userProfile.email || '',
          data_nascimento: userProfile.data_nascimento || '',
          sexo: userProfile.sexo || '',
          diagnostico_previo: userProfile.diagnostico_previo || false,
        });

        // Animação de entrada após carregar dados
        animatePageEntrance();

      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        setError(`Erro ao carregar dados do perfil: ${error.message}`);
        animateError();
      } finally {
        setProfileLoading(false);
      }
    };

    loadUserProfile();
  }, [navigate]);

  // Animação de entrada da página
  const animatePageEntrance = () => {
    const tl = gsap.timeline();
    
    tl.fromTo(headerRef.current,
      { y: -50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    )
    .fromTo(tabsRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.7)" },
      "-=0.4"
    )
    .fromTo(formRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
      "-=0.3"
    );
  };

  // Animação de erro
  const animateError = () => {
    gsap.fromTo('.error-message',
      { scale: 0, opacity: 0 },
      { 
        scale: 1, 
        opacity: 1, 
        duration: 0.5, 
        ease: "back.out(1.7)",
        y: 0
      }
    );
  };

  // Animação de troca de tabs
  const animateTabChange = (newTab) => {
    const tl = gsap.timeline();
    
    tl.to('.tab-content > *', {
      opacity: 0,
      y: 20,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        setActiveTab(newTab);
      }
    })
    .to('.tab-content > *', {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: "power2.out"
    }, "+=0.1");
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      console.log('Enviando atualização:', userData);
      
      const response = await fetch(`${API_BASE}/perfil`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data_nascimento: userData.data_nascimento,
          sexo: userData.sexo,
          diagnostico_previo: userData.diagnostico_previo,
          painel_genetico: result?.painel_genetico?.total_percent || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ${response.status} ao atualizar perfil`);
      }

      const resultData = await response.json();
      console.log('Perfil atualizado com sucesso:', resultData);
      
      // Animação de sucesso
      animateSuccess();
      
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setError(error.message);
      animateError();
    } finally {
      setSaving(false);
    }
  };

  // Animação de sucesso
  const animateSuccess = () => {
    const successElement = document.querySelector('.profile-success');
    
    gsap.fromTo(successElement,
      { 
        scale: 0, 
        opacity: 0,
        y: -50 
      },
      { 
        scale: 1, 
        opacity: 1,
        y: 0,
        duration: 0.6, 
        ease: "back.out(1.7)",
        onComplete: () => {
          // Adiciona pulso contínuo
          gsap.to(successElement, {
            scale: 1.05,
            duration: 0.5,
            repeat: -1,
            yoyo: true,
            ease: "power1.inOut"
          });
          
          setTimeout(() => {
            gsap.to(successElement, {
              scale: 0,
              opacity: 0,
              duration: 0.4,
              ease: "power2.in",
              onComplete: () => {
                gsap.killTweensOf(successElement);
              }
            });
          }, 3000);
        }
      }
    );
  };

  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      
      // Animação do arquivo selecionado
      gsap.fromTo('.file-selected',
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" }
      );
    }
  };

  const onSubmitExame = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!file) {
      setError("Selecione um PDF primeiro.");
      animateError();
      return;
    }

    try {
      setLoading(true);
      
      // Animação de loading
      gsap.to('.btn-primary', {
        scale: 0.95,
        duration: 0.2,
        ease: "power2.inOut"
      });

      const formData = new FormData();
      formData.append("arquivo", file);

      const membrosFamilia = JSON.stringify([
        { 
          relacao: "paciente", 
          possui_gene: userData.diagnostico_previo 
        }
      ]);
      formData.append("membros_familia", membrosFamilia);

      const resp = await fetch(`${PYTHON_API_BASE}/analisar-exame`, {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || `Falha HTTP ${resp.status}`);
      }
      
      const json = await resp.json();
      setResult(json);
      
      // Atualiza automaticamente o perfil com o resultado do painel genético
      await updateProfileWithGeneticPanel(json.painel_genetico?.total_percent);
      
      // Animação de resultado
      animateResults();
      
    } catch (err) {
      setError(err?.message || "Erro desconhecido ao enviar.");
      animateError();
    } finally {
      setLoading(false);
      gsap.to('.btn-primary', {
        scale: 1,
        duration: 0.3,
        ease: "back.out(1.7)"
      });
    }
  };

  // Animação dos resultados
  const animateResults = () => {
    const tl = gsap.timeline();
    
    tl.fromTo('.result-section',
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    )
    .fromTo('.result-card',
      { 
        scale: 0.8, 
        opacity: 0,
        rotationY: -15 
      },
      { 
        scale: 1, 
        opacity: 1,
        rotationY: 0,
        duration: 0.6,
        stagger: 0.2,
        ease: "back.out(1.7)"
      },
      "-=0.4"
    )
    .fromTo('.message-card',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      "-=0.3"
    );
  };

  const updateProfileWithGeneticPanel = async (painelPercent) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/perfil`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          diagnostico_previo: userData.diagnostico_previo,
          painel_genetico: painelPercent
        })
      });
    } catch (error) {
      console.error('Erro ao atualizar painel genético:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Animação sutil no input alterado
    if (type !== 'checkbox') {
      gsap.fromTo(e.target, 
        { scale: 1 },
        { scale: 1.02, duration: 0.1, yoyo: true, repeat: 1 }
      );
    }
  };

  const handleTabClick = (tab) => {
    animateTabChange(tab);
  };

  if (profileLoading) {
    return (
      <div className="App">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner-large"></div>
            <p>Carregando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="container">
        <div className="profile-container" ref={profileContainerRef}>
          <div className="profile-header" ref={headerRef}>
            <h1>Meu Perfil</h1>
            <p>Gerencie suas informações pessoais e exames genéticos</p>
          </div>

          <div className="profile-tabs" ref={tabsRef}>
            <button 
              className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => handleTabClick('profile')}
            >
              👤 Informações Pessoais
            </button>
            <button 
              className={`tab-button ${activeTab === 'exams' ? 'active' : ''}`}
              onClick={() => handleTabClick('exams')}
            >
              🧬 Upload de Exames
            </button>
          </div>

          <div className="tab-content" ref={formRef}>
            {activeTab === 'profile' && (
              <div className="profile-form-section">
                <form onSubmit={handleProfileUpdate} className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="nome">Nome Completo *</label>
                      <input
                        type="text"
                        id="nome"
                        name="nome"
                        value={userData.nome}
                        onChange={handleInputChange}
                        required
                        disabled
                      />
                      <small>Nome não pode ser alterado</small>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={userData.email}
                        onChange={handleInputChange}
                        placeholder="seu@email.com"
                        disabled
                      />
                      <small>Email não pode ser alterado</small>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="data_nascimento">Data de Nascimento *</label>
                      <input
                        type="date"
                        id="data_nascimento"
                        name="data_nascimento"
                        value={userData.data_nascimento || ''}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="sexo">Sexo *</label>
                      <select
                        id="sexo"
                        name="sexo"
                        value={userData.sexo}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Selecione</option>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                        <option value="O">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="diagnostico_previo"
                        checked={userData.diagnostico_previo}
                        onChange={handleInputChange}
                      />
                      <span className="checkmark"></span>
                      Possui diagnóstico prévio de condição genética
                    </label>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="btn-primary"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="loading-spinner"></span>
                          Salvando...
                        </>
                      ) : (
                        '💾 Atualizar Perfil'
                      )}
                    </button>
                  </div>
                </form>

                {error && (
                  <div className="error-message">
                    ⚠️ {error}
                  </div>
                )}

                <div className="profile-success">
                  ✅ Perfil atualizado com sucesso!
                </div>
              </div>
            )}

            {activeTab === 'exams' && (
              <div className="upload-section">
                <div className="upload-info">
                  <h3>Upload do Exame Genético BRCA</h3>
                  <p>
                    Envie o PDF do seu laudo genético para análise automática. 
                    O sistema irá analisar a presença dos genes BRCA1 e BRCA2.
                  </p>
                  <div className="privacy-notice">
                    <strong>⚠️ Importante:</strong> Por questões de LGPD, você só pode enviar 
                    seus próprios exames. O diagnóstico prévio informado no seu perfil será 
                    utilizado para o cálculo do painel genético.
                  </div>
                </div>

                <form onSubmit={onSubmitExame} className="upload-form">
                  <div className="form-group">
                    <label className="file-label">
                      <span>Arquivo PDF do Exame *</span>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={onFileChange}
                        className="file-input"
                      />
                      <div className="file-custom">
                        {file ? file.name : 'Selecionar arquivo PDF'}
                      </div>
                    </label>
                    {file && (
                      <p className="file-selected">📎 Arquivo selecionado: {file.name}</p>
                    )}
                  </div>

                  <div className="analysis-info">
                    <h4>Informações que serão utilizadas na análise:</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Diagnóstico prévio:</span>
                        <span className={`info-value ${userData.diagnostico_previo ? 'positive' : 'negative'}`}>
                          {userData.diagnostico_previo ? 'Sim' : 'Não'}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Status do gene:</span>
                        <span className="info-value">
                          Será detectado automaticamente no exame
                        </span>
                      </div>
                    </div>
                    <p className="info-note">
                      Para alterar o diagnóstico prévio, atualize suas informações na aba "Informações Pessoais".
                    </p>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      disabled={loading || !file}
                      className="btn-primary"
                    >
                      {loading ? (
                        <>
                          <span className="loading-spinner"></span>
                          Analisando PDF...
                        </>
                      ) : (
                        '📊 Analisar Exame'
                      )}
                    </button>
                  </div>

                  {error && (
                    <div className="error-message">
                      ⚠️ {error}
                    </div>
                  )}
                </form>

                {result && (
                  <div className="result-section">
                    <h3>📋 Resultado da Análise</h3>

                    <div className="result-grid">
                      <div className="result-card">
                        <h4>Resumo da Análise</h4>
                        <div className="result-info">
                          <div className="info-item">
                            <span className="label">Paciente tem genes:</span>
                            <span className={`value ${result.paciente_tem_genes ? 'positive' : 'negative'}`}>
                              {result.paciente_tem_genes ? "Sim" : "Não"}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="label">BRCA1 encontrado:</span>
                            <span className={`value ${result.referencias_encontradas?.BRCA1 ? 'positive' : 'negative'}`}>
                              {result.referencias_encontradas?.BRCA1 ? "Sim" : "Não"}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="label">BRCA2 encontrado:</span>
                            <span className={`value ${result.referencias_encontradas?.BRCA2 ? 'positive' : 'negative'}`}>
                              {result.referencias_encontradas?.BRCA2 ? "Sim" : "Não"}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="label">Painel total:</span>
                            <span className="value highlight">
                              {result.painel_genetico?.total_percent}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="result-card">
                        <h4>Painel Genético</h4>
                        <div className="panel-info">
                          {result.painel_genetico?.por_membro &&
                            Object.entries(result.painel_genetico.por_membro).map(([key, value]) => (
                              <div key={key} className="panel-item">
                                <span className="generation">{key}:</span>
                                <span className="percentage">{value}%</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>

                    <div className="message-card">
                      <h4>Mensagem Informativa</h4>
                      <div className="message-content">
                        {result.mensagem_informativa
                          ?.split("\n")
                          .map((line, idx) => (
                            <p key={idx}>{line}</p>
                          ))}
                      </div>
                    </div>

                    <details className="debug-section">
                      <summary>🔍 Detalhes Técnicos (JSON)</summary>
                      <pre className="debug-content">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;