
export type Role = 'admin' | 'empresa' | 'profissional';

export interface Profile {
  id: string;
  role: Role;
  name: string;
  phone: string;
  email: string;
  photo_url?: string;
  is_suspended: boolean;
  created_at: string;
}

export interface CompanyProfile {
  user_id: string;
  company_name: string;
  owner_name: string;
  cnpj: string;
  municipal_registration?: string;
  segment: string;
  address: string;
  full_address: string;
  zip_code: string;
  commercial_phone?: string;
  geo_lat: number;
  geo_lng: number;
  is_verified: boolean;
}

export type ApprovalStatus = 'pendente' | 'aprovado' | 'reprovado';

export interface WorkHistory {
  company: string;
  role: string;
  period: string;
}

export interface ProfessionalProfile {
  user_id: string;
  approval_status: ApprovalStatus;
  skills: string[];
  rating_avg: number;
  jobs_completed: number;
  city: string;
  geo_lat: number;
  geo_lng: number;
  docs_verified: boolean;
  bio?: string;
  experience?: WorkHistory[];
}

export type JobStatus = 'aberto' | 'distribuido' | 'match_confirmado' | 'em_andamento' | 'finalizado' | 'cancelado';

export interface JobRequest {
  id: string;
  company_id: string;
  title: string;
  description: string;
  skill_required: string;
  date_start: string;
  duration_hours: number;
  value_offered: number;
  address_text: string;
  geo_lat: number;
  geo_lng: number;
  status: JobStatus;
  created_at: string;
}

export type OfferStatus = 'enviado' | 'aceito' | 'recusado' | 'expirado';

export interface JobOffer {
  id: string;
  job_id: string;
  professional_id: string;
  status: OfferStatus;
  sent_at: string;
}

export type AssignmentStatus = 'a_caminho' | 'cheguei' | 'em_execucao' | 'finalizado';

export interface JobAssignment {
  id: string;
  job_id: string;
  company_id: string;
  professional_id: string;
  status: AssignmentStatus;
  last_lat: number;
  last_lng: number;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export interface ChatThread {
  id: string;
  job_id: string;
  company_id: string;
  professional_id: string;
  created_at: string;
}

export interface Rating {
  id: string;
  job_id: string;
  rater_id: string;
  ratee_id: string;
  stars: number;
  comment: string;
  created_at: string;
}

// Interface do estado do banco para sincronização
export interface DbState {
  last_update: number;
  profiles: Profile[];
  company_profiles: CompanyProfile[];
  professional_profiles: ProfessionalProfile[];
  job_requests: JobRequest[];
  job_offers: JobOffer[];
  job_assignments: JobAssignment[];
  chat_threads: ChatThread[];
  chat_messages: ChatMessage[];
  ratings: Rating[];
}
