
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { useAuth } from '../context/AuthContext';
import { getDb, saveDb } from '../services/mockDatabase';
import { JobRequest } from '../types';
import Layout from '../components/Layout';
import { RJ_COORDS, Icons } from '../constants';
import L from 'leaflet';

const jobIcon = L.divIcon({
  html: `<div style="background-color: black; width: 16px; height: 16px; border-radius: 4px; border: 3px solid white; box-shadow: 0 0 15px rgba(0,0,0,0.3);"></div>`,
  className: '', iconSize: [20, 20], iconAnchor: [10, 10]
});

const MapController = ({ pos }: { pos: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(pos, 15);
  }, [pos, map]);
  return null;
};

const NewJob: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [loc, setLoc] = useState('Copacabana');
  const [duration, setDuration] = useState(4);
  const [selectedTier, setSelectedTier] = useState<string>('Standard');

  const tiers = [
    { id: 'Standard', name: 'MeUp Standard', desc: 'Profissionais avaliados • 4 min', price: 25 * duration, icon: '👤', tag: 'MAIS POPULAR' },
    { id: 'Expert', name: 'MeUp Especialista', desc: 'Experiência comprovada • 6 min', price: 35 * duration, icon: '⭐', tag: null },
    { id: 'Master', name: 'MeUp Master', desc: 'Líderes e Gestores • 10 min', price: 55 * duration, icon: '🏆', tag: null }
  ];

  const handleConfirm = () => {
    const db = getDb();
    const coords = (RJ_COORDS as any)[loc];
    const tierData = tiers.find(t => t.id === selectedTier);

    const job: JobRequest = {
      id: `job-${Date.now()}`,
      company_id: user!.id,
      title: title || `Serviço de ${selectedTier}`,
      description: `Chamado categoria ${selectedTier} para reforço operacional.`,
      skill_required: selectedTier === 'Standard' ? 'atendente' : 'caixa',
      date_start: new Date().toISOString(),
      duration_hours: duration,
      value_offered: tierData?.price || 100,
      address_text: `Unidade ${loc}`,
      geo_lat: coords.lat,
      geo_lng: coords.lng,
      status: 'aberto',
      created_at: new Date().toISOString()
    };

    db.job_requests.push(job);
    saveDb(db);
    window.dispatchEvent(new CustomEvent('meup-job-updated'));
    navigate(`/job/${job.id}`);
  };

  const currentCoords = (RJ_COORDS as any)[loc];

  return (
    <Layout noPadding>
      <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
        {/* Mapa de Fundo */}
        <div className="h-[45%] w-full z-0 relative border-b border-gray-100">
          <MapContainer center={[currentCoords.lat, currentCoords.lng]} zoom={15} zoomControl={false} className="h-full w-full">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            <Marker position={[currentCoords.lat, currentCoords.lng]} icon={jobIcon} />
            <MapController pos={[currentCoords.lat, currentCoords.lng]} />
          </MapContainer>
          <div className="absolute top-4 left-4 z-10">
            <button onClick={() => navigate(-1)} className="bg-white p-4 rounded-2xl shadow-xl active:scale-90 transition-all border border-gray-100">
               <Icons.ArrowRight className="rotate-180" />
            </button>
          </div>
        </div>

        {/* Bottom Sheet de Configuração */}
        <div className="flex-1 flex flex-col bg-white rounded-t-[3rem] -mt-12 z-10 shadow-[0_-20px_60px_rgba(0,0,0,0.15)] overflow-hidden">
          <div className="w-14 h-1.5 bg-gray-100 rounded-full mx-auto mt-4 mb-2 shrink-0"></div>
          
          <div className="flex-1 flex flex-col overflow-hidden">
            {step === 1 ? (
              <div className="flex-1 overflow-y-auto px-8 pt-4 pb-10 space-y-6 animate-in fade-in slide-in-from-bottom duration-300 no-scrollbar">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-gray-900 leading-none">Novo Reforço</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Configure os detalhes do chamado</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 focus-within:border-black transition-colors">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">O que você precisa?</label>
                    <input 
                      className="w-full bg-transparent outline-none font-black text-gray-900 text-lg placeholder:text-gray-300" 
                      placeholder="Ex: Caixa, Garçom, Auxiliar..." 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Bairro</label>
                      <select className="w-full bg-transparent outline-none font-black text-gray-900 appearance-none text-sm" value={loc} onChange={e => setLoc(e.target.value)}>
                        {Object.keys(RJ_COORDS).map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Duração</label>
                      <div className="flex items-center justify-between">
                         <button onClick={() => setDuration(Math.max(1, duration - 1))} className="w-7 h-7 rounded-xl bg-white border flex items-center justify-center font-black shadow-sm text-gray-400">-</button>
                         <span className="font-black text-sm">{duration}h</span>
                         <button onClick={() => setDuration(duration + 1)} className="w-7 h-7 rounded-xl bg-white border flex items-center justify-center font-black shadow-sm text-gray-400">+</button>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setStep(2)} 
                  disabled={!title} 
                  className="w-full bg-black text-white h-16 rounded-3xl font-black text-sm uppercase tracking-widest disabled:opacity-20 active:scale-95 transition-all shadow-2xl mt-4"
                >
                  Continuar
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right duration-300">
                <div className="px-8 pt-4 pb-2 shrink-0">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Selecione a Categoria</h3>
                </div>
                
                <div className="flex-1 px-4 space-y-3 overflow-y-auto no-scrollbar pb-6">
                  {tiers.map(tier => (
                    <button 
                      key={tier.id} 
                      onClick={() => setSelectedTier(tier.id)} 
                      className={`w-full flex items-center justify-between px-6 py-4 rounded-[2rem] border-2 transition-all duration-300 ${selectedTier === tier.id ? 'border-black bg-gray-50 shadow-lg scale-[1.02]' : 'border-transparent bg-white shadow-sm opacity-60'}`}
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0">{tier.icon}</div>
                        <div>
                          <h4 className="font-black text-gray-900 text-sm leading-none">{tier.name}</h4>
                          <p className="text-[9px] font-bold text-gray-400 mt-1 leading-tight">{tier.desc}</p>
                          {tier.tag && <span className="text-[8px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50 px-1.5 py-0.5 rounded mt-2 inline-block border border-blue-100">{tier.tag}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-base text-gray-900 leading-none">R$ {tier.price.toFixed(0)}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="px-6 pb-10 bg-white shrink-0 border-t border-gray-50 pt-4">
                  <button onClick={handleConfirm} className="w-full bg-black text-white h-16 rounded-3xl font-black text-base uppercase tracking-widest active:scale-95 transition-all shadow-2xl">
                    Chamar Agora
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NewJob;
