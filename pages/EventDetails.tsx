
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Camera, DollarSign, CheckCircle, Image as ImageIcon, Edit, UserCheck, Sparkles, Clock, Check, Zap, Bookmark, Heart, UploadCloud, X, Info, Brain, ChevronRight } from 'lucide-react';
import { Event, User, JobRole, UserRole } from '../types';
import RoleBidModal from './components/RoleBidModal';
import GalleryModal from './components/GalleryModal';
import { getEventMatchScore, EventMatch } from '../services/geminiInsights';

interface EventDetailsProps {
  event: Event;
  user: User;
  onBack: () => void;
  onPlaceBid: (eventId: string, roleId: string | undefined, amount: number, message: string, type: 'PAID' | 'OPEN_SHOOT') => void;
  onUploadPhoto?: (eventId: string, files: File[], type: 'OFFICIAL' | 'OPEN_SHOOT') => void;
  onManage?: () => void;
  userBids?: any[]; 
  onWithdrawBid?: (bidId: string) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ event, user, onBack, onPlaceBid, onUploadPhoto, onManage, userBids = [], onWithdrawBid, isBookmarked, onToggleBookmark }) => {
  const [selectedRole, setSelectedRole] = useState<JobRole | undefined>(undefined);
  const [bidMode, setBidMode] = useState<'PAID' | 'OPEN_SHOOT'>('PAID');
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<{file: File, preview: string}[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<EventMatch | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const isCompleted = event.status === 'COMPLETED';
  const isAcceptedParticipant = userBids.some(b => b.photographerId === user.id && b.status === 'ACCEPTED');

  useEffect(() => {
    if (user.role === UserRole.PHOTOGRAPHER) {
      setIsAnalyzing(true);
      getEventMatchScore(user, event).then(data => {
        setAiAnalysis(data);
        setIsAnalyzing(false);
      });
    }
  }, [event.id, user.id]);

  const handleBidClick = (role: JobRole) => {
    if (user.id === event.ownerId) { onManage?.(); return; }
    setSelectedRole(role);
    setBidMode('PAID');
    setIsBidModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <button onClick={onBack} className="flex items-center text-muted hover:text-espresso transition-colors font-black text-[10px] uppercase tracking-widest">
                <ArrowLeft className="w-4 h-4 mr-2" /> Return to Market
            </button>
            <div className="flex items-center space-x-3">
                <button onClick={onToggleBookmark} className={`p-3 rounded-2xl transition-all shadow-xl border ${isBookmarked ? 'bg-gold border-gold text-espresso' : 'bg-white border-black/5 text-muted hover:text-gold'}`}>
                  <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
            </div>
        </div>

        <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-black/5">
          <div className="relative h-96 w-full">
            <img src={event.imageUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/20 to-transparent flex items-end p-12">
               <div>
                  <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-none">{event.title}</h1>
                  <div className="flex items-center gap-8 text-white/80 font-bold text-sm uppercase tracking-widest">
                    <div className="flex items-center"><Calendar className="w-5 h-5 mr-2 text-gold" />{new Date(event.date).toLocaleDateString()}</div>
                    <div className="flex items-center"><MapPin className="w-5 h-5 mr-2 text-gold" />{event.location}</div>
                  </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 p-12">
            <div className="lg:col-span-8 space-y-12">
              {/* Gemini Fit Insight */}
              {user.role === UserRole.PHOTOGRAPHER && (
                <section className="bg-espresso rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl border-2 border-gold/20">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><Brain className="w-32 h-32" /></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center text-gold space-x-3">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Gemini Career Fit Analysis</span>
                      </div>
                      {isAnalyzing ? <Clock className="w-4 h-4 animate-spin text-gold" /> : (
                        <div className="flex items-baseline space-x-1">
                          <span className="text-4xl font-black text-white">{aiAnalysis?.score}</span>
                          <span className="text-[10px] font-black text-gold uppercase">Match</span>
                        </div>
                      )}
                    </div>
                    
                    {aiAnalysis ? (
                      <div className="space-y-6 animate-fade-in-up">
                        <p className="text-white/80 font-bold leading-relaxed">{aiAnalysis.careerRelevance}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <span className="text-[9px] font-black uppercase tracking-widest text-gold">Strategic Reasoning</span>
                             {aiAnalysis.reasoning.map((r, i) => <div key={i} className="flex items-start text-xs font-medium text-white/60"><ChevronRight className="w-3 h-3 mr-1 mt-0.5 text-gold" />{r}</div>)}
                           </div>
                           <div className="space-y-2">
                             <span className="text-[9px] font-black uppercase tracking-widest text-gold">Projected Skill Growth</span>
                             <div className="flex flex-wrap gap-2">
                               {aiAnalysis.skillGains.map(s => <span key={s} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[8px] uppercase font-black">{s}</span>)}
                             </div>
                           </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-white/40 italic text-sm">Synchronizing career profile with event metadata...</p>
                    )}
                  </div>
                </section>
              )}

              <section>
                <h2 className="text-[10px] font-black text-gold uppercase tracking-[0.4em] mb-4">Event Manifesto</h2>
                <p className="text-espresso leading-relaxed text-xl font-medium">{event.description}</p>
              </section>

              <section>
                <h2 className="text-[10px] font-black text-gold uppercase tracking-[0.4em] mb-8">Professional Roster</h2>
                <div className="space-y-4">
                  {event.roles.map(role => (
                    <div key={role.id} className="bg-white border-2 border-gray-50 p-8 rounded-[2rem] flex justify-between items-center group hover:border-gold/20 transition-all">
                      <div>
                        <h3 className="text-2xl font-black text-espresso">{role.title}</h3>
                        <p className="text-xs text-gold font-black uppercase tracking-widest mt-1">${role.minBudget} — ${role.maxBudget} Allocation</p>
                      </div>
                      <button onClick={() => handleBidClick(role)} className="bg-espresso text-gold px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2A2522] transition-all">Submit Proposal</button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            
            <aside className="lg:col-span-4 space-y-8">
              <div className="bg-cream rounded-[2.5rem] p-8 border border-black/5">
                <h3 className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-6">Gig Intelligence</h3>
                <div className="space-y-6">
                   <div className="flex justify-between border-b border-black/5 pb-4"><span className="text-[10px] font-bold text-muted uppercase">Tier</span><span className="text-xs font-black uppercase">{event.packageType}</span></div>
                   <div className="flex justify-between border-b border-black/5 pb-4"><span className="text-[10px] font-bold text-muted uppercase">Duration</span><span className="text-xs font-black uppercase">{event.isAllDay ? 'Full Day' : 'Fixed Block'}</span></div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
      <RoleBidModal isOpen={isBidModalOpen} onClose={() => setIsBidModalOpen(false)} role={selectedRole} eventTitle={event.title} onSubmit={(a, m) => onPlaceBid(event.id, selectedRole?.id, a, m, bidMode)} mode={bidMode} />
    </div>
  );
};

export default EventDetails;
