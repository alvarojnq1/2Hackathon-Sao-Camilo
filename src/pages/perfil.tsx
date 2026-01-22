import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import { User, Upload, Save, AlertCircle, CheckCircle, Activity, X } from 'lucide-react';

const Perfil = ({ isOpen, onClose }) => {
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

  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadUserProfile();
      animateEntrance();
    }
  }, [isOpen]);

  const loadUserProfile = async () => {
    setProfileLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE}/perfil`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`Erro ao carregar perfil`);

      const userProfile = await response.json();
      
      setUserData({
        nome: userProfile.nome || '',
        email: userProfile.email || '',
        data_nascimento: userProfile.data_nascimento || '',
        sexo: userProfile.sexo || '',
        diagnostico_previo: userProfile.diagnostico_previo || false,
      });

    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const animateEntrance = () => {
    const tl = gsap.timeline();
    if (overlayRef.current) {
        tl.fromTo(overlayRef.current, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.3 }
        );
    }
    if (modalRef.current) {
        tl.fromTo(modalRef.current,
        { scale: 0.8, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.2)" }, 
        "-=0.2"
        );
    }
  };

  const animateTabChange = (newTab) => {
    const tl = gsap.timeline();
    tl.to('.tab-content', {
      opacity: 0, y: 10, duration: 0.2, ease: "power2.in",
      onComplete: () => setActiveTab(newTab)
    })
    .to('.tab-content', {
      opacity: 1, y: 0, duration: 0.3, ease: "power2.out"
    });
  };

  const animateSuccess = () => {
    const successElement = document.querySelector('.profile-success');
    if (successElement) {
        gsap.fromTo(successElement,
        { scale: 0.8, opacity: 0, y: -10 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.7)",
            onComplete: () => {
            setTimeout(() => {
                gsap.to(successElement, { opacity: 0, duration: 0.3 });
            }, 3000);
            }
        }
        );
    }
  };

  const animateResults = () => {
    gsap.fromTo('.result-section', 
      { height: 0, opacity: 0 }, 
      { height: 'auto', opacity: 1, duration: 0.6, ease: "power3.out" }
    );
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/perfil`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_nascimento: userData.data_nascimento,
          sexo: userData.sexo,
          diagnostico_previo: userData.diagnostico_previo,
          painel_genetico: result?.painel_genetico?.total_percent || null
        })
      });
      if (!response.ok) throw new Error('Erro ao atualizar');
      animateSuccess();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const onSubmitExame = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("arquivo", file);
      const membrosFamilia = JSON.stringify([{ relacao: "paciente", possui_gene: userData.diagnostico_previo }]);
      formData.append("membros_familia", membrosFamilia);

      const resp = await fetch(`${PYTHON_API_BASE}/analisar-exame`, { method: "POST", body: formData });
      if (!resp.ok) throw new Error("Erro na análise");
      
      const json = await resp.json();
      setResult(json);
      await updateProfileWithGeneticPanel(json.painel_genetico?.total_percent);
      setTimeout(() => animateResults(), 100);

    } catch (err) {
      setError("Erro ao analisar o arquivo.");
    } finally {
      setLoading(false);
    }
  };

  const updateProfileWithGeneticPanel = async (painelPercent) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/perfil`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnostico_previo: userData.diagnostico_previo, painel_genetico: painelPercent })
      });
    } catch (error) { console.error(error); }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 font-ubuntu">
      {/* Background Escuro com Blur */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose} 
      ></div>

      {/* Card do Modal */}
      <div 
        ref={modalRef}
        className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col"
      >
        {/* Header do Modal */}
        <div className="sticky top-0 bg-white z-10 px-8 py-5 border-b border-gray-100 flex justify-between items-center rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-bold text-[#00817d]">Meu Perfil</h2>
            <p className="text-gray-500 text-sm">Gerencie seus dados e exames</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Loading State Inicial */}
        {profileLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#00817d] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Carregando informações...</p>
          </div>
        ) : (
          <div className="p-0">
            {/* Tabs */}
            <div className="px-8 pt-6">
              <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                <button
                  onClick={() => animateTabChange('profile')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'profile' 
                      ? 'bg-white text-[#00817d] shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <User size={18} /> Info Pessoais
                </button>
                <button
                  onClick={() => animateTabChange('exams')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'exams' 
                      ? 'bg-white text-[#00817d] shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Activity size={18} /> Painel Genético
                </button>
              </div>
            </div>

            {/* Conteúdo das Tabs */}
            <div className="px-8 pb-8 tab-content" ref={formRef}>

              {activeTab === 'profile' && (
                <form onSubmit={handleProfileUpdate} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Nome Completo</label>
                      <input type="text" value={userData.nome} disabled className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                      <input type="email" value={userData.email} disabled className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Data de Nascimento</label>
                      <input type="date" name="data_nascimento" value={userData.data_nascimento || ''} onChange={handleInputChange} required className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00817d] outline-none" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Sexo Biológico</label>
                      <select name="sexo" value={userData.sexo} onChange={handleInputChange} required className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00817d] outline-none">
                        <option value="">Selecione</option>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                    <input type="checkbox" name="diagnostico_previo" checked={userData.diagnostico_previo} onChange={handleInputChange} className="mt-1 w-5 h-5 accent-[#00817d]" />
                    <span className="text-sm text-gray-700"><strong>Diagnóstico Prévio:</strong> Possuo histórico pessoal confirmado de condição genética.</span>
                  </div>

                  {error && <div className="text-red-500 bg-red-50 p-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}
                  
                  <div className="profile-success hidden opacity-0 text-green-600 bg-green-50 p-3 rounded-lg text-sm flex items-center gap-2" style={{display: 'flex'}}>
                    <CheckCircle size={16}/> Dados atualizados!
                  </div>

                  <button type="submit" disabled={saving} className="w-full bg-[#00817d] text-white py-3 rounded-xl font-medium hover:bg-[#006e6a] transition shadow-md disabled:opacity-70 flex justify-center gap-2">
                    {saving ? 'Salvando...' : <><Save size={18} /> Salvar Alterações</>}
                  </button>
                </form>
              )}

              {activeTab === 'exams' && (
                <div className="space-y-6">
                  <div className="bg-[#00817d]/5 border border-[#00817d]/20 rounded-xl p-4 text-center">
                      <p className="text-[#00817d] text-sm font-medium">Envie seu laudo PDF para detecção de BRCA1/BRCA2 via IA.</p>
                  </div>

                  <form onSubmit={onSubmitExame} className="space-y-4">
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${file ? 'border-[#00817d] bg-[#00817d]/5' : 'border-gray-300 hover:bg-gray-50'}`}>
                      <input type="file" accept="application/pdf" onChange={onFileChange} className="hidden" id="file-upload" />
                      <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
                          <Upload className={`mx-auto mb-2 ${file ? 'text-[#00817d]' : 'text-gray-400'}`} size={32} />
                          <span className="text-gray-600 font-medium">{file ? file.name : "Clique para selecionar PDF"}</span>
                      </label>
                    </div>

                    <button type="submit" disabled={loading || !file} className="w-full bg-[#00817d] text-white py-3 rounded-xl font-medium hover:bg-[#006e6a] transition shadow-md disabled:opacity-50 flex justify-center gap-2">
                      {loading ? "Analisando..." : <><Activity size={18} /> Analisar Exame</>}
                    </button>
                  </form>

                  {result && (
                    <div className="result-section overflow-hidden">
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="font-bold text-gray-700">Risco Genético</span>
                          <span className="text-2xl font-bold text-[#00817d]">{result.painel_genetico?.total_percent}%</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>BRCA1:</span> 
                              <span className={result.referencias_encontradas?.BRCA1 ? "text-red-500 font-bold" : "text-green-500 font-bold"}>
                                {result.referencias_encontradas?.BRCA1 ? "DETECTADO" : "Não Detectado"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>BRCA2:</span> 
                              <span className={result.referencias_encontradas?.BRCA2 ? "text-red-500 font-bold" : "text-green-500 font-bold"}>
                                {result.referencias_encontradas?.BRCA2 ? "DETECTADO" : "Não Detectado"}
                              </span>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 leading-relaxed">
                          {result.mensagem_informativa}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap');
        .font-ubuntu { font-family: 'Ubuntu', sans-serif; }
      `}</style>
    </div>
  );
};

export default Perfil;