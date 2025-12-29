
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDb } from '../services/mockDatabase';
import { Profile, ProfessionalProfile, Rating } from '../types';
import Layout from '../components/Layout';
import { Icons } from '../constants';

const ProfessionalProfileView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profData, setProfData] = useState<ProfessionalProfile | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [showAllRatings, setShowAllRatings] = useState(false);

  useEffect(() => {
    const db = getDb();
    const foundProfile = db.profiles.find(p => p.id === id);
    const foundProfData = db.professional_profiles.find(p => p.user_id === id);
    const foundRatings = db.ratings.filter(r => r.ratee_id === id).reverse();

    if (foundProfile) setProfile(foundProfile);
    if (foundProfData) setProfData(foundProfData);
    setRatings(foundRatings);
  }, [id]);

  if (!profile || !profData) return <Layout><div className="p-10 text-center font-bold">Carregando perfil...</div></Layout>;

  const displayedRatings = showAllRatings ? ratings : ratings.slice(0, 3);

  return (
    <Layout title="Currículo">
      <div className="px-6 pb-20">
        {/* Header Perfil */}
        <div className="text-center mt-4 mb-8">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg relative">
             <div className="text-gray-400 scale-150"><Icons.User /></div>
             {profData.docs_verified && (
               <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full border-2 border-white">
                 <div className="scale-75"><Icons.Check /></div>
               </div>
             )}
          </div>
          <h2 className="text-2xl font-black text-gray-900">{profile.name}</h2>
          <div className="flex items-center justify-center gap-1 mt-1">
            <div className="scale-90"><Icons.Star filled /></div>
            <span className="font-bold text-sm">{profData.rating_avg.toFixed(1)}</span>
            <span className="text-gray-400 text-sm ml-1">({profData.jobs_completed} jobs)</span>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mb-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Sobre</h3>
          <p className="text-sm text-gray-600 leading-relaxed italic">
            "{profData.bio || 'Sem biografia disponível.'}"
          </p>
        </div>

        {/* Habilidades */}
        <div className="mb-8">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Habilidades</h3>
          <div className="flex flex-wrap gap-2">
            {profData.skills.map(s => (
              <span key={s} className="bg-gray-100 text-gray-800 text-[11px] font-bold px-3 py-1.5 rounded-full uppercase">
                {s.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Experiência */}
        <div className="mb-8">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Experiência Profissional</h3>
          <div className="space-y-4">
            {profData.experience && profData.experience.length > 0 ? (
              profData.experience.map((exp, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-0.5 bg-gray-100 rounded-full my-1 shrink-0"></div>
                  <div>
                    <h4 className="font-black text-gray-900 text-sm">{exp.role}</h4>
                    <p className="text-xs text-gray-500 font-bold">{exp.company}</p>
                    <p className="text-[9px] text-gray-400 font-medium uppercase mt-1">{exp.period}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 italic">Sem histórico registrado.</p>
            )}
          </div>
        </div>

        {/* Avaliações Detalhadas */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 ml-1">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avaliações Recebidas ({ratings.length})</h3>
            <div className="flex items-center gap-1">
               <span className="text-[10px] font-black text-yellow-500">{profData.rating_avg.toFixed(1)}</span>
               <div className="scale-75 text-yellow-500"><Icons.Star filled /></div>
            </div>
          </div>
          
          <div className="space-y-3">
            {ratings.length === 0 ? (
               <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center">
                 <p className="text-xs text-gray-400 font-bold italic">Nenhuma avaliação detalhada ainda.</p>
               </div>
            ) : (
              <>
                {displayedRatings.map(r => (
                  <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <React.Fragment key={s}>
                            <div className="scale-75 origin-left">
                              <Icons.Star filled={s <= r.stars} />
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                      <span className="text-[8px] text-gray-300 font-black uppercase tracking-tighter">
                        {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-tight font-medium">"{r.comment || 'Trabalho realizado com excelência.'}"</p>
                    <div className="mt-2 flex items-center gap-2">
                       <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center text-[7px] text-gray-400">
                         <Icons.User />
                       </div>
                       <span className="text-[8px] font-black text-gray-400 uppercase">Empresa Parceira</span>
                    </div>
                  </div>
                ))}

                {ratings.length > 3 && (
                  <button 
                    onClick={() => setShowAllRatings(!showAllRatings)}
                    className="w-full py-3 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-black text-blue-600 uppercase tracking-widest active:scale-95 transition-all hover:bg-blue-50/50"
                  >
                    {showAllRatings ? 'Recolher avaliações' : 'Ver todas as avaliações'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <button 
          onClick={() => navigate(-1)}
          className="w-full bg-black text-white py-4 rounded-2xl font-black text-base mt-6 active:scale-95 transition-all shadow-xl shadow-black/10"
        >
          VOLTAR AO DASHBOARD
        </button>
      </div>
    </Layout>
  );
};

export default ProfessionalProfileView;
