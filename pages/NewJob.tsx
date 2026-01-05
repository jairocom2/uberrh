
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
        {/* Mapa */}
        <div className="h-[40%] w-full z-0 relative">
          <MapContainer center={[currentCoords.lat, currentCoords.lng]} zoom={15} zoomControl={false} className="h-full w-full">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            <Marker position={[currentCoords.lat, currentCoords.lng]} icon={jobIcon} />
            <MapController pos={[currentCoords.lat, currentCoords.lng]} />
          </MapContainer>
          <div className="absolute top-4 left-4 z-10">
            <button onClick={() => navigate(-1)} className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100"><Icons.ArrowRight className="rotate-180" /></button>
          </div>
        </div>

        {/* Formulário com Botão Flutuante */}
        <div className="flex-1 flex flex-col bg-white rounded-t-[2.5rem] -mt-10 z-10 shadow-[0_-15px_50px_rgba(0,0,0,0.15)] relative">
          <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mt-4 mb-2"></div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar pb-32"> {/* Padding extra para o botão fixo */}
            {step === 1 ? (
              <div className="px-8 pt-4 space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Novo Reforço</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configure os detalhes</p>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Profissão</label>
                    <input className="w-full bg-transparent outline-none font-black text-gray-900 text-lg" placeholder="Ex: Caixa, Garçom..." value={title} onChange={e => setTitle(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Bairro</label>
                      <select className="w-full bg-transparent outline-none font-black text-gray-900 text-sm" value={loc} onChange={e => setLoc(e.target.value)}>
                        {Object.keys(RJ_COORDS).map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Duração</label>
                      <div className="flex items-center justify-between">
                         <button onClick={() => setDuration(Math.max(1, duration - 1))} className="text-gray-400 font-black">-</button>
                         <span className="font-black text-sm">{duration}h</span>
                         <button onClick={() => setDuration(duration + 1)} className="text-gray-400 font-black">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-4 pt-4 space-y-3">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-2">Escolha a Categoria</h3>
                {tiers.map(tier => (
                  <button key={tier.id} onClick={() => setSelectedTier(tier.id)} className={`w-full flex items-center justify-between px-6 py-5 rounded-[1.5rem] border-2 transition-all ${selectedTier === tier.id ? 'border-black bg-gray-50' : 'border-transparent bg-white shadow-sm opacity-60'}`}>
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">{tier.icon}</div>
                      <div>
                        <h4 className="font-black text-gray-900 text-sm">{tier.name}</h4>
                        <p className="text-[9px] font-bold text-gray-400">{tier.desc}</p>
                      </div>
                    </div>
                    <p className="font-black text-lg text-gray-900">R$ {tier.price.toFixed(0)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ÁREA DO BOTÃO FIXA - Nunca some */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pt-10">
            {step === 1 ? (
              <button onClick={() => setStep(2)} disabled={!title} className="w-full bg-black text-white h-16 rounded-[1.2rem] font-black text-sm uppercase tracking-widest disabled:opacity-20 shadow-2xl">
                Próximo
              </button>
            ) : (
              <button onClick={handleConfirm} className="w-full bg-black text-white h-16 rounded-[1.2rem] font-black text-base uppercase tracking-widest shadow-2xl">
                Confirmar MeUp
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NewJob;
