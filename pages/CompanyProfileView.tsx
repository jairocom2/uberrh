
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDb } from '../services/mockDatabase';
import { Profile, CompanyProfile, Rating } from '../types';
import Layout from '../components/Layout';
import { Icons } from '../constants';

const CompanyProfileView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [compData, setCompData] = useState<CompanyProfile | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [jobsCount, setJobsCount] = useState(0);

  useEffect(() => {
    const db = getDb();
    const foundProfile = db.profiles.find(p => p.id === id);
    const foundCompData = db.company_profiles.find(p => p.user_id === id);
    const foundRatings = db.ratings.filter(r => r.ratee_id === id).reverse();
    const count = db.job_requests.filter(j => j.company_id === id && j.status === 'finalizado').length;

    if (foundProfile) setProfile(foundProfile);
    if (foundCompData) setCompData(foundCompData);
    setRatings(foundRatings);
    setJobsCount(count);
    setAllProfiles(db.profiles);
  }, [id]);

  if (!profile || !compData) return <Layout><div className="p-10 text-center font-bold">Carregando perfil da empresa...</div></Layout>;

  const avgRating = ratings.length > 0 
    ? ratings.reduce((acc, r) => acc + r.stars, 0) / ratings.length 
    : 5.0;

  return (
    <Layout title="Perfil Verificado">
      <div className="px-6 pb-20 overflow-y-auto no-scrollbar">
        {/* Header Empresa Estilo Uber */}
        <div className="text-center mt-6 mb-8">
          <div className="w-24 h-24 bg-black rounded-3xl flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-2xl relative overflow-hidden">
             <span className="text-white font-black text-4xl">{compData.company_name.charAt(0)}</span>
             {compData.is_verified && (
               <div className="absolute top-0 right-0 p-1.5 bg-blue-500 rounded-bl-2xl shadow-lg border-b-2 border-l-2 border-white/20">
                  <div className="scale-75 text-white"><Icons.Check /></div>
               </div>
             )}
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
              {compData.company_name}
            </h2>
            
            {/* NOVO: Selo Proeminente Próximo ao Nome */}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm animate-in zoom-in duration-300 ${compData.is_verified ? 'bg-blue-600 border-blue-400 text-white' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
              <div className="scale-50 shrink-0">
                {compData.is_verified ? <Icons.Check /> : <div className="text-amber-500"><Icons.Search /></div>}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {compData.is_verified ? 'Empresa Verificada' : 'Em Auditoria'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-4">
            <span className="text-blue-600 text-[9px] font-black uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{compData.segment}</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Ativo no MeUp</span>
          </div>
          
          <div className="flex items-center justify-center gap-1 mt-4">
            <div className="scale-90"><Icons.Star filled /></div>
            <span className="font-black text-base">{avgRating.toFixed(1)}</span>
            <span className="text-gray-400 text-xs ml-1 font-bold">({jobsCount} serviços concluídos)</span>
          </div>
        </div>

        {/* Status de Confiança Detalhado */}
        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-4 border ${compData.is_verified ? 'bg-green-50 border-green-100 text-green-800' : 'bg-yellow-50 border-yellow-100 text-yellow-800'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${compData.is_verified ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}>
            {compData.is_verified ? <Icons.Check /> : <Icons.Search />}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest leading-tight">Garantia de Segurança</p>
            <p className="text-xs font-bold leading-tight">
              {compData.is_verified 
                ? 'Documentação auditada e aprovada para operações na plataforma.' 
                : 'Aguardando validação final de documentos comerciais.'}
            </p>
          </div>
        </div>

        {/* Dados de Segurança Corporativos */}
        <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm mb-6 space-y-5">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transparência Corporativa</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoItem label="CNPJ" value={compData.cnpj} />
            <InfoItem label="Responsável" value={compData.owner_name} />
            <InfoItem label="Tel. Comercial" value={compData.commercial_phone || profile.phone} />
            <InfoItem label="Inscrição Municipal" value={compData.municipal_registration || 'Não informada'} />
            <div className="pt-2 border-t border-gray-50 sm:col-span-2">
              <InfoItem label="Endereço Verificado" value={compData.full_address} />
            </div>
          </div>
        </div>

        {/* Avaliações dos Profissionais */}
        <div className="mb-8">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Feedbacks de Parceiros</h3>
          
          <div className="space-y-4">
            {ratings.length === 0 ? (
               <div className="bg-gray-50 border border-dashed border-gray-200 rounded-3xl p-8 text-center">
                 <p className="text-xs text-gray-300 font-bold italic">Esta empresa ainda não recebeu feedbacks detalhados.</p>
               </div>
            ) : (
              ratings.map(r => {
                const raterProfile = allProfiles.find(p => p.id === r.rater_id);
                return (
                  <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex gap-0.5 scale-75 origin-left">
                        {[1,2,3,4,5].map(s => (
                          <React.Fragment key={s}>
                            <Icons.Star filled={s <= r.stars} />
                          </React.Fragment>
                        ))}
                      </div>
                      <span className="text-[8px] text-gray-300 font-black uppercase tracking-tighter">
                        {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium leading-tight">"{r.comment || 'Ótimo contratante, ambiente de trabalho respeitoso.'}"</p>
                    
                    <button 
                      onClick={() => navigate(`/profissional/${r.rater_id}`)}
                      className="mt-3 flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-xl transition-all group border border-transparent hover:border-gray-100"
                    >
                       <div className="w-5 h-5 bg-blue-50 text-blue-400 rounded-lg flex items-center justify-center text-[8px]">
                         <Icons.User />
                       </div>
                       <div className="text-left">
                         <span className="block text-[9px] font-black text-blue-600 uppercase tracking-tighter group-hover:underline">
                           {raterProfile?.name || 'Profissional Verificado'}
                         </span>
                       </div>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <button 
          onClick={() => navigate(-1)}
          className="w-full bg-black text-white py-4.5 rounded-2xl font-black text-sm uppercase tracking-[0.15em] active:scale-95 transition-all shadow-xl shadow-black/10"
        >
          Voltar
        </button>
      </div>
    </Layout>
  );
};

const InfoItem = ({ label, value }: { label: string, value: string }) => (
  <div>
    <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em] leading-none mb-1.5">{label}</p>
    <p className="text-sm font-black text-gray-800 leading-tight">{value}</p>
  </div>
);

export default CompanyProfileView;
