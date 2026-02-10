
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, Instagram, Globe, Calendar, Camera, Mail, Edit2, Save, X, PartyPopper, Briefcase, User as UserIcon, Link as LinkIcon, Info, User as UserCircle, UploadCloud, RefreshCw, Target, Brain, Sparkles } from 'lucide-react';
import { User, Event, ImageSubmission, UserRole } from '../types';

interface PhotographerProfileProps {
  photographer: User;
  events: Event[]; 
  onBack: () => void;
  isEditable?: boolean;
  onSave?: (data: Partial<User>) => void;
  onEventClick?: (event: Event) => void;
}

const PhotographerProfile: React.FC<PhotographerProfileProps> = ({ photographer, events, onBack, isEditable, onSave, onEventClick }) => {
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState({
    name: photographer.name || '',
    bio: photographer.bio || '',
    website: photographer.website || '',
    instagram: photographer.instagram || '',
    city: photographer.city || '',
    state: photographer.state || '',
    avatarUrl: photographer.avatarUrl || '',
    targetRole: photographer.targetRole || '',
    skills: photographer.skills || [],
    careerGoals: photographer.careerGoals || ''
  });

  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    setEditForm({
      name: photographer.name || '',
      bio: photographer.bio || '',
      website: photographer.website || '',
      instagram: photographer.instagram || '',
      city: photographer.city || '',
      state: photographer.state || '',
      avatarUrl: photographer.avatarUrl || '',
      targetRole: photographer.targetRole || '',
      skills: photographer.skills || [],
      careerGoals: photographer.careerGoals || ''
    });
  }, [photographer, isEditing]);

  const isOwner = photographer.role === UserRole.EVENT_OWNER;
  
  const eventsWithPhotos = !isOwner ? Array.from(new Set((events || []).flatMap(e => 
    (e.submissions || []).filter(s => s.photographerId === photographer.id).map(() => e.id)
  ))).map(id => {
    const event = events.find(e => e.id === id)!;
    const photos = event.submissions!.filter(s => s.photographerId === photographer.id);
    return { event, photos };
  }) : [];

  const handleSave = () => { 
    if (onSave) onSave(editForm); 
    setIsEditing(false); 
  };

  const addSkill = () => {
    if (skillInput && !editForm.skills.includes(skillInput)) {
      setEditForm({ ...editForm, skills: [...editForm.skills, skillInput] });
      setSkillInput('');
    }
  };

  return (
    <div className="min-h-screen bg-cream pb-20">
      <div className="bg-espresso shadow-xl sticky top-0 z-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center text-white/70 hover:text-gold transition-colors font-black text-[10px] uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4 mr-2" /> Return to Studio
          </button>
          {isEditable && !isEditing && (
            <button 
              onClick={() => setIsEditing(true)} 
              className="bg-gold text-espresso font-black text-[10px] uppercase tracking-widest px-6 py-2 rounded-xl hover:bg-[#E5B63D] transition-all flex items-center shadow-lg active:scale-95"
            >
              <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit Visual Identity
            </button>
          )}
          {isEditing && (
             <div className="flex space-x-3">
                <button onClick={() => setIsEditing(false)} className="text-white/50 hover:text-white font-black text-[10px] uppercase tracking-widest px-4 py-2">Discard</button>
                <button onClick={handleSave} className="bg-gold text-espresso font-black text-[10px] uppercase tracking-widest px-8 py-2 rounded-xl shadow-xl active:scale-95">Sync Profile</button>
             </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-black/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
              <Camera className="w-64 h-64" />
            </div>
            
            <div className="flex flex-col md:flex-row items-center md:items-start relative z-10">
                <div className="relative mb-8 md:mb-0 md:mr-10">
                    <div className="h-40 w-40 rounded-[2.5rem] overflow-hidden ring-8 ring-cream shadow-2xl bg-cream">
                      <img src={isEditing ? editForm.avatarUrl : photographer.avatarUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                </div>
                
                <div className="flex-grow text-center md:text-left">
                    <h1 className="text-5xl font-black text-espresso tracking-tighter leading-none">{isEditing ? 'Visual Identity' : photographer.name}</h1>
                    <p className="mt-4 text-gold font-black uppercase tracking-widest text-[10px]">{isOwner ? 'Executive Planner' : 'Visual Specialist'}</p>

                    {isEditing ? (
                      <div className="mt-10 space-y-12">
                        <section className="bg-cream/30 p-8 rounded-[2rem] border border-black/5">
                          <h3 className="text-xs font-black text-espresso uppercase tracking-widest mb-6 flex items-center">
                            <Target className="w-4 h-4 mr-2 text-gold" /> Career Strategy (AI Context)
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                              <label className="block text-[10px] font-black text-espresso uppercase tracking-widest mb-2">Target Role</label>
                              <input 
                                type="text"
                                className="w-full bg-white border border-black/10 rounded-xl py-3 px-4 font-bold text-sm"
                                placeholder="e.g. Luxury Wedding Lead"
                                value={editForm.targetRole}
                                onChange={(e) => setEditForm({...editForm, targetRole: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-espresso uppercase tracking-widest mb-2">Portfolio Goals</label>
                              <input 
                                type="text"
                                className="w-full bg-white border border-black/10 rounded-xl py-3 px-4 font-bold text-sm"
                                placeholder="e.g. Capture more high-end indoor gala lighting"
                                value={editForm.careerGoals}
                                onChange={(e) => setEditForm({...editForm, careerGoals: e.target.value})}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-black text-espresso uppercase tracking-widest mb-2">Skills & Specializations</label>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {editForm.skills.map(s => (
                                  <span key={s} className="bg-espresso text-gold text-[10px] font-black px-3 py-1 rounded-full flex items-center">
                                    {s} <X onClick={() => setEditForm({...editForm, skills: editForm.skills.filter(i => i !== s)})} className="ml-2 w-3 h-3 cursor-pointer" />
                                  </span>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <input 
                                  className="flex-grow bg-white border border-black/10 rounded-xl py-2 px-4 text-sm"
                                  value={skillInput}
                                  onChange={e => setSkillInput(e.target.value)}
                                  onKeyPress={e => e.key === 'Enter' && addSkill()}
                                  placeholder="Add skill..."
                                />
                                <button type="button" onClick={addSkill} className="bg-espresso text-white px-4 rounded-xl text-xs font-black">Add</button>
                              </div>
                            </div>
                          </div>
                        </section>

                        <section className="bg-cream/30 p-8 rounded-[2rem] border border-black/5">
                           <h3 className="text-xs font-black text-espresso uppercase tracking-widest mb-6 flex items-center">
                            <Info className="w-4 h-4 mr-2 text-gold" /> General Info
                          </h3>
                           <textarea 
                              rows={4}
                              className="w-full bg-white border border-black/10 rounded-xl py-3 px-4 font-bold text-sm mb-6"
                              placeholder="Your artistic bio..."
                              value={editForm.bio}
                              onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                            />
                           <div className="grid grid-cols-2 gap-4">
                              <input className="bg-white border border-black/10 rounded-xl p-3 text-sm" placeholder="City" value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} />
                              <input className="bg-white border border-black/10 rounded-xl p-3 text-sm" placeholder="Instagram" value={editForm.instagram} onChange={e => setEditForm({...editForm, instagram: e.target.value})} />
                           </div>
                        </section>
                      </div>
                    ) : (
                      <div className="mt-8 space-y-10">
                        <p className="text-espresso text-lg leading-relaxed max-w-2xl font-medium">{photographer.bio || "Creative bio pending..."}</p>
                        
                        {!isOwner && (
                          <div className="flex gap-4">
                            <div className="bg-espresso rounded-3xl p-6 flex-1 border border-gold/20 shadow-2xl relative overflow-hidden group">
                              <Sparkles className="absolute top-2 right-2 text-gold/20 w-8 h-8" />
                              <h4 className="text-gold font-black text-[9px] uppercase tracking-widest mb-2 flex items-center"><Brain className="w-3 h-3 mr-2" /> AI Strategy Lens</h4>
                              <p className="text-white text-sm font-bold">{photographer.targetRole || 'Awaiting Target Role'}</p>
                              <div className="flex flex-wrap gap-2 mt-4">
                                {photographer.skills.map(s => <span key={s} className="text-[8px] bg-white/5 text-white/50 px-2 py-0.5 rounded border border-white/10 uppercase font-black">{s}</span>)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                </div>
            </div>
        </div>

        {!isOwner && (
          <div className="mt-20">
              <h2 className="text-3xl font-black text-espresso tracking-tight mb-10 flex items-center"><PartyPopper className="w-8 h-8 mr-4 text-gold" /> Event Retrospectives</h2>
              <div className="grid grid-cols-1 gap-12">
                  {eventsWithPhotos.map(({ event, photos }) => (
                      <div key={event.id} className="bg-white rounded-[3rem] shadow-xl border border-black/5 overflow-hidden">
                          <div className="px-10 py-6 bg-cream border-b border-black/5 flex justify-between items-center cursor-pointer hover:bg-cream/80 transition-all" onClick={() => onEventClick?.(event)}>
                              <h3 className="text-xl font-black text-espresso tracking-tight">{event.title}</h3>
                              <span className="text-[9px] font-black bg-espresso text-gold px-4 py-2 rounded-xl uppercase tracking-widest">{photos.length} Deliverables</span>
                          </div>
                          <div className="p-10 grid grid-cols-2 md:grid-cols-5 gap-6">
                              {photos.map(p => (
                                <div key={p.id} className="aspect-square rounded-2xl overflow-hidden bg-cream shadow-md group">
                                  <img src={p.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                </div>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotographerProfile;
