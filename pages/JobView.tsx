
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { getDb, saveDb } from '../services/mockDatabase';
import { JobRequest, JobAssignment, Profile, ChatMessage, CompanyProfile, Rating } from '../types';
import Layout from '../components/Layout';
import { Icons } from '../constants';

const createIcon = (color: string, isProfessional: boolean) => {
  const html = isProfessional 
    ? `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(0,0,0,0.3); position: relative;">
         <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; background-color: ${color}; opacity: 0.4; animation: ping 2s infinite;"></div>
       </div>`
    : `<div style="background-color: black; width: 20px; height: 20px; border-radius: 4px; border: 3px solid white; box-shadow: 0 0 15px rgba(0,0,0,0.4);"></div>`;
  
  return L.divIcon({ html, className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
};

const profIcon = createIcon('#276EF1', true);
const jobIcon = createIcon('#000000', false);

const MapController = ({ jobPos, profPos }: { jobPos: [number, number], profPos?: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (profPos && profPos[0] !== 0) {
      const bounds = L.latLngBounds([jobPos, profPos]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });
    } else {
      map.setView([jobPos[0] - 0.001, jobPos[1]], 16);
    }
  }, [jobPos, profPos, map]);
  return null;
};

const JobView: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobRequest | null>(null);
  const [assignment, setAssignment] = useState<JobAssignment | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [professional, setProfessional] = useState<Profile | null>(null);
  const [companyData, setCompanyData] = useState<CompanyProfile | null>(null);
  const [companyStats, setCompanyStats] = useState({ rating: 5.0, jobs: 0 });
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(() => {
    const db = getDb();
    const foundJob = db.job_requests.find(j => j.id === id);
    const foundAsg = db.job_assignments.find(a => a.job_id === id);
    const thread = db.chat_threads.find(t => t.job_id === id);
    
    if (foundJob) {
      setJob({ ...foundJob });
      const cd = db.company_profiles.find(cp => cp.user_id === foundJob.company_id);
      if (cd) {
        setCompanyData({ ...cd });
        const ratings = db.ratings.filter(r => r.ratee_id === cd.user_id);
        const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b.stars, 0) / ratings.length : 4.9;
        const jobsCount = db.job_requests.filter(j => j.company_id === cd.user_id && j.status === 'finalizado').length;
        setCompanyStats({ rating: avg, jobs: jobsCount });
      }
    }
    
    if (foundAsg) {
      setAssignment({ ...foundAsg });
      const p = db.profiles.find(u => u.id === foundAsg.professional_id);
      if (p) setProfessional({ ...p });
    } else {
      setAssignment(null);
      setProfessional(null);
    }

    if (thread) {
      setMessages([...db.chat_messages.filter(m => m.thread_id === thread.id)]);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refreshData();
    window.addEventListener('meup-job-updated', refreshData);
    
    const moveTimer = setInterval(() => {
      const db = getDb();
      const asgIdx = db.job_assignments.findIndex(a => a.job_id === id);
      
      if (asgIdx !== -1 && db.job_assignments[asgIdx].status === 'a_caminho') {
        const asg = db.job_assignments[asgIdx];
        const currentJob = db.job_requests.find(j => j.id === id);
        if (currentJob) {
          const lerp = (start: number, end: number, t: number) => start + (end - start) * t;
          const nextLat = lerp(asg.last_lat, currentJob.geo_lat, 0.05);
          const nextLng = lerp(asg.last_lng, currentJob.geo_lng, 0.05);
          
          db.job_assignments[asgIdx].last_lat = nextLat;
          db.job_assignments[asgIdx].last_lng = nextLng;
          
          const dist = Math.sqrt(Math.pow(currentJob.geo_lat - nextLat, 2) + Math.pow(currentJob.geo_lng - nextLng, 2));
          if (dist < 0.0002) {
             db.job_assignments[asgIdx].status = 'cheguei';
             window.dispatchEvent(new CustomEvent('meup-job-updated'));
          }
          
          saveDb(db);
        }
      }
    }, 2000);

    return () => {
      window.removeEventListener('meup-job-updated', refreshData);
      clearInterval(moveTimer);
    };
  }, [refreshData, id]);

  const updateStatus = (newStatus: JobAssignment['status']) => {
    if (!assignment) return;
    const db = getDb();
    const asgIdx = db.job_assignments.findIndex(a => a.id === assignment.id);
    const jobIdx = db.job_requests.findIndex(j => j.id === id);
    
    db.job_assignments[asgIdx].status = newStatus;
    if (newStatus === 'finalizado') {
      db.job_requests[jobIdx].status = 'finalizado';
      saveDb(db);
      window.dispatchEvent(new CustomEvent('meup-job-updated'));
      navigate(`/avaliar/${id}`);
      return;
    }
    db.job_requests[jobIdx].status = newStatus === 'em_execucao' ? 'em_andamento' : 'match_confirmado';
    saveDb(db);
    window.dispatchEvent(new CustomEvent('meup-job-updated'));
    refreshData();
  };

  const sendMessage = () => {
    if (!newMsg || !assignment) return;
    const db = getDb();
    const thread = db.chat_threads.find(t => t.job_id === id);
    if (!thread || !user) return;
    const msg = {
      id: Date.now().toString(),
      thread_id: thread.id,
      sender_id: user.id,
      message: newMsg,
      created_at: new Date().toISOString()
    };
    db.chat_messages.push(msg);
    saveDb(db);
    window.dispatchEvent(new CustomEvent('meup-job-updated'));
    setNewMsg('');
  };

  if (loading || !job) return <div className="p-10 text-center font-black text-gray-400">CARREGANDO MAPA...</div>;

  const isProf = user?.role === 'profissional';
  const hasMatch = !!assignment;

  return (
    <Layout noPadding>
      <div className="flex-1 flex flex-col relative h-full overflow-hidden">
        
        {/* Mapa Fullscreen */}
        <div className="absolute inset-0 z-0">
          <MapContainer center={[job.geo_lat, job.geo_lng]} zoom={16} zoomControl={false} className="h-full w-full">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            
            {!hasMatch && (
              <Circle 
                center={[job.geo_lat, job.geo_lng]} 
                radius={300} 
                pathOptions={{ fillColor: '#276EF1', fillOpacity: 0.1, color: '#276EF1', weight: 1, dashArray: '5, 5' }} 
              />
            )}

            <Marker position={[job.geo_lat, job.geo_lng]} icon={jobIcon} />
            {assignment && (
              <>
                <Marker position={[assignment.last_lat, assignment.last_lng]} icon={profIcon} />
                <Polyline 
                  positions={[[assignment.last_lat, assignment.last_lng], [job.geo_lat, job.geo_lng]]} 
                  pathOptions={{ color: '#276EF1', weight: 4, dashArray: '8, 12', opacity: 0.5 }} 
                />
              </>
            )}
            <MapController jobPos={[job.geo_lat, job.geo_lng]} profPos={assignment ? [assignment.last_lat, assignment.last_lng] : undefined} />
          </MapContainer>
        </div>

        {/* Botão Superior */}
        <div className="absolute top-4 left-4 z-40">
          <button onClick={() => navigate(-1)} className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 active:scale-90 transition-transform">
             <Icons.ArrowRight />
          </button>
        </div>

        {/* Bottom Sheet Uber Style */}
        <div className={`absolute bottom-0 left-0 right-0 z-40 p-4 transition-all duration-500 ${showChat ? 'top-0' : ''}`}>
          <div className="bg-white rounded-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.15)] px-6 pt-5 pb-8 max-w-md mx-auto h-full flex flex-col">
            
            {!showChat ? (
              <div className="animate-in slide-in-from-bottom duration-300">
                <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6"></div>
                
                <div className="space-y-6">
                  {/* Título e Valor */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <h2 className="text-2xl font-black text-gray-900 leading-tight mb-1">{job.title}</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{job.address_text}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-2xl font-black text-green-600">R$ {job.value_offered}</p>
                    </div>
                  </div>

                  {/* Card do Usuário */}
                  <div 
                    onClick={() => {
                      if (hasMatch) {
                        if (isProf) navigate(`/empresa/${companyData?.user_id}`);
                        else navigate(`/profissional/${professional?.id}`);
                      }
                    }}
                    className={`bg-gray-50 border border-gray-100 rounded-[2rem] p-5 active:bg-gray-100 transition-all ${hasMatch ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-center relative overflow-hidden">
                          {hasMatch ? (
                            isProf ? (
                              <span className="font-black text-2xl">{companyData?.company_name.charAt(0)}</span>
                            ) : (
                              <div className="text-gray-400 scale-150"><Icons.User /></div>
                            )
                          ) : (
                            <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                            {hasMatch ? (isProf ? 'Empresa Contratante' : 'Parceiro MeUp') : 'Sistema Radar'}
                          </p>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-gray-900 leading-none">
                              {hasMatch ? (isProf ? companyData?.company_name : (professional?.name || '---')) : 'Localizando...'}
                            </h4>
                            {hasMatch && isProf && companyData?.is_verified && <div className="text-blue-500 scale-50"><Icons.Check /></div>}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex items-center gap-1">
                              <div className="scale-50 origin-left"><Icons.Star filled /></div>
                              <span className="text-[10px] font-black">{hasMatch ? (isProf ? companyStats.rating.toFixed(1) : '4.9') : '---'}</span>
                            </div>
                            {hasMatch && isProf && (
                               <span className="text-[9px] font-bold text-gray-400">• {companyStats.jobs} jobs concluídos</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {hasMatch ? (
                        <div className="flex gap-2">
                           <button 
                             onClick={(e) => { e.stopPropagation(); setShowChat(true); }} 
                             className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm active:scale-90 transition-all"
                           >
                             <Icons.Chat />
                           </button>
                        </div>
                      ) : (
                        <div className="text-gray-200"><Icons.ArrowRight /></div>
                      )}
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="space-y-3">
                    {!hasMatch ? (
                      <div className="bg-black text-white p-5 rounded-2xl text-center shadow-lg">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Aguardando confirmação do parceiro</p>
                      </div>
                    ) : (
                      <>
                        {isProf && assignment.status === 'a_caminho' && (
                           <button 
                            onClick={() => updateStatus('cheguei')} 
                            className="w-full bg-black text-white py-5 rounded-2xl font-black text-base uppercase tracking-widest active:scale-95 transition-all shadow-2xl"
                           >
                             ESTOU NO LOCAL
                           </button>
                        )}

                        {isProf && assignment.status === 'cheguei' && (
                          <div className="bg-blue-600 text-white p-5 rounded-2xl text-center shadow-xl animate-pulse">
                            <p className="text-[11px] font-black uppercase tracking-widest">Aguardando Empresa Confirmar Chegada</p>
                          </div>
                        )}
                        
                        {user?.role === 'empresa' && assignment.status === 'cheguei' && (
                          <div className="space-y-3 animate-in zoom-in duration-300">
                             <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-center gap-3">
                               <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0 shadow-lg">
                                 <Icons.Check />
                               </div>
                               <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest leading-tight">Parceiro chegou no local!</p>
                             </div>
                             <button 
                                onClick={() => updateStatus('em_execucao')} 
                                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-base uppercase tracking-widest active:scale-95 transition-all shadow-2xl ring-4 ring-blue-100"
                              >
                                CONFIRMAR CHEGADA E INICIAR
                              </button>
                          </div>
                        )}

                        {user?.role === 'empresa' && assignment.status === 'em_execucao' && (
                          <button 
                            onClick={() => updateStatus('finalizado')} 
                            className="w-full bg-green-600 text-white py-5 rounded-2xl font-black text-base uppercase tracking-widest active:scale-95 transition-all shadow-xl"
                          >
                            FINALIZAR E LIBERAR PAGAMENTO
                          </button>
                        )}

                        {isProf && assignment.status === 'em_execucao' && (
                           <div className="bg-green-50 border border-green-200 p-5 rounded-2xl text-center">
                              <p className="text-[11px] font-black text-green-700 uppercase tracking-widest flex items-center justify-center gap-2">
                                <span className="w-2 h-2 bg-green-600 rounded-full animate-ping"></span> TRABALHO EM EXECUÇÃO
                              </p>
                           </div>
                        )}
                        
                        {assignment.status === 'a_caminho' && !isProf && (
                          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-center">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Parceiro a caminho • Siga no mapa</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Chat View */
              <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
                <div className="flex items-center gap-4 mb-6 border-b pb-4">
                  <button onClick={() => setShowChat(false)} className="bg-gray-50 p-3 rounded-2xl text-gray-900 rotate-180"><Icons.ArrowRight /></button>
                  <h3 className="font-black text-lg">Mensagens</h3>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 px-1 pb-4 no-scrollbar">
                  {messages.map(m => (
                    <div key={m.id} className={`max-w-[85%] p-4 rounded-[1.5rem] text-[13px] font-bold shadow-sm ${m.sender_id === user?.id ? 'bg-black text-white self-end ml-auto rounded-tr-none' : 'bg-gray-100 text-gray-800 self-start mr-auto rounded-tl-none'}`}>
                      {m.message}
                    </div>
                  ))}
                  {messages.length === 0 && <p className="text-center text-xs text-gray-400 py-10 italic">Inicie uma conversa para alinhar o acesso.</p>}
                </div>
                <div className="flex items-center gap-2 py-4 border-t">
                  <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Escreva aqui..." onKeyPress={(e) => e.key === 'Enter' && sendMessage()} className="flex-1 bg-gray-50 border-none rounded-2xl px-5 py-4 outline-none text-sm font-bold" />
                  <button onClick={sendMessage} className="bg-black text-white p-4 rounded-2xl shadow-xl active:scale-90 transition-all"><Icons.Check /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JobView;
