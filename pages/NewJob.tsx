
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
  html: `<div style="background-color: black; width: 16px; height: 16px; border-radius: 2px; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
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
    
    // IMPORTANTE: saveDb atualizará o timestamp de versão do banco antes de subir para a nuvem
    saveDb(db);
    
    // Dispara evento local para UI reagir imediatamente caso seja o mesmo device
    window.dispatchEvent(new CustomEvent('meup-job-updated'));
    
    navigate(`/job/${job.id}`);
  };

  const currentCoords = (RJ_COORDS as any)[loc];

  return (
    <Layout noPadding>
      <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
        <div className="h-[38%] w-full z-0 border-b relative">
          <MapContainer center={[currentCoords.lat, currentCoords.lng]} zoom={15} zoomControl={false} className="h-full w-full">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            <Marker position={[currentCoords.lat, currentCoords.lng]} icon={jobIcon} />
            <MapController pos={[currentCoords.lat, currentCoords.lng]} />
          </MapContainer>
          <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-10 bg-white p-3 rounded-full shadow-lg border border-gray-100 active:scale-90 transition-transform">
             <Icons.ArrowRight />
          </button>
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-t-[2.5rem] -mt-10 z-10 shadow-[0_-15px_50px_rgba(0,0,0,0.12)] overflow-hidden">
          <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mt-4 mb-2 shrink-0"></div>
          
          <div className="flex-1 flex flex-col overflow-hidden">
            {step === 1 ? (
              <div className="flex-1 overflow-y-auto px-8 pt-4 pb-8 space-y-5 animate-in fade-in slide-in-from-bottom duration-300 no-scrollbar">
                <h2 className="text-xl font-black tracking-tight text-center mb-4">Onde será o reforço?</h2>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Título do Chamado</label>
                    <input className="w-full bg-transparent outline-none font-bold text-gray-900" placeholder="Ex: Caixa para Fechamento" value={title} onChange={e => setTitle(e.target.value)} />
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Bairro do Rio</label>
                    <select className="w-full bg-transparent outline-none font-bold text-gray-900 appearance-none" value={loc} onChange={e => setLoc(e.target.value)}>
                      {Object.keys(RJ_COORDS).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Duração (Horas)</label>
                    <div className="flex items-center justify-between">
                       <button type="button" onClick={() => setDuration(Math.max(1, duration - 1))} className="w-8 h-8 rounded-full bg-white border flex items-center justify-center font-bold shadow-sm">-</button>
                       <span className="font-black text-xl">{duration}h</span>
                       <button type="button" onClick={() => setDuration(duration + 1)} className="w-8 h-8 rounded-full bg-white border flex items-center justify-center font-bold shadow-sm">+</button>
                    </div>
                  </div>
                </div>
                <button onClick={() => setStep(2)} disabled={!title} className="w-full bg-black text-white py-4.5 rounded-2xl font-black text-sm uppercase tracking-widest disabled:opacity-30 active:scale-95 transition-all shadow-xl mt-2">Ver Categorias</button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right duration-300">
                <div className="px-8 pt-4 pb-2 text-center shrink-0">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-3">Escolha o Profissional</h3>
                </div>
                <div className="flex-1 px-4 flex flex-col justify-around py-2">
                  {tiers.map(tier => (
                    <button key={tier.id} onClick={() => setSelectedTier(tier.id)} className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl border-2 transition-all duration-200 ${selectedTier === tier.id ? 'border-black bg-gray-50 shadow-md ring-1 ring-black/5' : 'border-transparent hover:bg-gray-50/50'}`}>
                      <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0">{tier.icon}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-gray-900 text-sm leading-none">{tier.name}</h4>
                            <div className="scale-75 text-gray-300"><Icons.User /></div>
                          </div>
                          <p className="text-[9px] font-bold text-gray-400 mt-1 leading-tight">{tier.desc}</p>
                          {tier.tag && <span className="text-[8px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50 px-1.5 py-0.5 rounded mt-1.5 inline-block border border-blue-100">{tier.tag}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0"><p className="font-black text-base text-gray-900 leading-none">R$ {tier.price.toFixed(2)}</p></div>
                    </button>
                  ))}
                </div>
                <div className="px-6 pt-2 pb-8 bg-white shrink-0">
                  <button onClick={handleConfirm} className="w-full bg-black text-white py-5 rounded-2xl font-black text-base uppercase tracking-widest active:scale-95 transition-all shadow-2xl">Confirmar {selectedTier.toUpperCase()}</button>
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
