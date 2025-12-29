
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDb, saveDb } from '../services/mockDatabase';
import { Icons } from '../constants';
import Layout from '../components/Layout';

const Rating: React.FC = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    const db = getDb();
    const job = db.job_requests.find(j => j.id === jobId);
    const asg = db.job_assignments.find(a => a.job_id === jobId);
    if (!job || !asg) return;

    db.ratings.push({
      id: Date.now().toString(),
      job_id: jobId!,
      rater_id: user!.id,
      ratee_id: user?.role === 'empresa' ? asg.professional_id : asg.company_id,
      stars,
      comment,
      created_at: new Date().toISOString()
    });
    saveDb(db);
    
    navigate(user?.role === 'empresa' ? '/empresa/dashboard' : '/profissional/dashboard');
  };

  return (
    <Layout title="Avaliação">
      <div className="px-6 text-center space-y-6 mt-6 pb-6">
        <div className="space-y-1">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icons.Check />
          </div>
          <h3 className="text-xl font-bold">Trabalho Finalizado!</h3>
          <p className="text-gray-400 text-sm">Avalie sua experiência para mantermos a qualidade MeUp.</p>
        </div>

        <div className="flex justify-center gap-3">
          {[1,2,3,4,5].map(s => (
            <button key={s} onClick={() => setStars(s)} className="p-1 active:scale-90 transition-transform">
              <Icons.Star filled={s <= stars} />
            </button>
          ))}
        </div>

        <textarea 
          placeholder="Conte como foi (opcional)..."
          className="w-full p-4 bg-gray-100 rounded-2xl h-28 outline-none border-none text-sm font-medium focus:ring-1 focus:ring-black transition-all"
          value={comment}
          onChange={e => setComment(e.target.value)}
        />

        <button 
          onClick={handleSubmit}
          className="w-full bg-black text-white py-4 rounded-2xl font-bold text-base shadow-lg active:scale-95 transition-all"
        >
          Enviar Avaliação
        </button>
      </div>
    </Layout>
  );
};

export default Rating;
