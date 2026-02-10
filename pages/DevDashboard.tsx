
import React, { useState, useRef } from 'react';
import { Terminal, Cpu, RefreshCw, AlertTriangle, ExternalLink, Zap, Activity, Database as DatabaseIcon, ShieldCheck, Search, MapPin, Sparkles, Edit3, Save, X, Image as ImageIcon, Trash2, Link as LinkIcon, Calendar, Clock, UploadCloud, XCircle, Briefcase, Filter } from 'lucide-react';
import { Event, User } from '../types';
import { ingestGovernmentEvents } from '../services/geminiEvents';

interface DevDashboardProps {
  events: Event[];
  localPotentialQueue: Partial<Event>[];
  onApprove: (event: Partial<Event>) => void;
  onReject: (event: Partial<Event>) => void;
  onIngest: (newEvents: Partial<Event>[]) => void;
  onAdminDelete: (eventId: string) => void;
  onAdminUpdate: (event: Partial<Event>) => void;
  user: User;
}

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", 
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", 
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", 
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", 
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const DevDashboard: React.FC<DevDashboardProps> = ({ events, localPotentialQueue, onApprove, onReject, onIngest, onAdminDelete, onAdminUpdate, user }) => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'pipeline'>('portfolio');
  const [isIngesting, setIsIngesting] = useState(false);
  const [selectedState, setSelectedState] = useState("Missouri");
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editBuffer, setEditBuffer] = useState<any>(null);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryStateFilter, setInventoryStateFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [logs, setLogs] = useState<string[]>([
    `[ADMIN] Command Center Session Initialized.`,
    `[ADMIN] Primary Profile: ${user.name}`,
    `[SYSTEM] Marketplace Registry: Connected`
  ]);

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 50)]);

  const dbPotentialEvents = events.filter(e => e.status === 'POTENTIAL');
  const combinedQueue = [...localPotentialQueue, ...dbPotentialEvents];
  
  const liveEvents = events.filter(e => e.status !== 'POTENTIAL' && e.status !== 'PENDING_APPROVAL');
  const filteredPortfolio = liveEvents.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(inventorySearch.toLowerCase()) || 
                         e.location.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchesState = inventoryStateFilter === '' || e.location.toLowerCase().includes(inventoryStateFilter.toLowerCase());
    return matchesSearch && matchesState;
  });

  const handleRunIngestor = async () => {
    setIsIngesting(true);
    addLog(`[SYSTEM] Initializing AI Discovery Pipeline for ${selectedState}...`);
    
    const currentTitles = [...events, ...localPotentialQueue].map(e => e.title || '');

    try {
      const results = await ingestGovernmentEvents(selectedState, addLog, currentTitles);
      if (results.length > 0) {
        addLog(`[SUCCESS] Discovery returned ${results.length} candidate(s).`);
        onIngest(results);
      } else {
        addLog("[WARNING] Discovery complete. Zero new candidates found.");
      }
    } catch (err) {
      addLog(`[CRITICAL] Discovery Aborted: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setIsIngesting(false);
    }
  };

  const startEditing = (id: string | number, event: Partial<Event>) => {
    setEditingId(id);
    const eventTime = event.date?.includes('T') ? event.date.split('T')[1].slice(0, 5) : '09:00';
    const eventDate = event.date?.split('T')[0] || '';
    
    setEditBuffer({ 
      ...event, 
      date: eventDate, 
      time: eventTime, 
      endDate: event.endDate?.split('T')[0] || '',
      isAllDay: event.isAllDay ?? true 
    });
    addLog(`[UI] Modification buffer opened for: ${event.title}`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editBuffer) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditBuffer({ ...editBuffer, imageUrl: reader.result as string });
        addLog(`[ASSETS] Local cover image override staged.`);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveEdit = (id: string | number) => {
    if (!editBuffer) return;
    const finalDate = editBuffer.isAllDay ? editBuffer.date : `${editBuffer.date}T${editBuffer.time || '09:00'}:00`;
    const updated = { ...editBuffer, date: finalDate, endDate: editBuffer.endDate || undefined };
    
    if (activeTab === 'portfolio') {
      onAdminUpdate(updated);
    } else {
      // For local queue items, we find by index or title if id isn't set
      onIngest(localPotentialQueue.map((e, i) => (i === id || e.title === editBuffer.title) ? updated : e));
    }
    addLog(`[DATABASE] Sync successful. Record updated.`);
    setEditingId(null);
    setEditBuffer(null);
  };

  const handleCommit = (event: Partial<Event>, id: string | number) => {
    const eventToCommit = editingId === id ? {
      ...editBuffer!,
      date: editBuffer!.isAllDay ? editBuffer!.date : `${editBuffer!.date}T${editBuffer!.time || '09:00'}:00`
    } : event;
    addLog(`[ADMIN] Approving and assuming ownership: ${eventToCommit.title}`);
    onApprove(eventToCommit);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#00FF41] font-mono py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-[#00FF41]/10 pb-10 gap-6">
          <div className="flex items-center space-x-5">
            <div className="p-4 bg-[#00FF41]/10 border border-[#00FF41]/30 rounded-2xl shadow-[0_0_20px_rgba(0,255,65,0.1)]">
              <Briefcase className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter italic">Admin Command Studio</h1>
              <div className="flex items-center mt-3 space-x-6 text-[10px] text-[#00FF41]/50 uppercase tracking-widest font-black">
                <span className="flex items-center"><ShieldCheck className="w-3.5 h-3.5 mr-2" /> Supervisor Privilege: Active</span>
                <span className="flex items-center"><Activity className="w-3.5 h-3.5 mr-2" /> Live Environment: Ready</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex bg-[#141416] p-1 rounded-xl border border-[#00FF41]/20">
               <button onClick={() => { setActiveTab('portfolio'); setEditingId(null); }} className={`px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'portfolio' ? 'bg-[#00FF41] text-black' : 'text-[#00FF41]/40'}`}>Managed Portfolio</button>
               <button onClick={() => { setActiveTab('pipeline'); setEditingId(null); }} className={`px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pipeline' ? 'bg-[#00FF41] text-black' : 'text-[#00FF41]/40'}`}>Event Pipeline</button>
            </div>

            {activeTab === 'pipeline' && (
              <div className="flex gap-4">
                <select 
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="bg-[#141416] border border-[#00FF41]/20 text-[#00FF41] text-xs font-black uppercase p-4 rounded-xl focus:outline-none"
                >
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button 
                  onClick={handleRunIngestor}
                  disabled={isIngesting}
                  className="flex items-center px-8 py-4 bg-[#00FF41] text-black font-black uppercase text-xs tracking-widest hover:bg-[#00CC33] transition-all disabled:opacity-50"
                >
                  {isIngesting ? <RefreshCw className="w-4 h-4 mr-3 animate-spin" /> : <Cpu className="w-4 h-4 mr-3" />}
                  Discover
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-10">
            {activeTab === 'portfolio' ? (
              <div className="space-y-10 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row items-center justify-between border-b border-[#00FF41]/10 pb-6 mb-4 gap-4">
                  <h2 className="text-sm font-black uppercase tracking-[0.5em] flex items-center"><DatabaseIcon className="w-5 h-5 mr-3" /> Marketplace Inventory</h2>
                  <div className="flex gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00FF41]/30" />
                      <input type="text" className="w-full bg-[#141416] border border-[#00FF41]/20 text-[#00FF41] text-xs p-3 pl-10 rounded-xl focus:outline-none" placeholder="Search registry..." value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {filteredPortfolio.map((event) => {
                    const isBeingEdited = editingId === event.id;
                    const currentEvent = isBeingEdited ? editBuffer! : event;

                    return (
                      <div key={event.id} className="bg-[#141416] border border-[#00FF41]/20 p-8 rounded-3xl group transition-all">
                        <div className="flex flex-col md:flex-row items-start gap-8">
                          <div className="w-48 h-48 rounded-2xl overflow-hidden border border-[#00FF41]/10 bg-black relative shadow-2xl flex-shrink-0">
                            <img src={currentEvent.imageUrl} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                            {isBeingEdited && (
                              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                  <UploadCloud className="text-[#00FF41] w-8 h-8 mb-2" />
                                  <span className="text-[9px] uppercase font-black">Swap Visual</span>
                                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-grow space-y-6 w-full">
                            <div className="flex justify-between items-start">
                              {isBeingEdited ? (
                                <input className="bg-black border border-[#00FF41]/30 text-white p-3 rounded w-full text-2xl font-bold focus:outline-none" value={currentEvent.title} onChange={e => setEditBuffer({ ...editBuffer!, title: e.target.value })} />
                              ) : (
                                <h4 className="text-3xl font-black text-white tracking-tighter">{currentEvent.title}</h4>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="flex items-center text-[11px] font-black uppercase text-[#00FF41]/60">
                                <MapPin className="w-4 h-4 mr-2" />
                                {isBeingEdited ? <input className="bg-black border border-[#00FF41]/20 p-2 rounded w-full text-[#00FF41]" value={currentEvent.location} onChange={e => setEditBuffer({ ...editBuffer!, location: e.target.value })} /> : event.location}
                              </div>
                              <div className="flex items-center text-[11px] font-black uppercase text-[#00FF41]/60">
                                <Calendar className="w-4 h-4 mr-2" />
                                {isBeingEdited ? <input type="date" className="bg-black border border-[#00FF41]/20 p-2 rounded w-full text-[#00FF41]" value={currentEvent.date} onChange={e => setEditBuffer({ ...editBuffer!, date: e.target.value })} /> : new Date(event.date).toLocaleDateString()}
                              </div>
                            </div>

                            {isBeingEdited && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-black/40 rounded-2xl border border-[#00FF41]/10">
                                 <div>
                                    <label className="block text-[9px] font-black text-[#00FF41]/40 uppercase mb-2">Reschedule Time</label>
                                    <div className="flex items-center gap-3">
                                       <button type="button" onClick={() => setEditBuffer({ ...editBuffer!, isAllDay: !editBuffer!.isAllDay })} className={`px-3 py-2 rounded text-[9px] font-black uppercase border ${editBuffer?.isAllDay ? 'bg-[#00FF41] text-black border-[#00FF41]' : 'border-[#00FF41]/30 text-[#00FF41]/40'}`}>All Day</button>
                                       {!editBuffer?.isAllDay && <input type="time" className="bg-black border border-[#00FF41]/30 text-[#00FF41] p-2 rounded text-xs" value={editBuffer?.time} onChange={e => setEditBuffer({ ...editBuffer!, time: e.target.value })} />}
                                    </div>
                                 </div>
                                 <div>
                                    <label className="block text-[9px] font-black text-[#00FF41]/40 uppercase mb-2">Duration Control</label>
                                    <div className="flex items-center gap-3">
                                       <button type="button" onClick={() => setEditBuffer({ ...editBuffer!, endDate: editBuffer!.endDate ? '' : editBuffer!.date })} className={`px-3 py-2 rounded text-[9px] font-black uppercase border ${editBuffer?.endDate ? 'bg-[#00FF41] text-black border-[#00FF41]' : 'border-[#00FF41]/30 text-[#00FF41]/40'}`}>Multi-Day</button>
                                       {editBuffer?.endDate && <input type="date" className="bg-black border border-[#00FF41]/30 text-[#00FF41] p-2 rounded text-xs" value={editBuffer?.endDate} onChange={e => setEditBuffer({ ...editBuffer!, endDate: e.target.value })} />}
                                    </div>
                                 </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-8 bg-black/40 p-6 rounded-2xl border border-[#00FF41]/10">
                          {isBeingEdited ? (
                            <textarea rows={3} className="bg-black border border-[#00FF41]/20 p-4 rounded w-full text-white/80 focus:outline-none text-sm" value={currentEvent.description} onChange={e => setEditBuffer({ ...editBuffer!, description: e.target.value })} />
                          ) : (
                            <p className="text-sm italic text-white/70">"{event.description}"</p>
                          )}
                        </div>

                        <div className="mt-8 flex justify-end gap-4">
                          {isBeingEdited ? (
                            <>
                              <button onClick={() => saveEdit(event.id)} className="px-6 py-3 bg-[#00FF41]/20 border border-[#00FF41]/40 text-[#00FF41] font-black uppercase text-[10px] rounded-xl hover:bg-[#00FF41] hover:text-black transition-all"><Save className="w-4 h-4 mr-2" /> Commit Buff</button>
                              <button onClick={() => setEditingId(null)} className="px-4 py-3 border border-white/10 text-white/40 font-black rounded-xl hover:bg-white/5 uppercase text-[10px]">Discard</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEditing(event.id, event)} className="px-6 py-3 border border-[#00FF41]/30 text-[#00FF41] font-black uppercase text-[10px] rounded-xl hover:bg-[#00FF41]/10 transition-all"><Edit3 className="w-4 h-4 mr-2" /> Modify Scope</button>
                              <button onClick={() => onAdminDelete(event.id)} className="px-6 py-3 border border-red-500/30 text-red-500/50 hover:bg-red-500 hover:text-white rounded-xl uppercase text-[10px] font-black transition-all"><Trash2 className="w-4 h-4 mr-2" /> Revoke Event</button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Pipeline View (AI Candidates)
              <>
                <div className="flex items-center justify-between border-b border-[#00FF41]/10 pb-6 mb-4">
                  <h2 className="text-sm font-black uppercase tracking-[0.5em] flex items-center">Candidate Pipeline</h2>
                </div>

                {combinedQueue.length > 0 ? (
                  <div className="space-y-12">
                    {combinedQueue.map((event, idx) => {
                      const isBeingEdited = editingId === `local-${idx}`;
                      const currentEvent = isBeingEdited ? editBuffer! : event;

                      return (
                        <div key={idx} className="bg-[#141416] border border-[#00FF41]/20 p-10 rounded-3xl relative group transition-all">
                          <div className="flex flex-col lg:flex-row gap-10">
                            <div className="w-48 h-48 rounded-2xl overflow-hidden border border-[#00FF41]/10 flex-shrink-0 bg-black relative shadow-2xl">
                              <img src={currentEvent.imageUrl} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                              {isBeingEdited && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <UploadCloud className="text-[#00FF41] w-8 h-8 mb-2" />
                                    <span className="text-[9px] uppercase font-black">Swap Cover</span>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-grow space-y-6">
                                {isBeingEdited ? (
                                  <input className="bg-black border border-[#00FF41]/30 text-white p-3 rounded w-full text-2xl font-bold focus:outline-none" value={currentEvent.title} onChange={e => setEditBuffer({ ...editBuffer!, title: e.target.value })} />
                                ) : (
                                  <h3 className="text-3xl font-black text-white tracking-tighter">{currentEvent.title}</h3>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="flex items-center text-[11px] font-black uppercase text-[#00FF41]/60">
                                    <MapPin className="w-4 h-4 mr-2" />
                                    {isBeingEdited ? <input className="bg-black border border-[#00FF41]/20 p-2 rounded w-full text-[#00FF41]" value={currentEvent.location} onChange={e => setEditBuffer({ ...editBuffer!, location: e.target.value })} /> : currentEvent.location}
                                  </div>
                                  <div className="flex items-center text-[11px] font-black uppercase text-[#00FF41]/60">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {isBeingEdited ? <input type="date" className="bg-black border border-[#00FF41]/20 p-2 rounded w-full text-[#00FF41]" value={currentEvent.date} onChange={e => setEditBuffer({ ...editBuffer!, date: e.target.value })} /> : currentEvent.date?.split('T')[0]}
                                  </div>
                                </div>

                                {isBeingEdited && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-black/40 rounded-2xl border border-[#00FF41]/10">
                                     <div>
                                        <label className="block text-[9px] font-black text-[#00FF41]/40 uppercase mb-2">Time</label>
                                        <div className="flex items-center gap-3">
                                           <button type="button" onClick={() => setEditBuffer({ ...editBuffer!, isAllDay: !editBuffer!.isAllDay })} className={`px-3 py-2 rounded text-[9px] font-black uppercase border ${editBuffer?.isAllDay ? 'bg-[#00FF41] text-black border-[#00FF41]' : 'border-[#00FF41]/30 text-[#00FF41]/40'}`}>All Day</button>
                                           {!editBuffer?.isAllDay && <input type="time" className="bg-black border border-[#00FF41]/30 text-[#00FF41] p-2 rounded text-xs" value={editBuffer?.time} onChange={e => setEditBuffer({ ...editBuffer!, time: e.target.value })} />}
                                        </div>
                                     </div>
                                     <div>
                                        <label className="block text-[9px] font-black text-[#00FF41]/40 uppercase mb-2">Range</label>
                                        <div className="flex items-center gap-3">
                                           <button type="button" onClick={() => setEditBuffer({ ...editBuffer!, endDate: editBuffer!.endDate ? '' : editBuffer!.date })} className={`px-3 py-2 rounded text-[9px] font-black uppercase border ${editBuffer?.endDate ? 'bg-[#00FF41] text-black border-[#00FF41]' : 'border-[#00FF41]/30 text-[#00FF41]/40'}`}>Multi-Day</button>
                                           {editBuffer?.endDate && <input type="date" className="bg-black border border-[#00FF41]/30 text-[#00FF41] p-2 rounded text-xs" value={editBuffer?.endDate} onChange={e => setEditBuffer({ ...editBuffer!, endDate: e.target.value })} />}
                                        </div>
                                     </div>
                                  </div>
                                )}
                            </div>
                          </div>

                          <div className="mt-8 bg-black/40 p-6 rounded-2xl border border-[#00FF41]/10">
                            {isBeingEdited ? (
                              <textarea rows={3} className="bg-black border border-[#00FF41]/20 p-4 rounded w-full text-white/80 focus:outline-none text-sm" value={currentEvent.description} onChange={e => setEditBuffer({ ...editBuffer!, description: e.target.value })} />
                            ) : (
                              <p className="text-sm italic text-white/70">"{currentEvent.description}"</p>
                            )}
                          </div>

                          <div className="mt-8 flex justify-end gap-4">
                            {isBeingEdited ? (
                              <>
                                <button onClick={() => saveEdit(idx)} className="px-6 py-3 bg-[#00FF41]/20 border border-[#00FF41]/40 text-[#00FF41] font-black uppercase text-[10px] rounded-xl hover:bg-[#00FF41] hover:text-black transition-all"><Save className="w-4 h-4 mr-2" /> Save Buff</button>
                                <button onClick={() => setEditingId(null)} className="px-4 py-3 border border-white/10 text-white/40 font-black rounded-xl hover:bg-white/5 uppercase text-[10px]">Discard</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEditing(`local-${idx}`, event)} className="px-6 py-3 border border-[#00FF41]/30 text-[#00FF41] font-black uppercase text-[10px] rounded-xl hover:bg-[#00FF41]/10 transition-all"><Edit3 className="w-4 h-4 mr-2" /> Refine</button>
                                <button onClick={() => handleCommit(event, idx)} className="px-10 py-4 bg-[#00FF41] text-black font-black uppercase text-[10px] tracking-widest rounded-xl shadow-[0_0_20px_rgba(0,255,65,0.3)] hover:bg-[#00CC33] transition-all active:scale-95"><Sparkles className="w-4 h-4 mr-2" /> Assume Ownership</button>
                                <button onClick={() => onReject(event)} className="p-4 border border-red-500/30 text-red-500/50 hover:bg-red-500 hover:text-white rounded-xl transition-all"><XCircle className="w-4 h-4" /></button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-40 text-center border border-dashed border-[#00FF41]/10 rounded-[3rem] text-[#00FF41]/20 font-black uppercase">Discovery required to populate pipeline...</div>
                )}
              </>
            )}
          </div>

          {/* Sidebar: System Logs */}
          <div className="lg:col-span-4">
            <div className="bg-[#141416] border border-[#00FF41]/20 rounded-3xl overflow-hidden sticky top-24 shadow-2xl">
               <div className="bg-[#00FF41]/5 px-8 py-5 border-b border-[#00FF41]/20 text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-between">
                 <span>System Logs</span>
                 <Terminal className="w-3.5 h-3.5" />
               </div>
               <div className="p-10 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar font-mono">
                  {logs.map((log, i) => (
                    <div key={i} className={`text-[11px] leading-tight font-black ${i === 0 ? 'text-[#00FF41]' : 'text-[#00FF41]/40'}`}>{log}</div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #00FF4122; border-radius: 10px; }`}</style>
    </div>
  );
};

export default DevDashboard;
