
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDb, saveDb } from '../services/mockDatabase';
import { SKILLS_LIST, RJ_COORDS, Icons } from '../constants';
import { Role } from '../types';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: '', 
    email: '',
    phone: '',
    password: '',
    company_name: '',
    owner_name: '',
    cnpj: '',
    municipal_registration: '',
    segment: 'Varejo',
    address_neighborhood: 'Copacabana',
    full_address: '',
    zip_code: '',
    commercial_phone: '',
    skills: [] as string[],
    bio: ''
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms) {
      alert("Você deve aceitar os termos de uso e privacidade.");
      return;
    }

    const db = getDb();
    if (db.profiles.some(p => p.email === formData.email)) {
      alert("Este e-mail já está cadastrado.");
      return;
    }

    const userId = `u-${Date.now()}`;
    const newUser = {
      id: userId,
      role: role!,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      is_suspended: false,
      created_at: new Date().toISOString()
    };

    db.profiles.push(newUser);

    if (role === 'empresa') {
      const coords = (RJ_COORDS as any)[formData.address_neighborhood] || RJ_COORDS.Centro;
      db.company_profiles.push({
        user_id: userId,
        company_name: formData.company_name,
        owner_name: formData.owner_name,
        cnpj: formData.cnpj,
        municipal_registration: formData.municipal_registration,
        segment: formData.segment,
        address: formData.address_neighborhood,
        full_address: formData.full_address,
        zip_code: formData.zip_code,
        commercial_phone: formData.commercial_phone,
        geo_lat: coords.lat,
        geo_lng: coords.lng,
        is_verified: false // Precisa de auditoria admin
      });
    } else {
      const coords = RJ_COORDS.Centro;
      db.professional_profiles.push({
        user_id: userId,
        approval_status: 'pendente',
        skills: formData.skills,
        rating_avg: 0,
        jobs_completed: 0,
        city: 'Rio de Janeiro',
        geo_lat: coords.lat,
        geo_lng: coords.lng,
        docs_verified: false,
        bio: formData.bio,
        experience: []
      });
    }

    saveDb(db);
    alert("Conta criada com sucesso! Seus dados foram enviados para verificação.");
    navigate('/login');
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill) 
        : [...prev.skills, skill]
    }));
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-white flex flex-col p-8 overflow-y-auto no-scrollbar">
      <div className="mb-6 shrink-0">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/login')} className="text-gray-400 hover:text-black p-2 bg-gray-50 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
      </div>

      {step === 1 && (
        <div className="animate-in slide-in-from-right duration-300">
          <h1 className="text-3xl font-black mb-2 tracking-tighter">Quem é você?</h1>
          <p className="text-gray-400 mb-10 text-sm font-medium">Escolha seu perfil operacional.</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => { setRole('empresa'); setStep(2); }}
              className="w-full p-6 bg-white border-2 border-gray-100 hover:border-black rounded-[2rem] text-left transition-all group shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1 pr-4">
                  <h3 className="font-black text-xl mb-1 text-gray-900 tracking-tight">Sou Contratante</h3>
                  <p className="text-[11px] text-gray-400 font-bold leading-tight">Represento uma empresa e preciso de reforço imediato.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-gray-300 group-hover:text-black group-hover:bg-black group-hover:text-white transition-all">
                  <Icons.Home />
                </div>
              </div>
            </button>

            <button 
              onClick={() => { setRole('profissional'); setStep(2); }}
              className="w-full p-6 bg-white border-2 border-gray-100 hover:border-black rounded-[2rem] text-left transition-all group shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1 pr-4">
                  <h3 className="font-black text-xl mb-1 text-gray-900 tracking-tight">Sou Parceiro</h3>
                  <p className="text-[11px] text-gray-400 font-bold leading-tight">Quero prestar serviços e ser pago por hora.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-gray-300 group-hover:text-black group-hover:bg-black group-hover:text-white transition-all">
                  <Icons.User />
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="animate-in slide-in-from-right duration-300 space-y-4">
          <h1 className="text-3xl font-black mb-1 tracking-tighter">Acesso</h1>
          <p className="text-gray-400 mb-8 text-sm font-medium">Suas credenciais de acesso ao app.</p>

          <div className="space-y-4">
            <InputGroup label="Nome do Gestor" placeholder="Nome Completo" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
            <InputGroup label="E-mail" placeholder="seu@email.com" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
            <InputGroup label="WhatsApp" placeholder="(21) 9xxxx-xxxx" type="tel" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
            <InputGroup label="Senha" placeholder="••••••••" type="password" value={formData.password} onChange={v => setFormData({...formData, password: v})} />
          </div>

          <button type="submit" className="w-full bg-black text-white py-4.5 rounded-2xl font-black text-base mt-6 shadow-xl active:scale-[0.98] transition-all">
            Próximo Passo
          </button>
        </form>
      )}

      {step === 3 && role === 'empresa' && (
        <form onSubmit={handleRegister} className="animate-in slide-in-from-right duration-300 space-y-5 pb-10">
          <div>
            <h1 className="text-3xl font-black mb-1 tracking-tighter">Segurança</h1>
            <p className="text-gray-400 text-sm font-medium leading-tight">Dados corporativos para auditoria da plataforma.</p>
          </div>

          <div className="space-y-4">
            <InputGroup label="Razão Social" placeholder="Nome da Empresa" value={formData.company_name} onChange={v => setFormData({...formData, company_name: v})} />
            <InputGroup label="Nome do Proprietário" placeholder="Nome do Responsável Legal" value={formData.owner_name} onChange={v => setFormData({...formData, owner_name: v})} />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputGroup label="CNPJ" placeholder="00.000.000/0001-00" value={formData.cnpj} onChange={v => setFormData({...formData, cnpj: v})} />
              <InputGroup label="Inscrição Municipal" placeholder="Opcional" value={formData.municipal_registration} onChange={v => setFormData({...formData, municipal_registration: v})} />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bairro de Operação (RJ)</label>
              <select 
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-bold focus:ring-2 focus:ring-black transition-all appearance-none"
                value={formData.address_neighborhood}
                onChange={e => setFormData({...formData, address_neighborhood: e.target.value})}
              >
                {Object.keys(RJ_COORDS).map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>

            <InputGroup label="Endereço Completo" placeholder="Rua, número, complemento" value={formData.full_address} onChange={v => setFormData({...formData, full_address: v})} />
            
            <div className="grid grid-cols-2 gap-3">
              <InputGroup label="CEP" placeholder="00000-000" value={formData.zip_code} onChange={v => setFormData({...formData, zip_code: v})} />
              <InputGroup label="Tel. Comercial" placeholder="(21) 3333-4444" value={formData.commercial_phone} onChange={v => setFormData({...formData, commercial_phone: v})} />
            </div>
          </div>

          <div className="space-y-4 py-4 border-t border-gray-50">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={agreedTerms}
                onChange={e => setAgreedTerms(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[10px] font-bold text-gray-500 leading-tight">
                Declaro que as informações acima são verdadeiras e aceito os <span className="text-blue-600 underline">Termos de Uso</span> e a <span className="text-blue-600 underline">Política de Privacidade</span> da plataforma MeUp.
              </span>
            </label>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-4.5 rounded-2xl font-black text-base shadow-xl active:scale-95 transition-all">
            Concluir e Enviar para Auditoria
          </button>
        </form>
      )}

      {step === 3 && role === 'profissional' && (
        <form onSubmit={handleRegister} className="animate-in slide-in-from-right duration-300 space-y-4">
          <h1 className="text-3xl font-black mb-2 tracking-tighter">Habilidades</h1>
          <p className="text-gray-400 mb-6 text-sm font-medium">No que você é bom?</p>

          <div className="grid grid-cols-2 gap-2">
            {SKILLS_LIST.map(skill => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${formData.skills.includes(skill) ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-400 border-transparent shadow-sm'}`}
              >
                {skill.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="space-y-1.5 pt-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Resumo Profissional</label>
            <textarea 
              placeholder="Fale brevemente sobre sua experiência..."
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm font-medium h-32 focus:ring-2 focus:ring-black transition-all"
              value={formData.bio}
              onChange={e => setFormData({...formData, bio: e.target.value})}
            />
          </div>

          <div className="space-y-4 py-4 border-t border-gray-50">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={agreedTerms}
                onChange={e => setAgreedTerms(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[10px] font-bold text-gray-500 leading-tight">
                Aceito os <span className="text-blue-600 underline">Termos de Uso</span> e a <span className="text-blue-600 underline">Política de Privacidade</span> da plataforma MeUp.
              </span>
            </label>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-4.5 rounded-2xl font-black text-base mt-6 shadow-xl active:scale-95 transition-all">
            Finalizar e Aguardar Aprovação
          </button>
        </form>
      )}
    </div>
  );
};

const InputGroup = ({ label, placeholder, value, onChange, type = 'text' }: { label: string, placeholder: string, value: string, onChange: (v: string) => void, type?: string }) => (
  <div className="space-y-1.5 flex-1">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type}
      placeholder={placeholder}
      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-bold focus:ring-2 focus:ring-black transition-all"
      value={value}
      onChange={e => onChange(e.target.value)}
      required={label !== "Inscrição Municipal"}
    />
  </div>
);

export default Onboarding;
